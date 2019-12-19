import * as fs from 'fs-extra';
import * as path from 'path';

import { Downloader } from '../src/Downloader';

const FIXTURE_DIR = path.resolve(__dirname, '../test/fixtures');

export class FixtureDownloader implements Downloader<any> {
  async download(url: string, targetFilePath: string) {
    await fs.ensureDir(path.dirname(targetFilePath));
    const fixtureFile = path.join(FIXTURE_DIR, path.basename(targetFilePath));
    if (!(await fs.pathExists(fixtureFile))) {
      throw new Error(`Cannot find the fixture '${fixtureFile}'`);
    }

    await fs.copy(fixtureFile, targetFilePath);
  }
}
