import fs from 'graceful-fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FetchDownloader } from '../src/FetchDownloader';

describe('FetchDownloader', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.promises.mkdtemp(path.resolve(os.tmpdir(), 'fetch-spec-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
    delete process.env.ELECTRON_GET_NO_PROGRESS;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('progress bar suppression', () => {
    it('should not schedule a progress bar timer when quiet: true', async () => {
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('mocked'));
      vi.useFakeTimers();

      const downloader = new FetchDownloader();
      const target = path.resolve(tmpDir, 'out.txt');

      await downloader.download(target, target, { quiet: true }).catch(() => {
        /* ignore */
      });

      expect(vi.getTimerCount()).toBe(0);
    });

    it('should not schedule a progress bar timer when ELECTRON_GET_NO_PROGRESS is set', async () => {
      process.env.ELECTRON_GET_NO_PROGRESS = '1';
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('mocked'));
      vi.useFakeTimers();

      const downloader = new FetchDownloader();
      const target = path.resolve(tmpDir, 'out.txt');

      await downloader.download(target, target).catch(() => {
        /* ignore */
      });

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('timer cleanup', () => {
    it('should clear the progress timer even when the download fails', async () => {
      vi.spyOn(fs.promises, 'mkdir').mockResolvedValue(undefined);
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('boom'));
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

      const downloader = new FetchDownloader();
      const target = path.resolve(tmpDir, 'out.txt');

      await expect(downloader.download(target, target)).rejects.toThrow('boom');

      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
