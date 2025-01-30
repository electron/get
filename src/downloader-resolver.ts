import { DownloadOptions } from './types.js';
import { Downloader } from './Downloader.js';

// TODO: Resolve the downloader or default to GotDownloader
// Current thoughts are a dot-file traversal for something like
// ".electron.downloader" which would be a text file with the name of the
// npm module to import() and use as the downloader
import { GotDownloader } from './GotDownloader.js';

export async function getDownloaderForSystem(): Promise<Downloader<DownloadOptions>> {
  return new GotDownloader();
}
