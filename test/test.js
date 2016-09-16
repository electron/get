'use strict'

const download = require('../lib/index')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Basic test', (t) => {
  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'win32',
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
