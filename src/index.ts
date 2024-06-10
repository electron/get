import debug from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as semver from 'semver';
import * as sumchecker from 'sumchecker';

import { getArtifactFileName, getArtifactRemoteURL, getArtifactVersion } from './artifact-utils';
import {
  ElectronArtifactDetails,
  ElectronDownloadRequestOptions,
  ElectronPlatformArtifactDetails,
  ElectronPlatformArtifactDetailsWithDefaults,
} from './types';
import { Cache } from './Cache';
import { getDownloaderForSystem } from './downloader-resolver';
import { initializeProxy } from './proxy';
import {
  withTempDirectoryIn,
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

type ArtifactDownloader = (
  _artifactDetails: ElectronPlatformArtifactDetailsWithDefaults,
) => Promise<string>;

async function validateArtifact(
  artifactDetails: ElectronArtifactDetails,
  downloadedAssetPath: string,
  _downloadArtifact: ArtifactDownloader,
): Promise<void> {
  return await withTempDirectoryIn(artifactDetails.tempDirectory, async tempFolder => {
    // Don't try to verify the hash of the hash file itself
    // and for older versions that don't have a SHASUMS256.txt
    if (
      !artifactDetails.artifactName.startsWith('SHASUMS256') &&
      !artifactDetails.unsafelyDisableChecksums &&
      semver.gte(artifactDetails.version, '1.3.2')
    ) {
      let shasumPath: string;
      const checksums = artifactDetails.checksums;
      if (checksums) {
        shasumPath = path.resolve(tempFolder, 'SHASUMS256.txt');
        const fileNames: string[] = Object.keys(checksums);
        if (fileNames.length === 0) {
          throw new Error(
            'Provided "checksums" object is empty, cannot generate a valid SHASUMS256.txt',
          );
        }
        const generatedChecksums = fileNames
          .map(fileName => `${checksums[fileName]} *${fileName}`)
          .join('\n');
        await fs.writeFile(shasumPath, generatedChecksums);
      } else {
        shasumPath = await _downloadArtifact({
          isGeneric: true,
          version: artifactDetails.version,
          artifactName: 'SHASUMS256.txt',
          force: artifactDetails.force,
          downloadOptions: artifactDetails.downloadOptions,
          cacheRoot: artifactDetails.cacheRoot,
          downloader: artifactDetails.downloader,
          mirrorOptions: artifactDetails.mirrorOptions,
        });
      }

      // For versions 1.3.2 - 1.3.4, need to overwrite the `defaultTextEncoding` option:
      // https://github.com/electron/electron/pull/6676#discussion_r75332120
      if (semver.satisfies(artifactDetails.version, '1.3.2 - 1.3.4')) {
        const validatorOptions: sumchecker.ChecksumOptions = {};
        validatorOptions.defaultTextEncoding = 'binary';
        const checker = new sumchecker.ChecksumValidator('sha256', shasumPath, validatorOptions);
        await checker.validate(
          path.dirname(downloadedAssetPath),
          path.basename(downloadedAssetPath),
        );
      } else {
        await sumchecker('sha256', shasumPath, path.dirname(downloadedAssetPath), [
          path.basename(downloadedAssetPath),
        ]);
      }
    }
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
  const artifactDetails: ElectronArtifactDetails = {
    ...(_artifactDetails as ElectronArtifactDetails),
  };
  if (!_artifactDetails.isGeneric) {
    const platformArtifactDetails = artifactDetails as ElectronPlatformArtifactDetails;
    if (!platformArtifactDetails.platform) {
      d('No platform found, defaulting to the host platform');
      platformArtifactDetails.platform = process.platform;
    }
    if (platformArtifactDetails.arch) {
      platformArtifactDetails.arch = getNodeArch(platformArtifactDetails.arch);
    } else {
      d('No arch found, defaulting to the host arch');
      platformArtifactDetails.arch = getHostArch();
    }
  }
  ensureIsTruthyString(artifactDetails, 'version');

  artifactDetails.version = getArtifactVersion(artifactDetails);
  const fileName = getArtifactFileName(artifactDetails);
  const url = await getArtifactRemoteURL(artifactDetails);
  const cache = new Cache(artifactDetails.cacheRoot);

  // Do not check if the file exists in the cache when force === true
  if (!artifactDetails.force) {
    d(`Checking the cache (${artifactDetails.cacheRoot}) for ${fileName} (${url})`);
    const cachedPath = await cache.getPathForFileInCache(url, fileName);

    if (cachedPath === null) {
      d('Cache miss');
    } else {
      d('Cache hit');
      try {
        await validateArtifact(artifactDetails, cachedPath, downloadArtifact);

        return cachedPath;
      } catch (err) {
        d("Artifact in cache didn't match checksums", err);
        d('falling back to re-download');
      }
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

    await validateArtifact(artifactDetails, tempDownloadPath, downloadArtifact);

    return await cache.putFileInCache(url, tempDownloadPath, fileName);
  });
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
