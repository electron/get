const path = require('path');
const rc = require('rc');
const {appendFile} = require('fs-extra');
const getAuthToken = require('registry-auth-token');
const nerfDart = require('nerf-dart');
const AggregateError = require('aggregate-error');
const getError = require('./get-error');

module.exports = async (registry, {cwd, env: {NPM_TOKEN, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL}, logger}) => {
  logger.log('Verify authentication for registry %s', registry);
  const config = path.resolve(cwd, '.npmrc');
  if (getAuthToken(registry, {npmrc: rc('npm', {registry: 'https://registry.npmjs.org/'}, {config})})) {
    return;
  }

  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    await appendFile(config, `\n_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);
    logger.log(`Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${config}`);
  } else if (NPM_TOKEN) {
    await appendFile(config, `\n${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);
    logger.log(`Wrote NPM_TOKEN to ${config}`);
  } else {
    throw new AggregateError([getError('ENONPMTOKEN', {registry})]);
  }
};
