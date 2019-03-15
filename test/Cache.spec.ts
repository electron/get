import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import { Cache } from '../src/Cache';

describe('Cache', () => {
  let cacheDir: string;
  let cache: Cache;

  beforeEach(async () => {
    cacheDir = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-download-spec-'));
    cache = new Cache(cacheDir);
  });

  afterEach(() => fs.remove(cacheDir));

  describe('getPathForFileInCache()', () => {
    it('should return null for a file not in the cache', async () => {
      expect(await cache.getPathForFileInCache('test.txt')).toBeNull();
    });

    it('should return an absolute path for a file in the cache', async () => {
      const cachePath = path.resolve(cacheDir, 'test.txt');
      await fs.writeFile(cachePath, 'dummy data');
      expect(await cache.getPathForFileInCache('test.txt')).toEqual(cachePath);
    });
  });

  describe('putFileInCache()', () => {
    it('should throw an error if the provided file path does not exist', async () => {
      const fakePath = path.resolve(__dirname, 'fake.file');
      await expect(cache.putFileInCache(fakePath, 'fake.file')).rejects.toHaveProperty(
        'message',
        `ENOENT: no such file or directory, stat '${fakePath}'`,
      );
    });

    it('should delete the original file', async () => {
      const originalPath = path.resolve(cacheDir, 'original.txt');
      await fs.writeFile(originalPath, 'dummy data');
      await cache.putFileInCache(originalPath, 'test.txt');
      expect(await fs.pathExists(originalPath)).toEqual(false);
    });

    it('should create a new file in the cache with exactly the same content', async () => {
      const originalPath = path.resolve(cacheDir, 'original.txt');
      await fs.writeFile(originalPath, 'example content');
      const cachePath = await cache.putFileInCache(originalPath, 'test.txt');
      expect(cachePath.startsWith(cacheDir)).toEqual(true);
      expect(await fs.readFile(cachePath, 'utf8')).toEqual('example content');
    });

    it('should overwrite the file if it already exists in cache', async () => {
      const originalPath = path.resolve(cacheDir, 'original.txt');
      await fs.writeFile(originalPath, 'example content');
      await fs.writeFile(path.resolve(cacheDir, 'test.txt'), 'bad content');
      const cachePath = await cache.putFileInCache(originalPath, 'test.txt');
      expect(cachePath.startsWith(cacheDir)).toEqual(true);
      expect(await fs.readFile(cachePath, 'utf8')).toEqual('example content');
    });
  });
});
