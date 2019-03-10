import envPaths from 'env-paths';
import * as fs from 'fs-extra';
import * as path from 'path';

const defaultCacheRoot = envPaths('electron', {
  suffix: '',
}).cache;

export class Cache {
  constructor(private cacheRoot = defaultCacheRoot) {}

  private getCachePath(fileName: string): string {
    return path.resolve(this.cacheRoot, fileName);
  }

  public async getPathForFileInCache(fileName: string): Promise<string | null> {
    const cachePath = this.getCachePath(fileName);
    if (await fs.pathExists(cachePath)) {
      return cachePath;
    }

    return null;
  }

  public async putFileInCache(currentPath: string, fileName: string): Promise<string> {
    const cachePath = this.getCachePath(fileName);
    if (await fs.pathExists(cachePath)) {
      await fs.remove(cachePath);
    }

    await fs.move(currentPath, cachePath);

    return cachePath;
  }
}
