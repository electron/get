import fs from 'graceful-fs';
import path from 'node:path';
import util from 'node:util';

import { describe, expect, it, vi } from 'vitest';

import { GotDownloader } from '../src/GotDownloader';
import { TempDirCleanUpMode, withTempDirectory } from '../src/utils';
import { PathLike } from 'node:fs';

describe('GotDownloader', () => {
  describe('download()', () => {
    it('should download a remote file to the given file path', async () => {
      const downloader = new GotDownloader();
      let progressCallbackCalled = false;
      await withTempDirectory(async (dir) => {
        const testFile = path.resolve(dir, 'test.txt');
        expect(fs.existsSync(testFile)).toEqual(false);
        await downloader.download(
          'https://github.com/electron/electron/releases/download/v2.0.18/SHASUMS256.txt',
          testFile,
          {
            getProgressCallback: (/* progress: Progress */) => {
              progressCallbackCalled = true;
              return Promise.resolve();
            },
          },
        );
        expect(fs.existsSync(testFile)).toEqual(true);
        expect(await util.promisify(fs.readFile)(testFile, 'utf8')).toMatchSnapshot();
        expect(progressCallbackCalled).toEqual(true);
      }, TempDirCleanUpMode.CLEAN);
    });

    it('should throw an error if the file does not exist', async () => {
      const downloader = new GotDownloader();
      await withTempDirectory(async (dir) => {
        const testFile = path.resolve(dir, 'test.txt');
        const url = 'https://github.com/electron/electron/releases/download/v2.0.18/bad.file';
        const snapshot = `[HTTPError: Response code 404 (Not Found) for ${url}]`;
        await expect(downloader.download(url, testFile)).rejects.toMatchInlineSnapshot(snapshot);
      }, TempDirCleanUpMode.CLEAN);
    });

    it('should throw an error if the file write stream fails', async () => {
      const downloader = new GotDownloader();
      const createWriteStream = fs.createWriteStream;
      const spy = vi.spyOn(fs, 'createWriteStream');
      spy.mockImplementationOnce((path: PathLike) => {
        const stream = createWriteStream(path);
        setTimeout(() => stream.emit('error', 'bad write error thing'), 0);
        return stream;
      });
      await withTempDirectory(async (dir) => {
        const testFile = path.resolve(dir, 'test.txt');
        await expect(
          downloader.download(
            'https://github.com/electron/electron/releases/download/v2.0.18/SHASUMS256.txt',
            testFile,
          ),
        ).rejects.toMatchInlineSnapshot(`"bad write error thing"`);
      }, TempDirCleanUpMode.CLEAN);
    });

    it('should download to a deep uncreated path', async () => {
      const downloader = new GotDownloader();
      await withTempDirectory(async (dir) => {
        const testFile = path.resolve(dir, 'f', 'b', 'test.txt');
        expect(fs.existsSync(testFile)).toEqual(false);
        await expect(
          downloader.download(
            'https://github.com/electron/electron/releases/download/v2.0.1/SHASUMS256.txt',
            testFile,
          ),
        ).resolves.toBeUndefined();
        expect(fs.existsSync(testFile)).toEqual(true);
        expect(await util.promisify(fs.readFile)(testFile, 'utf8')).toMatchSnapshot();
      }, TempDirCleanUpMode.CLEAN);
    });

    it('should abort a running download and remove partial file', async () => {
      const downloader = new GotDownloader();
      // create a tiny HTTP server that streams data slowly so we can abort mid-download
      const http = await import('node:http');

      const server = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
        let i = 0;
        const iv = setInterval(() => {
          if (i++ > 20) {
            clearInterval(iv);
            res.end();
            return;
          }
          // write a chunk
          res.write(Buffer.alloc(1024, 'a'));
        }, 50);
      });

      await new Promise<void>((resolve) => server.listen(0, resolve));
      await withTempDirectory(async (dir) => {
        const testFile = path.resolve(dir, 'f', 'b', 'test.txt');
        console.log('testFile: ', testFile);
        await expect(fs.existsSync(testFile)).toEqual(false);

        const controller = new AbortController();

        // start the download but abort shortly after
        const downloadPromise = downloader.download(
          'https://github.com/electron/electron/releases/download/v2.0.1/SHASUMS256.txt',
          testFile,
          {
            // pass the AbortSignal through to got options
            signal: controller.signal,
          },
        );

        // abort after 200ms (during the stream)
        await setTimeout(() => controller.abort(), 20);

        await expect(downloadPromise).rejects.toThrow('The download was aborted');
        // partial file should have been removed
        await expect(fs.existsSync(testFile)).toEqual(false);
      }, TempDirCleanUpMode.CLEAN);

      server.close();
    });
  });
});
