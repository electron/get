import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

async function useAndRemoveDirectory<T>(
  directory: string,
  fn: (directory: string) => Promise<T>,
): Promise<T> {
  let result: T;
  try {
    result = await fn(directory);
  } finally {
    await fs.remove(directory);
  }
  return result;
}

export async function withTempDirectoryIn<T>(
  parentDirectory: string = os.tmpdir(),
  fn: (directory: string) => Promise<T>,
): Promise<T> {
  const tempDirectoryPrefix = 'electron-download-';
  const tempDirectory = await fs.mkdtemp(path.resolve(parentDirectory, tempDirectoryPrefix));
  return useAndRemoveDirectory(tempDirectory, fn);
}

export async function withTempDirectory<T>(fn: (directory: string) => Promise<T>): Promise<T> {
  return withTempDirectoryIn(undefined, fn);
}

export function normalizeVersion(version: string): string {
  if (!version.startsWith('v')) {
    return `v${version}`;
  }
  return version;
}

/**
 * Runs the `uname` command and returns the trimmed output.
 */
export function uname(): string {
  return childProcess
    .execSync('uname -m')
    .toString()
    .trim();
}

/**
 * Generates an architecture name that would be used in an Electron or Node.js
 * download file name.
 */
export function getNodeArch(arch: string): string {
  if (arch === 'arm') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    switch ((process.config.variables as any).arm_version) {
      case '6':
        return uname();
      case '7':
      default:
        return 'armv7l';
    }
  }

  return arch;
}

/**
 * Generates an architecture name that would be used in an Electron or Node.js
 * download file name, from the `process` module information.
 */
export function getHostArch(): string {
  return getNodeArch(process.arch);
}

export function ensureIsTruthyString<T, K extends keyof T>(obj: T, key: K): void {
  if (!obj[key] || typeof obj[key] !== 'string') {
    throw new Error(`Expected property "${key}" to be provided as a string but it was not`);
  }
}

export function isOfficialLinuxIA32Download(
  platform: string,
  arch: string,
  version: string,
  mirrorOptions?: object,
): boolean {
  return (
    platform === 'linux' &&
    arch === 'ia32' &&
    Number(version.slice(1).split('.')[0]) >= 4 &&
    typeof mirrorOptions === 'undefined'
  );
}

/**
 * Find the value of a environment variable which may or may not have the
 * prefix, in a case-insensitive manner.
 */
export function getEnv(prefix = ''): (name: string) => string | undefined {
  const envsLowerCase: NodeJS.ProcessEnv = {};

  for (const envKey in process.env) {
    envsLowerCase[envKey.toLowerCase()] = process.env[envKey];
  }

  return (name: string) => {
    return (
      envsLowerCase[`${prefix}${name}`.toLowerCase()] ||
      envsLowerCase[name.toLowerCase()] ||
      undefined
    );
  };
}
