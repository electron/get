const {promisify} = require('util');
const importFrom = require('import-from');
const conventionalChangelogAngular = require('conventional-changelog-angular');

/**
 * Load `conventional-changelog-parser` options. Handle presets that return either a `Promise<Array>` or a `Promise<Function>`.
 *
 * @param {Object} pluginConfig The plugin configuration.
 * @param {Object} pluginConfig.preset conventional-changelog preset ('angular', 'atom', 'codemirror', 'ember', 'eslint', 'express', 'jquery', 'jscs', 'jshint')
 * @param {string} pluginConfig.config Requierable npm package with a custom conventional-changelog preset
 * @param {Object} pluginConfig.parserOpts Additionnal `conventional-changelog-parser` options that will overwrite ones loaded by `preset` or `config`.
 * @param {Object} pluginConfig.writerOpts Additionnal `conventional-changelog-writer` options that will overwrite ones loaded by `preset` or `config`.
 * @param {Object} context The semantic-release context.
 * @param {Array<Object>} context.commits The commits to analyze.
 * @param {String} context.cwd The current working directory.
 *
 * @return {Promise<Object>} a `Promise` that resolve to the `conventional-changelog-core` config.
 */
module.exports = async ({preset, config, parserOpts, writerOpts}, {cwd}) => {
  let loadedConfig;

  if (preset) {
    const presetPackage = `conventional-changelog-${preset.toLowerCase()}`;
    loadedConfig = importFrom.silent(__dirname, presetPackage) || importFrom(cwd, presetPackage);
  } else if (config) {
    loadedConfig = importFrom.silent(__dirname, config) || importFrom(cwd, config);
  } else {
    loadedConfig = conventionalChangelogAngular;
  }

  if (typeof loadedConfig === 'function') {
    loadedConfig = await promisify(loadedConfig)();
  } else {
    loadedConfig = await loadedConfig;
  }

  return {
    parserOpts: !preset && !config && parserOpts ? parserOpts : {...loadedConfig.parserOpts, ...parserOpts},
    writerOpts: !preset && !config && writerOpts ? writerOpts : {...loadedConfig.writerOpts, ...writerOpts},
  };
};
