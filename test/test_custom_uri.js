'use strict'

const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Chromedriver test', (t) => {
  process.env.ELECTRON_MIRROR = 'https://github.com'
  process.env.ELECTRON_CUSTOM_DIR = '/electron-userland/electron-download/archive'
  process.env.ELECTRON_CUSTOM_FILENAME = 'v4.0.0.zip'
  process.env.ELECTRON_NO_CHECKSUM = 'true'
  const download = require('../lib/index')
  download({
    cache: process.env.electron_config_cache,
    version: '4.0.0',
    platform: process.env.npm_config_platform,
    arch: process.env.npm_config_arch,
    strictSSL: process.env.npm_config_strict_ssl === 'true',
    quiet: ['info', 'verbose', 'silly', 'http'].indexOf(process.env.npm_config_loglevel) === -1
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    process.env.ELECTRON_MIRROR = ''
    process.env.ELECTRON_CUSTOM_DIR = ''
    process.env.ELECTRON_CUSTOM_FILENAME = ''
    process.env.ELECTRON_NO_CHECKSUM = ''
    t.end()
  })
})
