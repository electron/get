import { ElectronArtifactDetails, MirrorOptions } from './types';
import { ensureIsTruthyString } from './utils';

const BASE_URL = 'https://github.com/electron/electron/releases/download/';
const NIGHTLY_BASE_URL = 'https://github.com/electron/nightlies/releases/download/';

export enum FileNameUse {
  LOCAL,
  REMOTE,
}

export function getArtifactFileName(
  details: ElectronArtifactDetails,
  usage: FileNameUse = FileNameUse.LOCAL,
) {
  ensureIsTruthyString(details, 'artifactName');
  ensureIsTruthyString(details, 'version');

  if (details.isGeneric) {
    // When downloading we have to use the artifact name directly as that it was is stored in the release on GitHub
    if (usage === FileNameUse.REMOTE) {
      return details.artifactName;
    }
    // When caching / using on your local disk we want the generic artifact to be versioned
    return `${details.version}-${details.artifactName}`;
  }

  ensureIsTruthyString(details, 'platform');
  ensureIsTruthyString(details, 'arch');
  return `${[
    details.artifactName,
    details.version,
    details.platform,
    details.arch,
    ...(details.artifactSuffix ? [details.artifactSuffix] : []),
  ].join('-')}.zip`;
}

function mirrorVar(name: keyof MirrorOptions, options: MirrorOptions, defaultValue: string) {
  // Convert camelCase to camel_case for env var reading
  const lowerName = name.replace(/([a-z])([A-Z])/g, (_, a, b) => `${a}_${b}`).toLowerCase();

  return (
    process.env[`NPM_CONFIG_ELECTRON_${lowerName.toUpperCase()}`] ||
    process.env[`npm_config_electron_${lowerName}`] ||
    process.env[`npm_package_config_electron_${lowerName}`] ||
    process.env[`ELECTRON_${lowerName.toUpperCase()}`] ||
    options[name] ||
    defaultValue
  );
}

export function getArtifactRemoteURL(details: ElectronArtifactDetails): string {
  const opts: MirrorOptions = details.mirrorOptions || {};
  let base = mirrorVar('mirror', opts, BASE_URL);
  if (details.version.includes('nightly')) {
    base = mirrorVar('nightly_mirror', opts, NIGHTLY_BASE_URL);
  }
  const path = mirrorVar('customDir', opts, details.version);
  const file = mirrorVar('customFilename', opts, getArtifactFileName(details, FileNameUse.REMOTE));

  return `${base}${path}/${file}`;
}
