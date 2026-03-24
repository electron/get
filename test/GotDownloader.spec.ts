import fs from 'graceful-fs';
import os from 'node:os';
import path from 'node:path';

import { PathLike } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GotDownloader } from '../src/GotDownloader';

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe('GotDownloader', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'got-spec-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    delete process.env.ELECTRON_GET_NO_PROGRESS;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('progress bar suppression', () => {
    it('should not schedule a progress bar timer when quiet: true', async () => {
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      vi.useFakeTimers();

      const downloader = new GotDownloader();
      const target = path.resolve(tmpDir, 'out.txt');

      const p = downloader.download('http://127.0.0.1:1/nope', target, { quiet: true });
      p.catch(() => {
        /* ignore */
      });

      await flushMicrotasks();

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

      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
      await p.catch(() => {
        /* ignore */
      });
    });
  });

  describe('timer cleanup', () => {
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

      expect(vi.getTimerCount()).toBe(0);

      vi.clearAllTimers();
    });
  });
});
