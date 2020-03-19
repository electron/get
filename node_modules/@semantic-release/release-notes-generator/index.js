const {parse, format} = require('url');
const {find} = require('lodash');
const getStream = require('get-stream');
const intoStream = require('into-stream');
const parser = require('conventional-commits-parser').sync;
const writer = require('conventional-changelog-writer');
const filter = require('conventional-commits-filter');
const debug = require('debug')('semantic-release:release-notes-generator');
const loadChangelogConfig = require('./lib/load-changelog-config');
const HOSTS_CONFIG = require('./lib/hosts-config');

/**
 * Generate the changelog for all the commits in `options.commits`.
 *
 * @param {Object} pluginConfig The plugin configuration.
 * @param {String} pluginConfig.preset conventional-changelog preset ('angular', 'atom', 'codemirror', 'ember', 'eslint', 'express', 'jquery', 'jscs', 'jshint').
 * @param {String} pluginConfig.config Requierable npm package with a custom conventional-changelog preset
 * @param {Object} pluginConfig.parserOpts Additional `conventional-changelog-parser` options that will overwrite ones loaded by `preset` or `config`.
 * @param {Object} pluginConfig.writerOpts Additional `conventional-changelog-writer` options that will overwrite ones loaded by `preset` or `config`.
 * @param {Object} context The semantic-release context.
 * @param {Array<Object>} context.commits The commits to analyze.
 * @param {Object} context.lastRelease The last release with `gitHead` corresponding to the commit hash used to make the last release and `gitTag` corresponding to the git tag associated with `gitHead`.
 * @param {Object} context.nextRelease The next release with `gitHead` corresponding to the commit hash used to make the  release, the release `version` and `gitTag` corresponding to the git tag associated with `gitHead`.
 * @param {Object} context.options.repositoryUrl The git repository URL.
 *
 * @returns {String} The changelog for all the commits in `context.commits`.
 */
async function generateNotes(pluginConfig, context) {
  const {commits, lastRelease, nextRelease, options} = context;
  const repositoryUrl = options.repositoryUrl.replace(/\.git$/i, '');
  const {parserOpts, writerOpts} = await loadChangelogConfig(pluginConfig, context);

  const [match, auth, host, path] = /^(?!.+:\/\/)(?:(.*)@)?(.*?):(.*)$/.exec(repositoryUrl) || [];
  let {hostname, port, pathname, protocol} = parse(
    match ? `ssh://${auth ? `${auth}@` : ''}${host}/${path}` : repositoryUrl
  );
  protocol = protocol && /http[^s]/.test(protocol) ? 'http' : 'https';
  const [, owner, repository] = /^\/([^/]+)?\/?(.+)?$/.exec(pathname);

  const {issue, commit, referenceActions, issuePrefixes} =
    find(HOSTS_CONFIG, conf => conf.hostname === hostname) || HOSTS_CONFIG.default;
  const parsedCommits = filter(
    commits.map(rawCommit => ({
      ...rawCommit,
      ...parser(rawCommit.message, {referenceActions, issuePrefixes, ...parserOpts}),
    }))
  );
  const previousTag = lastRelease.gitTag || lastRelease.gitHead;
  const currentTag = nextRelease.gitTag || nextRelease.gitHead;
  const changelogContext = {
    version: nextRelease.version,
    host: format({protocol, hostname, port}),
    owner,
    repository,
    previousTag,
    currentTag,
    linkCompare: currentTag && previousTag,
    issue,
    commit,
  };

  debug('version: %o', nextRelease.version);
  debug('host: %o', hostname);
  debug('owner: %o', owner);
  debug('repository: %o', repository);
  debug('previousTag: %o', previousTag);
  debug('currentTag: %o', currentTag);

  return getStream(intoStream.obj(parsedCommits).pipe(writer(changelogContext, writerOpts)));
}

module.exports = {generateNotes};
