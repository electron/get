import debug from 'debug';
import envPaths from 'env-paths';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import * as crypto from 'crypto';

const d = debug('@electron/get:cache');

const defaultCacheRoot = envPaths('electron', {
  suffix: '',
}).cache;

export class Cache {
  constructor(private cacheRoot = defaultCacheRoot) {}

  public static getCacheDirectory(downloadUrl: string): string {
    const parsedDownloadUrl = url.parse(downloadUrl);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search, hash, pathname, ...rest } = parsedDownloadUrl;
    const strippedUrl = url.format({ ...rest, pathname: path.dirname(pathname || 'electron') });

    return crypto
      .createHash('sha256')
      .update(strippedUrl)
      .digest('hex');
  }

  public getCachePath(downloadUrl: string, fileName: string): string {
    return path.resolve(this.cacheRoot, Cache.getCacheDirectory(downloadUrl), fileName);
  }

  public async getPathForFileInCache(url: string, fileName: string): Promise<string | null> {
    const cachePath = this.getCachePath(url, fileName);
    if (await fs.pathExists(cachePath)) {
      return cachePath;
    }

    return null;
  }

  public async putFileInCache(url: string, currentPath: string, fileName: string): Promise<string> {
    const cachePath = this.getCachePath(url, fileName);
    d(`Moving ${currentPath} to ${cachePath}`);
    await fs.move(currentPath, cachePath, { overwrite: true });

    return cachePath;
  }
}
