import * as fs from 'fs-extra';

import {
  normalizeVersion,
  uname,
  withTempDirectory,
  getHostArch,
  ensureIsTruthyString,
  isOfficialLinuxIA32Download,
} from '../src/utils';

describe('utils', () => {
  describe('normalizeVersion()', () => {
    it('should do nothing if the version starts with a v', () => {
      expect(normalizeVersion('v1.2.3')).toEqual('v1.2.3');
    });

    it('should auto prefix a version with a v if it does not already start with a v', () => {
      expect(normalizeVersion('3.2.1')).toEqual('v3.2.1');
    });
  });

  describe('uname()', () => {
    if (process.platform !== 'win32') {
      it('should return the correct arch for your system', () => {
        expect(uname()).toEqual('x86_64');
      });
    }
  });

  describe('withTempDirectory()', () => {
    it('should generate a new and empty directory', async () => {
      await withTempDirectory(async dir => {
        expect(await fs.pathExists(dir)).toEqual(true);
        expect(await fs.readdir(dir)).toEqual([]);
      });
    });

    it('should return the value the function returns', async () => {
      expect(await withTempDirectory(async () => 1234)).toEqual(1234);
    });

    it('should delete the directory when the function terminates', async () => {
      let mDir: string;
      await withTempDirectory(async dir => {
        mDir = dir;
      });
      expect(mDir!).not.toBeUndefined();
      expect(await fs.pathExists(mDir!)).toEqual(false);
    });

    it('should delete the directory and reject correctly even if the function throws', async () => {
      let mDir: string;
      await expect(
        withTempDirectory(async dir => {
          mDir = dir;
          throw 'my error';
        }),
      ).rejects.toEqual('my error');
      expect(mDir!).not.toBeUndefined();
      expect(await fs.pathExists(mDir!)).toEqual(false);
    });
  });

  describe('getHostArch()', () => {
    let savedArch: string;
    let savedVariables: any;

    beforeEach(() => {
      savedArch = process.arch;
      savedVariables = process.config.variables;
    });

    afterEach(() => {
      Object.defineProperty(process, 'arch', {
        value: savedArch,
      });
      process.config.variables = savedVariables;
    });

    it('should return process.arch on x64', () => {
      Object.defineProperty(process, 'arch', {
        value: 'x64',
      });
      expect(getHostArch()).toEqual('x64');
    });

    it('should return process.arch on ia32', () => {
      Object.defineProperty(process, 'arch', {
        value: 'ia32',
      });
      expect(getHostArch()).toEqual('ia32');
    });

    it('should return process.arch on unknown arm', () => {
      Object.defineProperty(process, 'arch', {
        value: 'arm',
      });
      process.config.variables = {} as any;
      expect(getHostArch()).toEqual('armv7l');
    });

    it('should return uname on arm 6', () => {
      if (process.platform !== 'win32') {
        Object.defineProperty(process, 'arch', {
          value: 'arm',
        });
        process.config.variables = { arm_version: '6' } as any;
        expect(getHostArch()).toEqual(uname());
      }
    });

    it('should return armv7l on arm 7', () => {
      Object.defineProperty(process, 'arch', {
        value: 'arm',
      });
      process.config.variables = { arm_version: '7' } as any;
      expect(getHostArch()).toEqual('armv7l');
    });
  });

  describe('ensureIsTruthyString()', () => {
    it('should not throw for a valid string', () => {
      expect(() => ensureIsTruthyString({ a: 'string' }, 'a')).not.toThrow();
    });

    it('should throw for an invalid string', () => {
      expect(() => ensureIsTruthyString({ a: 1234 }, 'a')).toThrow();
    });
  });

  describe('isOfficialLinuxIA32Download()', () => {
    it('should be true if an official linux/ia32 download with correct version specified', () => {
      expect(isOfficialLinuxIA32Download('linux', 'ia32', 'v4.0.0')).toEqual(true);
    });

    it('should be false if mirrorOptions specified', () => {
      expect(
        isOfficialLinuxIA32Download('linux', 'ia32', 'v4.0.0', { mirror: 'mymirror' }),
      ).toEqual(false);
    });

    it('should be false if too early version specified', () => {
      expect(isOfficialLinuxIA32Download('linux', 'ia32', 'v3.0.0')).toEqual(false);
    });

    it('should be false if wrong platform/arch specified', () => {
      expect(isOfficialLinuxIA32Download('win32', 'ia32', 'v4.0.0')).toEqual(false);
      expect(isOfficialLinuxIA32Download('linux', 'x64', 'v4.0.0')).toEqual(false);
    });
  });
});
