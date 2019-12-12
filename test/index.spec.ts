import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import { download, downloadArtifact } from '../src';

// Mock the downloads to save time and bandwidth
jest.mock('../src/GotDownloader', () => {
  return {
    GotDownloader: function () {
      return {
        download: jest.fn(async (url: string, targetFilePath: string, options?: any) => {
          await fs.writeFile(targetFilePath, 'fake content');
        }),
      };
    }
  };
});

jest.mock('sumchecker');

describe('Public API', () => {
  jest.setTimeout(120000);

  let cacheRoot: string;
  beforeEach(async () => {
    cacheRoot = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-download-spec-'));
  });

  afterEach(async () => {
    await fs.remove(cacheRoot);
  });

  describe('download()', () => {
    it('should return a valid path to a downloaded zip file', async () => {
      const zipPath = await download('2.0.10', {
        cacheRoot,
      });
      expect(typeof zipPath).toEqual('string');
      expect(await fs.pathExists(zipPath)).toEqual(true);
      expect(path.extname(zipPath)).toEqual('.zip');
    });

    it('should return a valid path to a downloaded zip file for nightly releases', async () => {
      const zipPath = await download('6.0.0-nightly.20190213', {
        cacheRoot,
      });
      expect(typeof zipPath).toEqual('string');
      expect(await fs.pathExists(zipPath)).toEqual(true);
      expect(path.extname(zipPath)).toEqual('.zip');
    });

    it('should not redownload when force=false', async () => {
      const zipPath = await download('2.0.9', {
        cacheRoot,
        force: false,
      });
      await fs.writeFile(zipPath, 'bad content');
      const zipPath2 = await download('2.0.9', {
        cacheRoot,
        force: false,
      });
      expect(zipPath).toEqual(zipPath2);
      expect(await fs.readFile(zipPath, 'utf8')).toEqual('bad content');
    });

    it('should redownload when force=true', async () => {
      const zipPath = await download('2.0.9', {
        cacheRoot,
        force: true,
      });
      const hash = crypto
        .createHash('sha256')
        .update(await fs.readFile(zipPath))
        .digest('hex');
      await fs.writeFile(zipPath, 'bad content');
      const zipPath2 = await download('2.0.9', {
        cacheRoot,
        force: true,
      });
      expect(zipPath).toEqual(zipPath2);
      const hash2 = crypto
        .createHash('sha256')
        .update(await fs.readFile(zipPath2))
        .digest('hex');
      expect(hash).toEqual(hash2);
    });

    it('should accept a custom downloader', async () => {
      const zipPath = await download('2.0.3', {
        cacheRoot,
        downloader: {
          async download(url, targetPath) {
            expect(
              url.replace(process.platform, 'platform').replace(process.arch, 'arch'),
            ).toMatchSnapshot();
            await fs.writeFile(targetPath, 'faked from downloader');
          },
        },
      });
      expect(await fs.readFile(zipPath, 'utf8')).toEqual('faked from downloader');
    });

    it('should pass download options to a custom downloader', async () => {
      const downloadOpts = {
        magic: 'option',
        trick: 'shot',
      };
      await download('2.0.3', {
        cacheRoot,
        downloader: {
          async download(url, targetPath, opts) {
            expect(opts).toStrictEqual(downloadOpts);
            await fs.writeFile(targetPath, 'file');
          },
        },
        downloadOptions: downloadOpts,
      });
    });
  });

  describe('downloadArtifact()', () => {
    it('should work for electron.d.ts', async () => {
      const dtsPath = await downloadArtifact({
        cacheRoot,
        isGeneric: true,
        version: '2.0.9',
        artifactName: 'electron.d.ts',
      });
      expect(await fs.pathExists(dtsPath)).toEqual(true);
      expect(path.basename(dtsPath)).toEqual('electron.d.ts');
    });

    it('should work default platform/arch', async () => {
      await downloadArtifact({
        version: '2.0.3',
        artifactName: 'electron',
      });
    });

    it('should work for chromedriver', async () => {
      const driverPath = await downloadArtifact({
        cacheRoot,
        version: '2.0.9',
        artifactName: 'chromedriver',
        platform: 'darwin',
        arch: 'x64',
      });
      expect(await fs.pathExists(driverPath)).toEqual(true);
      expect(path.basename(driverPath)).toMatchInlineSnapshot(
        `"chromedriver-v2.0.9-darwin-x64.zip"`,
      );
      expect(path.extname(driverPath)).toEqual('.zip');
    });
  });
});
