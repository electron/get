import debug from 'debug';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as semver from 'semver';
import * as sumchecker from 'sumchecker';

import { getArtifactFileName, getArtifactRemoteURL, getArtifactVersion } from './artifact-utils';
import {
  ElectronArtifactDetails,
  ElectronDownloadRequestOptions,
  ElectronGenericArtifactDetails,
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
  _artifactDetails: ElectronPlatformArtifactDetailsWithDefaults | ElectronGenericArtifactDetails,
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
 * Each release of Electron comes with artifacts, many of which are
 * platform/arch-specific (e.g. `ffmpeg-v31.0.0-darwin-arm64.zip`) and others that
 * are generic (e.g. `SHASUMS256.txt`).
 *
 *
 * @param artifactDetails - The information required to download the artifact
 * @category Download Artifact
 */
export async function downloadArtifact(
  artifactDetails: ElectronPlatformArtifactDetailsWithDefaults | ElectronGenericArtifactDetails,
): Promise<string> {
  const details: ElectronArtifactDetails = {
    ...(artifactDetails as ElectronArtifactDetails),
  };
  if (!artifactDetails.isGeneric) {
    const platformArtifactDetails = details as ElectronPlatformArtifactDetails;
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
  ensureIsTruthyString(details, 'version');

  details.version = getArtifactVersion(details);
  const fileName = getArtifactFileName(details);
  const url = await getArtifactRemoteURL(details);
  const cache = new Cache(details.cacheRoot);

  // Do not check if the file exists in the cache when force === true
  if (!details.force) {
    d(`Checking the cache (${details.cacheRoot}) for ${fileName} (${url})`);
    const cachedPath = await cache.getPathForFileInCache(url, fileName);

    if (cachedPath === null) {
      d('Cache miss');
    } else {
      d('Cache hit');
      try {
        await validateArtifact(details, cachedPath, downloadArtifact);

        return cachedPath;
      } catch (err) {
        d("Artifact in cache didn't match checksums", err);
        d('falling back to re-download');
      }
    }
  }

  if (
    !details.isGeneric &&
    isOfficialLinuxIA32Download(
      details.platform,
      details.arch,
      details.version,
      details.mirrorOptions,
    )
  ) {
    console.warn('Official Linux/ia32 support is deprecated.');
    console.warn('For more info: https://electronjs.org/blog/linux-32bit-support');
  }

  return await withTempDirectoryIn(details.tempDirectory, async tempFolder => {
    const tempDownloadPath = path.resolve(tempFolder, getArtifactFileName(details));

    const downloader = details.downloader || (await getDownloaderForSystem());
    d(
      `Downloading ${url} to ${tempDownloadPath} with options: ${JSON.stringify(
        details.downloadOptions,
      )}`,
    );
    await downloader.download(url, tempDownloadPath, details.downloadOptions);

    await validateArtifact(details, tempDownloadPath, downloadArtifact);

    return await cache.putFileInCache(url, tempDownloadPath, fileName);
  });
}

/**
 * Downloads the Electron binary for a specific version and returns an absolute path to a
 * ZIP file.
 *
 * @param version - The version of Electron you want to download (e.g. `31.0.0`)
 * @param options - Options to customize the download behavior
 * @returns An absolute path to the downloaded ZIP file
 * @category Download Electron
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
