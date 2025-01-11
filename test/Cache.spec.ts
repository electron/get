import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Cache } from '../src/Cache';

describe('Cache', () => {
  let cacheDir: string;
  let cache: Cache;

  const dummyUrl = 'dummy://dummypath';
  const sanitizedDummyUrl = '0c57d948bd4829db99d75c3b4a5d6836c37bc335f38012981baf5d1193b5a612';

  beforeEach(async () => {
    cacheDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'electron-download-spec-'));
    cache = new Cache(cacheDir);
  });

  afterEach(() => fs.promises.rm(cacheDir, { recursive: true, force: true }));

  describe('getCachePath()', () => {
    it('should strip the hash and query params off the url', async () => {
      const firstUrl = 'https://example.com?foo=1';
      const secondUrl = 'https://example.com?foo=2';
      const assetName = 'electron-v7.2.4-darwin-x64.zip-v7.2.4-darwin-x64.zip';

      expect(cache.getCachePath(firstUrl, assetName)).toEqual(
        cache.getCachePath(secondUrl, assetName),
      );
    });
  });

  describe('getPathForFileInCache()', () => {
    it('should return null for a file not in the cache', async () => {
      expect(cache.getPathForFileInCache(dummyUrl, 'test.txt')).toBeNull();
    });

    it('should return an absolute path for a file in the cache', async () => {
      const cacheFolder = path.resolve(cacheDir, sanitizedDummyUrl);
      await fs.promises.mkdir(cacheFolder, { recursive: true });
      const cachePath = path.resolve(cacheFolder, 'test.txt');
      await fs.promises.writeFile(cachePath, 'dummy data');
      expect(cache.getPathForFileInCache(dummyUrl, 'test.txt')).toEqual(cachePath);
    });
  });

  describe('putFileInCache()', () => {
    it('should throw an error if the provided file path does not exist', async () => {
      const fakePath = path.resolve(__dirname, 'fake.file');
      await expect(cache.putFileInCache(dummyUrl, fakePath, 'fake.file')).rejects.toHaveProperty(
        'message',
        expect.stringContaining(`ENOENT: no such file or directory, rename '${fakePath}'`),
      );
    });

    it('should delete the original file', async () => {
      const originalFolder = path.resolve(cacheDir, sanitizedDummyUrl);
      await fs.promises.mkdir(originalFolder, { recursive: true });
      const originalPath = path.resolve(originalFolder, 'original.txt');
      await fs.promises.writeFile(originalPath, 'dummy data');
      await cache.putFileInCache(dummyUrl, originalPath, 'test.txt');
      expect(fs.existsSync(originalPath)).toEqual(false);
    });

    it('should create a new file in the cache with exactly the same content', async () => {
      const originalFolder = path.resolve(cacheDir, sanitizedDummyUrl);
      await fs.promises.mkdir(originalFolder, { recursive: true });
      const originalPath = path.resolve(originalFolder, 'original.txt');
      await fs.promises.writeFile(originalPath, 'example content');
      const cachePath = await cache.putFileInCache(dummyUrl, originalPath, 'test.txt');
      expect(cachePath.startsWith(cacheDir)).toEqual(true);
      expect(await fs.promises.readFile(cachePath, 'utf8')).toEqual('example content');
    });

    it('should overwrite the file if it already exists in cache', async () => {
      const originalFolder = path.resolve(cacheDir, sanitizedDummyUrl);
      await fs.promises.mkdir(originalFolder, { recursive: true });
      const originalPath = path.resolve(cacheDir, 'original.txt');
      await fs.promises.writeFile(originalPath, 'example content');
      await fs.promises.writeFile(
        path.resolve(cacheDir, sanitizedDummyUrl, 'test.txt'),
        'bad content',
      );
      const cachePath = await cache.putFileInCache(dummyUrl, originalPath, 'test.txt');
      expect(cachePath.startsWith(cacheDir)).toEqual(true);
      expect(await fs.promises.readFile(cachePath, 'utf8')).toEqual('example content');
    });
  });
});
