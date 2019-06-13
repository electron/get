import debug from 'debug';
import * as path from 'path';

import { getArtifactFileName, getArtifactRemoteURL, FileNameUse } from './artifact-utils';
import { ElectronArtifactDetails, ElectronDownloadRequestOptions } from './types';
import { Cache } from './Cache';
import { getDownloaderForSystem } from './downloader-resolver';
import { withTempDirectory, normalizeVersion, getHostArch, ensureIsTruthyString } from './utils';

export { getHostArch } from './utils';

const d = debug('@electron/get:index');
const sumchecker: typeof import('sumchecker').default = require('sumchecker');

/**
 * Downloads a specific version of Electron and returns an absolute path to a
 * ZIP file.
 *
 * @param version - The version of Electron you want to download
 */
export function download(
  version: string,
  options?: ElectronDownloadRequestOptions,
): Promise<string> {
  return downloadArtifact({
    ...options,
    version,
    platform: process.platform,
    arch: getHostArch(),
    artifactName: 'electron',
  });
}

/**
 * Downloads an artifact from an Electron release and returns an absolute path
 * to the downloaded file.
 *
 * @param artifactDetails - The information required to download the artifact
 */
export async function downloadArtifact(_artifactDetails: ElectronArtifactDetails): Promise<string> {
  const artifactDetails: ElectronArtifactDetails = {
    ..._artifactDetails,
  };
  ensureIsTruthyString(artifactDetails, 'version');
  artifactDetails.version = normalizeVersion(artifactDetails.version);

  const fileName = getArtifactFileName(artifactDetails);
  const cache = new Cache(artifactDetails.cacheRoot);

  // Do not check if the file exists in the cache when force === true
  if (!artifactDetails.force) {
    d(`Checking the cache for ${fileName}`);
    const cachedPath = await cache.getPathForFileInCache(fileName);

    if (cachedPath === null) {
      d('Cache miss');
    } else {
      d('Cache hit');
      return cachedPath;
    }
  }

  return await withTempDirectory(async tempFolder => {
    const tempDownloadPath = path.resolve(
      tempFolder,
      getArtifactFileName(artifactDetails, FileNameUse.REMOTE),
    );

    const downloader = artifactDetails.downloader || (await getDownloaderForSystem());
    const url = getArtifactRemoteURL(artifactDetails);
    d(
      `Downloading ${url} to ${tempDownloadPath} with options: ${JSON.stringify(
        artifactDetails.downloadOptions,
      )}`,
    );
    await downloader.download(url, tempDownloadPath, artifactDetails.downloadOptions);

    // Don't try to verify the hash of the hash file itself
    if (
      !artifactDetails.artifactName.startsWith('SHASUMS256') &&
      !artifactDetails.unsafelyDisableChecksums
    ) {
      const shasumPath = await downloadArtifact({
        isGeneric: true,
        version: artifactDetails.version,
        artifactName: 'SHASUMS256.txt',
        force: artifactDetails.force,
        downloadOptions: artifactDetails.downloadOptions,
        downloader: artifactDetails.downloader,
      });

      await sumchecker('sha256', shasumPath, path.dirname(tempDownloadPath), [
        path.basename(tempDownloadPath),
      ]);
    }

    return await cache.putFileInCache(tempDownloadPath, fileName);
  });
}
