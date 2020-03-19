const execa = require('execa');
const normalizeUrl = require('normalize-url');

module.exports = async (
  {name, publishConfig: {tag} = {}},
  {cwd, env: {DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/', ...env}},
  registry
) => {
  const distTag = tag || (await execa.stdout('npm', ['config', 'get', 'tag'], {cwd, env})) || 'latest';

  return {
    name: `npm package (@${distTag} dist-tag)`,
    url:
      normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)
        ? `https://www.npmjs.com/package/${name}`
        : undefined,
  };
};
