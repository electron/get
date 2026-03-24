import fs from 'graceful-fs';
import os from 'node:os';
import path from 'node:path';

import { PathLike } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GotDownloader } from '../src/GotDownloader';
import { downloadArtifact } from '../src';
import { ElectronDownloadCacheMode } from '../src/types';
import { FixtureDownloader } from './FixtureDownloader';

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe('Bug: GotDownloader progress bar suppression', () => {
  // The documentation for `quiet` says:
  //   "if `true`, disables the console progress bar (setting the
  //    `ELECTRON_GET_NO_PROGRESS` environment variable to a non-empty value
  //    also does this)."
  //
  // The condition at src/GotDownloader.ts:52 is:
  //   if (!quiet || !process.env.ELECTRON_GET_NO_PROGRESS) {
  //
  // With `||`, the progress timer is scheduled whenever EITHER side is
  // truthy, meaning you need BOTH `quiet: true` AND the env var set to
  // suppress it. The correct operator is `&&`.

  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'got-bug-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    delete process.env.ELECTRON_GET_NO_PROGRESS;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not schedule a progress bar timer when quiet: true', async () => {
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    vi.useFakeTimers();

    const downloader = new GotDownloader();
    const target = path.resolve(tmpDir, 'out.txt');

    const p = downloader.download('http://127.0.0.1:1/nope', target, { quiet: true });
    p.catch(() => {
      /* ignore */
    });

    // Let the `await fs.promises.mkdir()` inside download() resolve so the
    // progress-bar scheduling code runs.
    await flushMicrotasks();

    // With the bug: a 30-second timer IS scheduled because
    //   !quiet || !env  ->  false || true  ->  true
    // Expected: no timer scheduled.
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
    await p.catch(() => {
      /* ignore */
    });
  });

  it('should not schedule a progress bar timer when ELECTRON_GET_NO_PROGRESS is set', async () => {
    process.env.ELECTRON_GET_NO_PROGRESS = '1';
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
    vi.useFakeTimers();

    const downloader = new GotDownloader();
    const target = path.resolve(tmpDir, 'out.txt');

    const p = downloader.download('http://127.0.0.1:1/nope', target);
    p.catch(() => {
      /* ignore */
    });

    await flushMicrotasks();

    // With the bug: a 30-second timer IS scheduled because
    //   !quiet || !env  ->  true || false  ->  true
    // Expected: no timer scheduled.
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
    await p.catch(() => {
      /* ignore */
    });
  });
});

describe('Bug: GotDownloader timer leak on download error', () => {
  // At src/GotDownloader.ts:79-91, if `pipeline()` throws, the error is
  // re-thrown before `clearTimeout(timeout)` runs. The 30-second timer
  // remains armed and will fire, creating a progress bar for a download
  // that already failed. The cleanup should be in a `finally` block.

  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'got-bug-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should clear the progress timer even when the download fails', async () => {
    vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);

    const realCreateWriteStream = fs.createWriteStream;
    vi.spyOn(fs, 'createWriteStream').mockImplementationOnce((p: PathLike) => {
      const stream = realCreateWriteStream(p);
      setImmediate(() => stream.emit('error', new Error('boom')));
      return stream;
    });

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    const downloader = new GotDownloader();
    const target = path.resolve(tmpDir, 'out.txt');

    await expect(downloader.download('http://127.0.0.1:1/nope', target)).rejects.toThrow();

    // With the bug: the 30-second progress-bar timer is still armed after
    // the download has already rejected.
    // Expected: all timers scheduled by download() are cleared on failure.
    expect(vi.getTimerCount()).toBe(0);

    vi.clearAllTimers();
  });
});

