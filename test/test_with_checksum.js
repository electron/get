'use strict'

const download = require('../lib/index')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Checksum test', (t) => {
  download({
    version: '1.3.3',
    arch: 'x64',
    platform: 'win32',
    symbols: true,
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
