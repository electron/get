import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

export async function withTempDirectory<T>(fn: (directory: string) => Promise<T>): Promise<T> {
  const directory = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-download-'));

  let result: T;
  try {
    result = await fn(directory);
  } catch (err) {
    await fs.remove(directory);
    throw err;
  }

  try {
    await fs.remove(directory);
  } catch {
    // Ignore error, it's just a temp dir
  }
  return result;
}

export function normalizeVersion(version: string) {
  if (!version.startsWith('v')) {
    return `v${version}`;
  }
  return version;
}

/**
 * Runs the `uname` command and returns the trimmed output.
 */
export function uname() {
  return childProcess
    .execSync('uname -m')
    .toString()
    .trim();
}

/**
 * Generates an architecture name that would be used in an Electron or Node.js
 * download file name, from the `process` module information.
 */
export function getHostArch() {
  return getNodeArch(process.arch);
}

/**
 * Generates an architecture name that would be used in an Electron or Node.js
 * download file name.
 */
export function getNodeArch(arch: string) {
  if (arch === 'arm') {
    switch ((process.config.variables as any).arm_version) {
      case '6':
        return uname();
      case '7':
        return 'armv7l';
      default:
        break;
    }
  }

  return arch;
}
