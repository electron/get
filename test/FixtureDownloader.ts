import * as fs from 'fs-extra';
import * as path from 'path';

import { DownloadOptions } from '../src/types';
import { Downloader } from '../src/Downloader';

const FIXTURE_DIR = path.resolve(__dirname, '../test/fixtures');

export class FixtureDownloader implements Downloader<DownloadOptions> {
  async download(_url: string, targetFilePath: string): Promise<void> {
    await fs.ensureDir(path.dirname(targetFilePath));
    const fixtureFile = path.join(FIXTURE_DIR, path.basename(targetFilePath));
    if (!(await fs.pathExists(fixtureFile))) {
      throw new Error(`Cannot find the fixture '${fixtureFile}'`);
    }

    await fs.copy(fixtureFile, targetFilePath);
  }
}
