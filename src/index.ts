import debug from 'debug';
import * as path from 'path';
import * as sumchecker from 'sumchecker';

import { getArtifactFileName, getArtifactRemoteURL } from './artifact-utils';
import {
  ElectronArtifactDetails,
  ElectronDownloadRequestOptions,
  ElectronPlatformArtifactDetailsWithDefaults,
} from './types';
import { Cache } from './Cache';
import { getDownloaderForSystem } from './downloader-resolver';
import { initializeProxy } from './proxy';
import {
  withTempDirectoryIn,
  normalizeVersion,
  getHostArch,
  getNodeArch,
  ensureIsTruthyString,
  isOfficialLinuxIA32Download,
} from './utils';

export { getHostArch } from './utils';
export { initializeProxy } from './proxy';
export * from './types';

const d = debug('@electron/get:index');

if (process.env.ELECTRON_GET_USE_PROXY) {
  initializeProxy();
}

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
    arch: process.arch,
    artifactName: 'electron',
  });
}

/**
 * Downloads an artifact from an Electron release and returns an absolute path
 * to the downloaded file.
 *
 * @param artifactDetails - The information required to download the artifact
 */
export async function downloadArtifact(
  _artifactDetails: ElectronPlatformArtifactDetailsWithDefaults,
): Promise<string> {
  const artifactDetails: ElectronArtifactDetails = _artifactDetails.isGeneric
    ? {
        ..._artifactDetails,
      }
    : {
        platform: process.platform,
        arch: process.arch,
        ..._artifactDetails,
      };
  ensureIsTruthyString(artifactDetails, 'version');
  artifactDetails.version = normalizeVersion(artifactDetails.version);
  if (artifactDetails.hasOwnProperty('arch')) {
    (artifactDetails as any).arch = getNodeArch((artifactDetails as any).arch);
  }

  const fileName = getArtifactFileName(artifactDetails);
  const url = getArtifactRemoteURL(artifactDetails);
  const cache = new Cache(artifactDetails.cacheRoot);

  // Do not check if the file exists in the cache when force === true
  if (!artifactDetails.force) {
    d(`Checking the cache (${artifactDetails.cacheRoot}) for ${fileName} (${url})`);
    const cachedPath = await cache.getPathForFileInCache(url, fileName);

    if (cachedPath === null) {
      d('Cache miss');
    } else {
      d('Cache hit');
      return cachedPath;
    }
  }

  if (
    !artifactDetails.isGeneric &&
    isOfficialLinuxIA32Download(
      artifactDetails.platform,
      artifactDetails.arch,
      artifactDetails.version,
      artifactDetails.mirrorOptions,
    )
  ) {
    console.warn('Official Linux/ia32 support is deprecated.');
    console.warn('For more info: https://electronjs.org/blog/linux-32bit-support');
  }

  return await withTempDirectoryIn(artifactDetails.tempDirectory, async tempFolder => {
    const tempDownloadPath = path.resolve(tempFolder, getArtifactFileName(artifactDetails));

    const downloader = artifactDetails.downloader || (await getDownloaderForSystem());
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
        cacheRoot: artifactDetails.cacheRoot,
        downloader: artifactDetails.downloader,
        mirrorOptions: artifactDetails.mirrorOptions,
      });

      await sumchecker('sha256', shasumPath, path.dirname(tempDownloadPath), [
        path.basename(tempDownloadPath),
      ]);
    }

    return await cache.putFileInCache(url, tempDownloadPath, fileName);
  });
}
