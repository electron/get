import * as fs from 'fs-extra';
import * as got from 'got';
import * as path from 'path';
import * as ProgressBar from 'progress';

import { Downloader } from './Downloader';

export class GotDownloader implements Downloader<any> {
  /**
   * @param options - see [`got#options`](https://github.com/sindresorhus/got#options) for possible keys/values.
   * Additional options:
   * * `quiet`: if `true`, disables the console progress bar (the `ELECTRON_GET_NO_PROGRESS`
   *   environment variable also does this)
   * * `getProgressCallback`: if defined, triggers every time `got`'s `downloadProgress` event
   *   callback is triggered.
   */
  async download(url: string, targetFilePath: string, options?: any) {
    if (!options) {
      options = {};
    }
    const { quiet, getProgressCallback, ...gotOptions } = options;
    let bar: ProgressBar | undefined;
    await fs.mkdirp(path.dirname(targetFilePath));
    const writeStream = fs.createWriteStream(targetFilePath);

    if (!quiet || !process.env.ELECTRON_GET_NO_PROGRESS) {
      bar = new ProgressBar(
        `Downloading ${path.basename(url)}: [:bar] :percent ETA: :eta seconds`,
        {
          total: 100,
        },
      );
    }
    await new Promise((resolve, reject) => {
      const downloadStream = got.stream(url, gotOptions);
      downloadStream.on('downloadProgress', async progress => {
        if (bar) {
          bar.update(progress.percent);
        }
        if (getProgressCallback) {
          await getProgressCallback(progress);
        }
      });
      downloadStream.on('error', error => {
        if (error.name === 'HTTPError' && error.statusCode === 404) {
          error.message += ` for ${error.url}`;
        }
        if (writeStream.destroy) {
          writeStream.destroy(error);
        }

        reject(error);
      });
      writeStream.on('error', error => reject(error));
      writeStream.on('close', () => resolve());

      downloadStream.pipe(writeStream);
    });
  }
}
