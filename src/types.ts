import { Downloader } from './Downloader';

export interface MirrorOptions {
  nightly_mirror?: string;
  mirror?: string;
  customDir?: string;
  customFilename?: string;
}

export interface ElectronDownloadRequest {
  version: string;
  artifactName: string;
}

export interface ElectronDownloadRequestOptions {
  force?: boolean;
  unsafelyDisableChecksums?: boolean;
  cacheRoot?: string;
  downloadOptions?: DownloadOptions;
  mirrorOptions?: MirrorOptions;
  downloader?: Downloader<any>;
}

export type ElectronPlatformArtifactDetails = {
  platform: string;
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

export type DownloadOptions = any;
