import * as debug from 'debug';
import { getEnv, setEnv } from './utils';

const d = debug('@electron/get:proxy');

/**
 * Initializes a third-party proxy module for HTTP(S) requests.
 */
export function initializeProxy(): void {
  try {
    // Code originally from https://github.com/yeoman/yo/blob/b2eea87e/lib/cli.js#L19-L28
    const MAJOR_NODEJS_VERSION = parseInt(process.version.slice(1).split('.')[0], 10);

    if (MAJOR_NODEJS_VERSION >= 10) {
      // See: https://github.com/electron/get/pull/214#discussion_r798845713
      const env = getEnv('GLOBAL_AGENT_');

      setEnv('GLOBAL_AGENT_HTTP_PROXY', env('HTTP_PROXY'));
      setEnv('GLOBAL_AGENT_HTTPS_PROXY', env('HTTPS_PROXY'));
      setEnv('GLOBAL_AGENT_NO_PROXY', env('NO_PROXY'));

      // `global-agent` works with Node.js v10 and above.
      require('global-agent').bootstrap();
    } else {
      // `global-tunnel-ng` works with Node.js v10 and below.
      require('global-tunnel-ng').initialize();
    }
  } catch (e) {
    d('Could not load either proxy modules, built-in proxy support not available:', e);
  }
}
