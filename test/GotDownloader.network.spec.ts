import * as fs from 'fs-extra';
import * as path from 'path';

import { GotDownloader } from '../src/GotDownloader';
import { withTempDirectory } from '../src/utils';
import { EventEmitter } from 'events';

describe('GotDownloader', () => {
  describe('download()', () => {
    it('should download a remote file to the given file path', async () => {
      const downloader = new GotDownloader();
      await withTempDirectory(async dir => {
        const testFile = path.resolve(dir, 'test.txt');
        expect(await fs.pathExists(testFile)).toEqual(false);
        await downloader.download(
          'https://github.com/electron/electron/releases/download/v2.0.18/SHASUMS256.txt',
          testFile,
        );
        expect(await fs.pathExists(testFile)).toEqual(true);
        expect(await fs.readFile(testFile, 'utf8')).toMatchSnapshot();
      });
    });

    it('should throw an error if the file does not exist', async function() {
      if (process.platform === 'win32') {
        return;
      }
      const downloader = new GotDownloader();
      await withTempDirectory(async dir => {
        const testFile = path.resolve(dir, 'test.txt');
        await expect(
          downloader.download(
            'https://github.com/electron/electron/releases/download/v2.0.18/bad.file',
            testFile,
          ),
        ).rejects.toMatchInlineSnapshot(`[HTTPError: Response code 404 (Not Found)]`);
      });
    });

    it('should throw an error if the file write stream fails', async () => {
      const downloader = new GotDownloader();
      const spy = jest.spyOn(fs, 'createWriteStream');
      spy.mockImplementationOnce(() => {
        const emitter = new EventEmitter();
        setTimeout(() => emitter.emit('error', 'bad write error thing'), 10);
        return emitter as any;
      });
      await withTempDirectory(async dir => {
        const testFile = path.resolve(dir, 'test.txt');
        await expect(
          downloader.download(
            'https://github.com/electron/electron/releases/download/v2.0.18/bad.file',
            testFile,
          ),
        ).rejects.toMatchInlineSnapshot(`"bad write error thing"`);
      });
    });

    it('should download to a deep uncreated path', async () => {
      const downloader = new GotDownloader();
      await withTempDirectory(async dir => {
        const testFile = path.resolve(dir, 'f', 'b', 'test.txt');
        expect(await fs.pathExists(testFile)).toEqual(false);
        await expect(
          downloader.download(
            'https://github.com/electron/electron/releases/download/v2.0.1/SHASUMS256.txt',
            testFile,
          ),
        ).resolves.toBeUndefined();
        expect(await fs.pathExists(testFile)).toEqual(true);
        expect(await fs.readFile(testFile, 'utf8')).toMatchSnapshot();
      });
    });
  });
});
