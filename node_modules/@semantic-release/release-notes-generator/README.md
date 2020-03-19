# **release-notes-generator**

[**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to generate changelog content with [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)

[![Travis](https://img.shields.io/travis/semantic-release/release-notes-generator.svg)](https://travis-ci.org/semantic-release/release-notes-generator)
[![Codecov](https://img.shields.io/codecov/c/github/semantic-release/release-notes-generator.svg)](https://codecov.io/gh/semantic-release/release-notes-generator)
[![Greenkeeper badge](https://badges.greenkeeper.io/semantic-release/release-notes-generator.svg)](https://greenkeeper.io/)

[![npm latest version](https://img.shields.io/npm/v/@semantic-release/release-notes-generator/latest.svg)](https://www.npmjs.com/package/@semantic-release/release-notes-generator)
[![npm next version](https://img.shields.io/npm/v/@semantic-release/release-notes-generator/next.svg)](https://www.npmjs.com/package/@semantic-release/release-notes-generator)

| Step            | Description                                                                                                                                                          |
|-----------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `generateNotes` | Generate release notes for the commits added since the last release with [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog). |

## Install

```bash
$ npm install @semantic-release/release-notes-generator -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/caribou/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    ["semantic-release/commit-analyzer", {
      "preset": "angular",
      "parserOpts": {
        "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
      },
    }],
    ["semantic-release/release-notes-generator", {
      "preset": "angular",
      "parserOpts": {
        "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
      },
      "writerOpts": {
        "commitsSort": ["subject", "scope"],
      }
    }]
  ]
}
```

With this example:
- the commits that contains `BREAKING CHANGE`, `BREAKING CHANGES` or `BREAKING` in their body will be considered breaking changes (by default the [angular preset](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/index.js#L14) checks only for `BREAKING CHANGE` and `BREAKING CHANGES`)
- the commits will be sorted in the changelog by `subject` then `scope` (by default the [angular preset](https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/conventional-changelog-angular/index.js#L90) sort the commits in the changelog by `scope` then `subject`)

## Configuration

### Options

| Option       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Default                                                                                                                           |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| `preset`     | [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) preset (possible values: [`angular`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular), [`atom`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-atom), [`codemirror`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-codemirror), [`ember`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-ember), [`eslint`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint), [`express`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-express), [`jquery`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jquery), [`jshint`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-jshint)). | [`angular`](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) |
| `config`     | NPM package name of a custom [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) preset.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | -                                                                                                                                 |
| `parserOpts` | Additional [conventional-commits-parser](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-commits-parser#conventionalcommitsparseroptions) options that will extends the ones loaded by `preset` or `config`. This is convenient to use a [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) preset with some customizations without having to create a new module.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | -                                                                                                                                 |
| `writerOpts` | Additional [conventional-commits-writer](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-writer#options) options that will extends the ones loaded by `preset` or `config`. This is convenient to use a [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog) preset with some customizations without having to create a new module.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | -                                                                                                                                 |

**Notes**: in order to use a `preset` it must be installed (for example to use the [eslint preset](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-eslint) you must install it with `npm install conventional-changelog-eslint -D`)

**Note**: `config` will be overwritten by the values of `preset`. You should use either `preset` or `config`, but not both.

**Note**: Individual properties of `parserOpts` and `writerOpts` will override ones loaded with an explicitly set `preset` or `config`. If `preset` or `config` are not set, only the properties set in `parserOpts` and `writerOpts` will be used.
