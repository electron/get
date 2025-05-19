import debug from 'debug';
import envPaths from 'env-paths';
import fs from 'graceful-fs';

import crypto from 'node:crypto';
import path from 'node:path';
import url from 'node:url';

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

    return crypto.createHash('sha256').update(strippedUrl).digest('hex');
  }

  public getCachePath(downloadUrl: string, fileName: string): string {
    return path.resolve(this.cacheRoot, Cache.getCacheDirectory(downloadUrl), fileName);
  }

  public getPathForFileInCache(url: string, fileName: string): string | null {
    const cachePath = this.getCachePath(url, fileName);
    if (fs.existsSync(cachePath)) {
      return cachePath;
    }

    return null;
  }

  public async putFileInCache(url: string, currentPath: string, fileName: string): Promise<string> {
    const cachePath = this.getCachePath(url, fileName);
    d(`Moving ${currentPath} to ${cachePath}`);

    if (!fs.existsSync(path.dirname(cachePath))) {
      await fs.promises.mkdir(path.dirname(cachePath), { recursive: true });
    }

    if (fs.existsSync(cachePath)) {
      d('* Replacing existing file');
      await fs.promises.rm(cachePath, { recursive: true, force: true });
    }

    await fs.promises.copyFile(currentPath, cachePath);
    await fs.promises.rm(currentPath);

    return cachePath;
  }
}
