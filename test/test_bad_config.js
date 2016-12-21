'use strict'

const download = require('../lib/index')
const fs = require('fs')
const homePath = require('home-path')
const mkdirp = require('mkdirp').sync
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('bad config test', (t) => {
  const configPath = path.join(homePath(), '.config', 'npm', 'config')
  mkdirp(path.dirname(configPath))
  fs.writeFileSync(configPath, '{')

  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'win32',
    quiet: true
  }, (err, zipPath) => {
    fs.unlinkSync(configPath)
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
