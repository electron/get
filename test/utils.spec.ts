import * as fs from 'fs-extra';

import {
  normalizeVersion,
  uname,
  withTempDirectory,
  getHostArch,
  ensureIsTruthyString,
  isOfficialLinuxIA32Download,
  getEnv,
  setEnv,
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
      let mDir: string | undefined = undefined;
      await withTempDirectory(async dir => {
        mDir = dir;
      });
      expect(mDir).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(await fs.pathExists(mDir!)).toEqual(false);
    });

    it('should delete the directory and reject correctly even if the function throws', async () => {
      let mDir: string | undefined;
      await expect(
        withTempDirectory(async dir => {
          mDir = dir;
          throw 'my error';
        }),
      ).rejects.toEqual('my error');
      expect(mDir).not.toBeUndefined();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(await fs.pathExists(mDir!)).toEqual(false);
    });
  });

  describe('getHostArch()', () => {
    let savedArch: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let savedVariables: any;

    beforeEach(() => {
      savedArch = process.arch;
      savedVariables = process.config.variables;
    });

    afterEach(() => {
      Object.defineProperty(process, 'arch', {
        value: savedArch,
      });
      Object.defineProperty(process.config, 'variables', {
        value: savedVariables,
      });
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
      Object.defineProperty(process.config, 'variables', {
        value: {},
      });
      expect(getHostArch()).toEqual('armv7l');
    });

    if (process.platform !== 'win32') {
      it('should return uname on arm 6', () => {
        Object.defineProperty(process, 'arch', {
          value: 'arm',
        });
        Object.defineProperty(process.config, 'variables', {
          value: {
            // eslint-disable-next-line @typescript-eslint/camelcase
            arm_version: '6',
          },
        });
        expect(getHostArch()).toEqual(uname());
      });
    }

    it('should return armv7l on arm 7', () => {
      Object.defineProperty(process, 'arch', {
        value: 'arm',
      });
      Object.defineProperty(process.config, 'variables', {
        value: {
          // eslint-disable-next-line @typescript-eslint/camelcase
          arm_version: '7',
        },
      });
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

  describe('getEnv()', () => {
    const [prefix, envName] = ['TeSt_EnV_vAr_', 'eNv_Key'];
    const prefixEnvName = `${prefix}${envName}`;
    const [hasPrefixValue, noPrefixValue] = ['yes_prefix', 'no_prefix'];

    beforeAll(() => {
      process.env[prefixEnvName] = hasPrefixValue;
      process.env[envName] = noPrefixValue;
    });

    afterAll(() => {
      delete process.env[prefixEnvName];
      delete process.env[envName];
    });

    it('should return prefixed environment variable if prefixed variable found', () => {
      const env = getEnv(prefix);
      expect(env(envName)).toEqual(hasPrefixValue);
      expect(env(envName.toLowerCase())).toEqual(hasPrefixValue);
      expect(env(envName.toUpperCase())).toEqual(hasPrefixValue);
    });

    it('should return non-prefixed environment variable if no prefixed variable found', () => {
      expect(getEnv()(envName)).toEqual(noPrefixValue);
      expect(getEnv()(envName.toLowerCase())).toEqual(noPrefixValue);
      expect(getEnv()(envName.toUpperCase())).toEqual(noPrefixValue);
    });

    it('should return undefined if no match', () => {
      const randomStr = 'AAAAA_electron_';
      expect(getEnv()(randomStr)).toEqual(undefined);
      expect(getEnv()(randomStr.toLowerCase())).toEqual(undefined);
      expect(getEnv()(randomStr.toUpperCase())).toEqual(undefined);
    });
  });
});

describe('setEnv()', () => {
  it("doesn't set the environment variable if the value is undefined", () => {
    const [key, value] = ['Set_AAA_electron', undefined];
    setEnv(key, value);
    expect(process.env[key]).toEqual(void 0);
  });

  it('successfully sets the environment variable when the value is defined', () => {
    const [key, value] = ['Set_BBB_electron', 'Test'];
    setEnv(key, value);
    expect(process.env[key]).toEqual(value);
  });

  it('successfully sets the environment variable when the value is falsey', () => {
    const [key, value] = ['Set_AAA_electron', false];
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    setEnv(key, value);
    expect(process.env[key]).toEqual('false');
  });
});
