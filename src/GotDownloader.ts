import * as fs from 'fs-extra';
import * as got from 'got';
import { RequestOptions } from 'https';
import * as path from 'path';

import { Downloader } from './Downloader';

export class GotDownloader implements Downloader<RequestOptions> {
  async download(url: string, targetFilePath: string, options: RequestOptions) {
    await fs.mkdirp(path.dirname(targetFilePath));
    const writeStream = fs.createWriteStream(targetFilePath);
    await new Promise((resolve, reject) => {
      const downloadStream = got.stream(url, options);
      downloadStream.pipe(writeStream);

      downloadStream.on('error', error => reject(error));
      writeStream.on('error', error => reject(error));
      writeStream.on('close', () => resolve());
    });
  }
}
