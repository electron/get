import { getArtifactFileName } from '../src/artifact-utils';

describe('artifact-utils', () => {
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
});
