import * as fs from 'fs-extra';
import got from 'got';
import { HTTPError } from 'got/dist/source/errors';
import { Options as GotOptions, Progress } from 'got/dist/source/types';
import * as path from 'path';
import * as ProgressBar from 'progress';
import { promisify } from 'util';
import * as stream from 'stream';

import { Downloader } from './Downloader';

const PROGRESS_BAR_DELAY_IN_SECONDS = 30;

const pipeline = promisify(stream.pipeline);

/**
 * See [`got#options`](https://github.com/sindresorhus/got#options) for possible keys/values.
 */
export type GotDownloaderOptions = GotOptions & {
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
  async download(url: string, targetFilePath: string, options?: GotDownloaderOptions) {
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
          (bar as any).start = start;
        }
      }, PROGRESS_BAR_DELAY_IN_SECONDS * 1000);
    }
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
    try {
      await pipeline(downloadStream, writeStream);
    } catch (error) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        error.message += ` for ${error.response.url}`;
      }

      throw error;
    }

    downloadCompleted = true;
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
