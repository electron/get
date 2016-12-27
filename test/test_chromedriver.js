'use strict'

const download = require('../lib/index')
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Chromedriver test', (t) => {
  download({
    version: '1.4.0',
    arch: 'x64',
    platform: 'darwin',
    chromedriver: true,
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.ok(/^chromedriver-v2\.21-/.test(path.basename(zipPath)), 'Zip path should start with chromedriver-v.2.21')
    t.end()
  })
})
