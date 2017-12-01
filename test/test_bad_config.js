'use strict'

const download = require('../lib/index')
const fs = require('fs')
const ensureDir = require('fs-extra').ensureDirSync
const os = require('os')
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('bad config test', (t) => {
  const configPath = path.join(os.homedir(), '.config', 'npm', 'config')
  console.log(configPath)
  ensureDir(path.dirname(configPath))
  fs.writeFileSync(configPath, '{')

  download({
    version: '1.8.0',
    arch: 'x64',
    build: '151-1.b12',
    debuginfo: true,
    platform: 'win32',
    quiet: false
  }, (err, zipPath) => {
    fs.unlinkSync(configPath)
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
