import { DownloadOptions } from './types.js';
import { Downloader } from './Downloader.js';
import { FetchDownloader } from './FetchDownloader.js';

export async function getDownloaderForSystem(): Promise<Downloader<DownloadOptions>> {
  return new FetchDownloader();
}
