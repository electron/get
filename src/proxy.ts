import * as debug from 'debug';

const d = debug('@electron/get:proxy');

/**
 * Initializes a third-party proxy module for HTTP(S) requests.
 */
export function initializeProxy() {
  try {
    require('global-agent').bootstrap();
  } catch (e) {
    d('Could not load proxy module, built-in proxy support not available:', e);
  }
}
