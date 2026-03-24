import fs from 'graceful-fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

describe('initializeProxy', () => {
  // `require` is not defined in ESM modules. vitest injects a shim, so the
  // runtime failure only manifests when running the built package under
  // plain Node.js. Guard against regressions by checking the source uses
  // createRequire(import.meta.url) to define require before calling it.
  it('defines require via createRequire before using it', () => {
    const source = fs.readFileSync(path.resolve(__dirname, '../src/proxy.ts'), 'utf8');
    expect(source).toMatch(/createRequire\s*\(\s*import\.meta\.url\s*\)/);
  });
});
