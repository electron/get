import fs from 'graceful-fs';
import path from 'node:path';
import util from 'node:util';

import { describe, expect, it, vi } from 'vitest';

import { GotDownloader } from '../src/GotDownloader';
import { TempDirCleanUpMode, withTempDirectory } from '../src/utils';
import { EventEmitter } from 'events';

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
      const spy = vi.spyOn(fs, 'createWriteStream');
      spy.mockImplementationOnce(() => {
        const emitter = new EventEmitter();
        setTimeout(() => emitter.emit('error', 'bad write error thing'), 10);
        return emitter as fs.WriteStream;
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
  });
});
