import fs from 'graceful-fs';

import path from 'node:path';
import ProgressBar from 'progress';

import { Downloader } from './Downloader.js';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const PROGRESS_BAR_DELAY_IN_SECONDS = 30;

/**
 * @category Downloader
 */
export interface Progress {
  /** Bytes downloaded so far. */
  transferred: number;
  /** Total bytes to download, or `null` if the response had no `Content-Length` header. */
  total: number | null;
  /**
   * Ratio of `transferred` to `total` between 0 and 1.
   * If `total` is unknown, this is 0 until the download completes, then 1.
   */
  percent: number;
}

/**
 * @category Downloader
 */
export class HTTPError extends Error {
  constructor(public readonly response: Response) {
    super(`Response code ${response.status} (${response.statusText}) for ${response.url}`);
    this.name = 'HTTPError';
  }
}

/**
 * @category Downloader
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit | `RequestInit`} for possible keys/values.
 */
export type FetchDownloaderOptions = RequestInit & {
  /** Called on each chunk with the current download {@link Progress}. */
  getProgressCallback?: (progress: Progress) => Promise<void>;
  /**
   * Disables the console progress bar. Setting the `ELECTRON_GET_NO_PROGRESS`
   * environment variable to a non-empty value also does this.
   */
  quiet?: boolean;
};

/**
 * Default {@link Downloader} implemented with the built-in
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API | Fetch API}.
 * @category Downloader
 */
export class FetchDownloader implements Downloader<FetchDownloaderOptions> {
  async download(
    url: string,
    targetFilePath: string,
    options: FetchDownloaderOptions = {},
  ): Promise<void> {
    const { quiet, getProgressCallback, ...fetchOptions } = options;
    let downloadCompleted = false;
    let bar: ProgressBar | undefined;
    let progressPercent: number;
    let timeout: NodeJS.Timeout | undefined = undefined;
    await fs.promises.mkdir(path.dirname(targetFilePath), { recursive: true });

    if (!quiet && !process.env.ELECTRON_GET_NO_PROGRESS) {
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
    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new HTTPError(response);
      }
      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : null;
      let transferred = 0;

      const onProgress = (percent: number): void => {
        progressPercent = percent;
        if (bar) {
          bar.update(percent);
        }
        if (getProgressCallback) {
          void getProgressCallback({ transferred, total, percent });
        }
      };

      await pipeline(
        Readable.fromWeb(response.body),
        async function* (source) {
          for await (const chunk of source) {
            transferred += chunk.length;
            onProgress(total ? transferred / total : 0);
            yield chunk;
          }
        },
        fs.createWriteStream(targetFilePath),
      );

      onProgress(1);
    } finally {
      downloadCompleted = true;
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}
