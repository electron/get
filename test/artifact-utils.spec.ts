import { getArtifactFileName, FileNameUse } from '../src/artifact-utils';

describe('artifact-utils', () => {
  describe('getArtifactFileName()', () => {
    it('should return just the artifact name for remote generic artifacts', () => {
      expect(
        getArtifactFileName(
          {
            isGeneric: true,
            artifactName: 'test.zip',
            version: 'v1',
          },
          FileNameUse.REMOTE,
        ),
      ).toMatchInlineSnapshot(`"test.zip"`);
    });

    it('should return versioned artifact names for local generic artifacts', () => {
      expect(
        getArtifactFileName({
          isGeneric: true,
          artifactName: 'test.zip',
          version: 'v1',
        }),
      ).toMatchInlineSnapshot(`"v1-test.zip"`);
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
});
