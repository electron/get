#!/usr/bin/env node

const ghPages = require('gh-pages');
const path = require('path');

const docsDir = path.resolve(__dirname, '..', 'docs');

ghPages.publish(
  docsDir,
  {
    repo: `https://${process.env.GITHUB_TOKEN}@github.com/electron/get.git`,
    silent: true,
  },
  err => {
    if (err) {
      console.error(err.stack || err);
      process.exit(1);
    }
  },
);
