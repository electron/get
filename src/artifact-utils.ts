import { ElectronArtifactDetails, MirrorOptions } from './types';
import { ensureIsTruthyString, normalizeVersion } from './utils';

const BASE_URL = 'https://github.com/electron/electron/releases/download/';
const NIGHTLY_BASE_URL = 'https://github.com/electron/nightlies/releases/download/';

export function getArtifactFileName(details: ElectronArtifactDetails): string {
  ensureIsTruthyString(details, 'artifactName');

  if (details.isGeneric) {
    return details.artifactName;
  }

  ensureIsTruthyString(details, 'arch');
  ensureIsTruthyString(details, 'platform');
  ensureIsTruthyString(details, 'version');

  return `${[
    details.artifactName,
    details.version,
    details.platform,
    details.arch,
    ...(details.artifactSuffix ? [details.artifactSuffix] : []),
  ].join('-')}.zip`;
}

function mirrorVar(
  name: keyof Omit<MirrorOptions, 'resolveAssetURL'>,
  options: MirrorOptions,
  defaultValue: string,
): string {
  // Convert camelCase to camel_case for env var reading
  const snakeName = name.replace(/([a-z])([A-Z])/g, (_, a, b) => `${a}_${b}`).toLowerCase();

  return (
    // configs coming from .npmrc are always lowercase regardless how it was defined
    process.env[`npm_config_electron_${name.toLowerCase()}`] ||
    process.env[`NPM_CONFIG_ELECTRON_${snakeName.toUpperCase()}`] ||
    process.env[`npm_config_electron_${snakeName}`] ||
    process.env[`npm_package_config_electron_${name}`] ||
    process.env[`ELECTRON_${snakeName.toUpperCase()}`] ||
    options[name] ||
    defaultValue
  );
}

export async function getArtifactRemoteURL(details: ElectronArtifactDetails): Promise<string> {
  const opts: MirrorOptions = details.mirrorOptions || {};
  let base = mirrorVar('mirror', opts, BASE_URL);
  if (details.version.includes('nightly')) {
    const nightlyDeprecated = mirrorVar('nightly_mirror', opts, '');
    if (nightlyDeprecated) {
      base = nightlyDeprecated;
      console.warn(`nightly_mirror is deprecated, please use nightlyMirror`);
    } else {
      base = mirrorVar('nightlyMirror', opts, NIGHTLY_BASE_URL);
    }
  }
  const path = mirrorVar('customDir', opts, details.version).replace(
    '{{ version }}',
    details.version.replace(/^v/, ''),
  );
  const file = mirrorVar('customFilename', opts, getArtifactFileName(details));

  // Allow customized download URL resolution.
  if (opts.resolveAssetURL) {
    const url = await opts.resolveAssetURL(details);
    return url;
  }

  return `${base}${path}/${file}`;
}

export function getArtifactVersion(details: ElectronArtifactDetails) {
  return normalizeVersion(mirrorVar('customVersion', details.mirrorOptions || {}, details.version));
}
