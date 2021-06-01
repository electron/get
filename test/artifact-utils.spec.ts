import { getArtifactFileName, getArtifactRemoteURL } from '../src/artifact-utils';

describe('artifact-utils', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getArtifactFileName()', () => {
    it('should return just the artifact name for generic artifacts', () => {
      expect(
        getArtifactFileName({
          isGeneric: true,
          artifactName: 'test.zip',
          version: 'v1',
        }),
      ).toMatchInlineSnapshot(`"test.zip"`);
    });

    it('should return the correct hypenated artifact names for other artifacts', () => {
      expect(
        getArtifactFileName({
          isGeneric: false,
          artifactName: 'chromedriver',
          version: 'v1.0.1',
          platform: 'android',
          arch: 'ia32',
        }),
      ).toMatchInlineSnapshot(`"chromedriver-v1.0.1-android-ia32.zip"`);
    });

    it('should return the correct hypenated artifact names for artifacts with a suffix', () => {
      expect(
        getArtifactFileName({
          isGeneric: false,
          artifactName: 'electron',
          version: 'v1.0.1',
          platform: 'darwin',
          arch: 'x64',
          artifactSuffix: 'symbols',
        }),
      ).toMatchInlineSnapshot(`"electron-v1.0.1-darwin-x64-symbols.zip"`);
    });
  });

  describe('getArtifactRemoteURL', () => {
    it('should generate a default URL correctly', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          platform: 'linux',
          version: 'v6.0.0',
        }),
      ).toMatchInlineSnapshot(
        `"https://github.com/electron/electron/releases/download/v6.0.0/electron-v6.0.0-linux-x64.zip"`,
      );
    });

    it('should replace the base URL when mirrorOptions.mirror is set', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            mirror: 'https://mirror.example.com/',
          },
          platform: 'linux',
          version: 'v6.0.0',
        }),
      ).toMatchInlineSnapshot(`"https://mirror.example.com/v6.0.0/electron-v6.0.0-linux-x64.zip"`);
    });

    it('should allow for custom URL resolution with mirrorOptions.resolveAssetURL', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            mirror: 'https://mirror.example.com',
            customDir: 'v1.2.3',
            customFilename: 'custom-built-electron.zip',
            resolveAssetURL: (opts): Promise<string> => {
              return opts.mirrorOptions.mirror || '';
            },
          },
          platform: 'linux',
          version: 'v6.0.0',
        }),
      ).toMatchInlineSnapshot(`"https://mirror.example.com"`);
    });

    it('should replace the nightly base URL when mirrorOptions.nightlyMirror is set', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            mirror: 'https://mirror.example.com/',
            nightlyMirror: 'https://nightly.example.com/',
          },
          platform: 'linux',
          version: 'v6.0.0-nightly',
        }),
      ).toMatchInlineSnapshot(
        `"https://nightly.example.com/v6.0.0-nightly/electron-v6.0.0-nightly-linux-x64.zip"`,
      );
    });

    it('should replace the nightly base URL when mirrorOptions.nightly_mirror is set', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            mirror: 'https://mirror.example.com/',
            nightly_mirror: 'https://nightly.example.com/',
          },
          platform: 'linux',
          version: 'v6.0.0-nightly',
        }),
      ).toMatchInlineSnapshot(
        `"https://nightly.example.com/v6.0.0-nightly/electron-v6.0.0-nightly-linux-x64.zip"`,
      );
      expect(warnSpy).toBeCalledWith('nightly_mirror is deprecated, please use nightlyMirror');
    });

    it('should replace the version dir when mirrorOptions.customDir is set', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            customDir: 'all',
          },
          platform: 'linux',
          version: 'v6.0.0',
        }),
      ).toMatchInlineSnapshot(
        `"https://github.com/electron/electron/releases/download/all/electron-v6.0.0-linux-x64.zip"`,
      );
    });

    it('should replace {{ version }} when mirrorOptions.customDir is set', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            customDir: 'foo{{ version }}bar',
          },
          platform: 'linux',
          version: 'v1.2.3',
        }),
      ).toMatchInlineSnapshot(
        `"https://github.com/electron/electron/releases/download/foo1.2.3bar/electron-v1.2.3-linux-x64.zip"`,
      );
    });

    it('should replace the filename when mirrorOptions.customFilename is set', async () => {
      expect(
        await getArtifactRemoteURL({
          arch: 'x64',
          artifactName: 'electron',
          mirrorOptions: {
            customFilename: 'custom-built-electron.zip',
          },
          platform: 'linux',
          version: 'v6.0.0',
        }),
      ).toMatchInlineSnapshot(
        `"https://github.com/electron/electron/releases/download/v6.0.0/custom-built-electron.zip"`,
      );
    });
  });
});
