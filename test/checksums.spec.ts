import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';

import { FixtureDownloader } from './FixtureDownloader';
import { downloadArtifact } from '../src';

describe('Hard-coded checksums', () => {
  const downloader = new FixtureDownloader();

  let cacheRoot: string;
  beforeEach(async () => {
    cacheRoot = await fs.mkdtemp(path.resolve(os.tmpdir(), 'electron-download-spec-'));
  });

  afterEach(async () => {
    await fs.remove(cacheRoot);
  });

  describe('download()', () => {
    it('should succeed with valid checksums', async () => {
      const zipPath = await downloadArtifact({
        cacheRoot,
        downloader,
        platform: 'darwin',
        arch: 'x64',
        version: '2.0.9',
        artifactName: 'electron',
        checksums: {
          'electron-v2.0.9-darwin-x64.zip':
            'ff0bfe95bc2a351e09b959aab0bdab893cb33c203bfff83413c3f0989858c684',
        },
      });
      expect(typeof zipPath).toEqual('string');
      expect(await fs.pathExists(zipPath)).toEqual(true);
      expect(path.extname(zipPath)).toEqual('.zip');
    });

    it('should be rejected with valid checksums', async () => {
      await expect(
        downloadArtifact({
          cacheRoot,
          downloader,
          platform: 'darwin',
          arch: 'x64',
          version: '2.0.9',
          artifactName: 'electron',
          checksums: {
            'electron-v2.0.9-darwin-x64.zip':
              'f28e3f9d2288af6abc31b19ca77a9241499fcd0600420197a9ff8e5e06182701',
          },
        }),
      ).rejects.toMatchInlineSnapshot(
        `[Error: Generated checksum for "electron-v2.0.9-darwin-x64.zip" did not match expected checksum.]`,
      );
    });
  });
});
