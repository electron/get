import debug from 'debug';
import envPaths from 'env-paths';
import fs from 'graceful-fs';

import crypto from 'node:crypto';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
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

  private async hashFile(path: string): Promise<string> {
    const hasher = crypto.createHash('sha256');
    await pipeline(fs.createReadStream(path), hasher);
    return hasher.digest('hex');
  }

  public async putFileInCache(url: string, currentPath: string, fileName: string): Promise<string> {
    const attempt = async (attemptsLeft = 3): Promise<string> => {
      try {
        const cachePath = this.getCachePath(url, fileName);
        d(`Moving ${currentPath} to ${cachePath}`);

        if (!fs.existsSync(path.dirname(cachePath))) {
          await fs.promises.mkdir(path.dirname(cachePath), { recursive: true });
        }

        if (fs.existsSync(cachePath)) {
          const [existingHash, currentHash] = await Promise.all([
            this.hashFile(cachePath),
            this.hashFile(currentPath),
          ]);
          if (existingHash !== currentHash) {
            d('* Replacing existing file as it does not match our inbound file');
            fs.promises.rm(cachePath, { recursive: true, force: true });
          } else {
            d('* Using existing file as the hash matches our inbound file, no need to replace');
            return cachePath;
          }
        }

        try {
          await fs.promises.rename(currentPath, cachePath);
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'EXDEV') {
            // Cross-device link, fallback to copy and delete
            await fs.promises.cp(currentPath, cachePath, {
              force: true,
              recursive: true,
              verbatimSymlinks: true,
            });
            await fs.promises.rm(currentPath, { force: true, recursive: true });
          } else {
            throw err;
          }
        }

        return cachePath;
      } catch (err) {
        if (process.platform === 'win32' && (err as NodeJS.ErrnoException).code === 'EPERM') {
          // On windows this normally means we're fighting another instance of @electron/get
          // also trying to write this file to the cache
          d('Experienced error putting thing in cache', err);
          if (attemptsLeft > 0) {
            d('Trying again in a few seconds');
            await new Promise((resolve) => {
              setTimeout(resolve, 2000);
            });
            return await attempt(attemptsLeft - 1);
          }
          d('We have already tried too many times, giving up...');
        }
        throw err;
      }
    };

    return await attempt();
  }
}
