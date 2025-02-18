import fs from 'graceful-fs';
import path from 'node:path';
import util from 'node:util';

import { DownloadOptions } from '../src/types';
import { Downloader } from '../src/Downloader';

const FIXTURE_DIR = path.resolve(__dirname, '../test/fixtures');

export class FixtureDownloader implements Downloader<DownloadOptions> {
  async download(_url: string, targetFilePath: string): Promise<void> {
    await fs.promises.mkdir(path.dirname(targetFilePath), { recursive: true });
    const fixtureFile = path.join(FIXTURE_DIR, path.basename(targetFilePath));
    if (!fs.existsSync(fixtureFile)) {
      throw new Error(`Cannot find the fixture '${fixtureFile}'`);
    }

    await util.promisify(fs.copyFile)(fixtureFile, targetFilePath);
  }
}
