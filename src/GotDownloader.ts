import * as fs from 'fs-extra';
import got, { Options, Progress, HTTPError } from 'got';
import * as path from 'path';
import * as ProgressBar from 'progress';

import { Downloader } from './Downloader';

const PROGRESS_BAR_DELAY_IN_SECONDS = 30;

type GotStreamOptions = Options & {
  isStream?: true;
};

/**
 * See [`got#options`](https://github.com/sindresorhus/got/tree/v11.8.5#options) for possible keys/values.
 */
export type GotDownloaderOptions = GotStreamOptions & {
  /**
   * if defined, triggers every time `got`'s `downloadProgress` event callback is triggered.
   */
  getProgressCallback?: (progress: Progress) => Promise<void>;
  /**
   * if `true`, disables the console progress bar (setting the `ELECTRON_GET_NO_PROGRESS`
   * environment variable to a non-empty value also does this).
   */
  quiet?: boolean;
};

export class GotDownloader implements Downloader<GotDownloaderOptions> {
  async download(
    url: string,
    targetFilePath: string,
    options?: GotDownloaderOptions,
  ): Promise<void> {
    if (!options) {
      options = {};
    }
    const { quiet, getProgressCallback, ...gotOptions } = options;
    let downloadCompleted = false;
    let bar: ProgressBar | undefined;
    let progressPercent: number;
    let timeout: NodeJS.Timeout | undefined = undefined;
    await fs.mkdirp(path.dirname(targetFilePath));
    const writeStream = fs.createWriteStream(targetFilePath);

    if (!quiet || !process.env.ELECTRON_GET_NO_PROGRESS) {
      const start = new Date();
      timeout = setTimeout(() => {
        if (!downloadCompleted) {
          bar = new ProgressBar(
            `Downloading ${path.basename(url)}: [:bar] :percent ETA: :eta seconds `,
            {
              curr: progressPercent,
              total: 100,
            },
          );
          // https://github.com/visionmedia/node-progress/issues/159
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bar as any).start = start;
        }
      }, PROGRESS_BAR_DELAY_IN_SECONDS * 1000);
    }
    await new Promise<void>((resolve, reject) => {
      const downloadStream = got.stream(url, gotOptions);
      downloadStream.on('downloadProgress', async progress => {
        progressPercent = progress.percent;
        if (bar) {
          bar.update(progress.percent);
        }
        if (getProgressCallback) {
          await getProgressCallback(progress);
        }
      });
      downloadStream.on('error', error => {
        if (error instanceof HTTPError && error.response.statusCode === 404) {
          error.message += ` for ${error.response.url}`;
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

    downloadCompleted = true;
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
