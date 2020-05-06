import { Downloader } from './Downloader';

export interface MirrorOptions {
  /**
   * The Electron nightly-specific mirror URL.
   */
  nightly_mirror?: string;
  /**
   * The base URL of the mirror to download from,
   * e.g https://github.com/electron/electron/releases/download
   */
  mirror?: string;
  /**
   * The name of the directory to download from,
   * often scoped by version number e.g 'v4.0.4'
   */
  customDir?: string;
  /**
   * The name of the asset to download,
   * e.g 'electron-v4.0.4-linux-x64.zip'
   */
  customFilename?: string;
  /**
   * A function allowing customization of the url returned
   * from getArtifactRemoteURL().
   */
  resolveAssetURL?: (opts: Omit<MirrorOptions, 'resolveAssetURL'>) => string;
}

export interface ElectronDownloadRequest {
  /**
   * The version of Electron associated with the artifact.
   */
  version: string;
  /**
   * The type of artifact. For example:
   * * `electron`
   * * `ffmpeg`
   */
  artifactName: string;
}

export interface ElectronDownloadRequestOptions {
  /**
   * Whether to download an artifact regardless of whether it's in the cache directory.
   *
   * Defaults to `false`.
   */
  force?: boolean;
  /**
   * When set to `true`, disables checking that the artifact download completed successfully
   * with the correct payload.
   *
   * Defaults to `false`.
   */
  unsafelyDisableChecksums?: boolean;
  /**
   * The directory that caches Electron artifact downloads.
   *
   * The default value is dependent upon the host platform:
   *
   * * Linux: `$XDG_CACHE_HOME` or `~/.cache/electron/`
   * * MacOS: `~/Library/Caches/electron/`
   * * Windows: `%LOCALAPPDATA%/electron/Cache` or `~/AppData/Local/electron/Cache/`
   */
  cacheRoot?: string;
  /**
   * Options passed to the downloader module.
   */
  downloadOptions?: DownloadOptions;
  /**
   * Options related to specifying an artifact mirror.
   */
  mirrorOptions?: MirrorOptions;
  /**
   * The custom [[Downloader]] class used to download artifacts. Defaults to the
   * built-in [[GotDownloader]].
   */
  downloader?: Downloader<any>;
  /**
   * A temporary directory for downloads.
   * It is used before artifacts are put into cache.
   */
  tempDirectory?: string;
}

export type ElectronPlatformArtifactDetails = {
  /**
   * The target artifact platform. These are Node-style platform names, for example:
   * * `win32`
   * * `darwin`
   * * `linux`
   */
  platform: string;
  /**
   * The target artifact architecture. These are Node-style architecture names, for example:
   * * `ia32`
   * * `x64`
   * * `armv7l`
   */
  arch: string;
  artifactSuffix?: string;
  isGeneric?: false;
} & ElectronDownloadRequest &
  ElectronDownloadRequestOptions;

export type ElectronGenericArtifactDetails = {
  isGeneric: true;
} & ElectronDownloadRequest &
  ElectronDownloadRequestOptions;

export type ElectronArtifactDetails =
  | ElectronPlatformArtifactDetails
  | ElectronGenericArtifactDetails;

export type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;

export type ElectronPlatformArtifactDetailsWithDefaults =
  | (Omit<ElectronPlatformArtifactDetails, 'platform' | 'arch'> & {
      platform?: string;
      arch?: string;
    })
  | ElectronGenericArtifactDetails;

export type DownloadOptions = any;
