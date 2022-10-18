import * as debug from 'debug';
import { getEnv, setEnv } from './utils';

const d = debug('@electron/get:proxy');

/**
 * Initializes a third-party proxy module for HTTP(S) requests.
 */
export function initializeProxy(): void {
  try {
    // See: https://github.com/electron/get/pull/214#discussion_r798845713
    const env = getEnv('GLOBAL_AGENT_');

    setEnv('GLOBAL_AGENT_HTTP_PROXY', env('HTTP_PROXY'));
    setEnv('GLOBAL_AGENT_HTTPS_PROXY', env('HTTPS_PROXY'));
    setEnv('GLOBAL_AGENT_NO_PROXY', env('NO_PROXY'));

    /**
     * TODO: replace global-agent with a hpagent. @BlackHole1
     * https://github.com/sindresorhus/got/blob/HEAD/documentation/tips.md#proxying
     */
    require('global-agent').bootstrap();
  } catch (e) {
    d('Could not load either proxy modules, built-in proxy support not available:', e);
  }
}