describe('Bug: initializeProxy uses require() in an ESM module', () => {
  // src/proxy.ts:36 calls `require('global-agent')`. Since package.json
  // declares `"type": "module"`, `require` is not defined at runtime in the
  // built `dist/` output. The try/catch swallows the ReferenceError, so
  // proxy support silently never works.
  //
  // NOTE: vitest injects a `require` shim into the test environment, so this
  // bug does NOT reproduce under vitest. It only manifests when the built
  // package is imported by plain Node.js. Run the built output directly to
  // observe the ReferenceError:
  //
  //   yarn build && node -e "import('./dist/proxy.js').then(m => m.initializeProxy())"
  //
  // Output (with DEBUG=@electron/get:proxy):
  //   ReferenceError: require is not defined

  it('documents the require-in-ESM bug (cannot reproduce under vitest)', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../src/proxy.ts'), 'utf8');
    // This assertion fails while the bug exists: the source still uses
    // bare `require(` which is undefined in ESM. The fix is to use
    // `createRequire(import.meta.url)` or a dynamic `import()`.
    expect(source).not.toMatch(/\brequire\(['"]global-agent['"]\)/);
  });
});

describe('Bug: SHASUMS256.txt download ignores custom tempDirectory', () => {
  // When validateArtifact() downloads SHASUMS256.txt (src/index.ts:77-88),
  // it does not forward `artifactDetails.tempDirectory` to the nested
  // downloadArtifact call. The checksum file is therefore written to
  // os.tmpdir() even when the caller explicitly requested a different
  // temp directory (e.g. because os.tmpdir() is read-only or on a
  // different filesystem).

  let cacheRoot: string;
  let customTemp: string;

  beforeEach(async () => {
    cacheRoot = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'cache-'));
    customTemp = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'custom-temp-'));
  });

  afterEach(async () => {
    await fs.promises.rm(cacheRoot, { recursive: true, force: true });
    await fs.promises.rm(customTemp, { recursive: true, force: true });
  });

  it('should use the custom tempDirectory for the SHASUMS256.txt download', async () => {
    const shasumsTargetDirs: string[] = [];

    const trackingDownloader = {
      async download(url: string, targetFilePath: string): Promise<void> {
        if (url.endsWith('SHASUMS256.txt')) {
          shasumsTargetDirs.push(path.dirname(targetFilePath));
        }
        return new FixtureDownloader().download(url, targetFilePath);
      },
    };

    await downloadArtifact({
      artifactName: 'electron',
      version: '2.0.9',
      platform: 'darwin',
      arch: 'x64',
      cacheRoot,
      tempDirectory: customTemp,
      downloader: trackingDownloader,
      cacheMode: ElectronDownloadCacheMode.WriteOnly,
    });

    expect(shasumsTargetDirs.length).toBeGreaterThan(0);
    for (const dir of shasumsTargetDirs) {
      // With the bug: SHASUMS256.txt is downloaded under os.tmpdir(), not customTemp.
      // Expected: all temp paths should be under the user-supplied tempDirectory.
      expect(dir.startsWith(customTemp)).toBe(true);
    }
  });
});

describe('Bug: validateArtifact leaks its temp directory in ORPHAN mode', () => {
  // validateArtifact() (src/index.ts:47-121) creates its own temp directory
  // via withTempDirectoryIn(). When the outer cacheMode makes
  // doesCallerOwnTemporaryOutput() true (ReadOnly or Bypass), it passes
  // TempDirCleanUpMode.ORPHAN, relying on the `finally` at line 113 to
  // clean up. But when checksums are NOT provided, shasumPath lives in a
  // *different* temp directory (created by the nested downloadArtifact for
  // SHASUMS256.txt), so the `finally` deletes that other directory and the
  // validateArtifact tempFolder is never removed.

  let cacheRoot: string;
  let customTemp: string;

  beforeEach(async () => {
    cacheRoot = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'cache-'));
    customTemp = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'custom-temp-'));
  });

  afterEach(async () => {
    await fs.promises.rm(cacheRoot, { recursive: true, force: true });
    await fs.promises.rm(customTemp, { recursive: true, force: true });
  });

  it('should not leave empty electron-download-* directories behind', async () => {
    const downloader = new FixtureDownloader();

    const before = await fs.promises.readdir(customTemp);
    expect(before).toEqual([]);

    const artifactPath = await downloadArtifact({
      artifactName: 'electron',
      version: '2.0.9',
      platform: 'darwin',
      arch: 'x64',
      cacheRoot,
      tempDirectory: customTemp,
      downloader,
      cacheMode: ElectronDownloadCacheMode.Bypass,
    });

    // The caller owns the output directory and is expected to clean it up.
    await fs.promises.rm(path.dirname(artifactPath), { recursive: true, force: true });

    // After the caller has cleaned up their artifact, nothing else should
    // remain in the custom temp directory. With the bug, an empty
    // `electron-download-XXXXXX` directory created by validateArtifact()
    // is left behind.
    const after = await fs.promises.readdir(customTemp);
    expect(after).toEqual([]);
  });
});
