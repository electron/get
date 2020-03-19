const path = require('path');
const rc = require('rc');
const getRegistryUrl = require('registry-auth-token/registry-url');

module.exports = ({publishConfig: {registry} = {}, name}, {cwd}) =>
  registry
    ? registry
    : getRegistryUrl(
        name.split('/')[0],
        rc('npm', {registry: 'https://registry.npmjs.org/'}, {config: path.resolve(cwd, '.npmrc')})
      );
