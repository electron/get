'use strict'

const download = require('..')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Basic test', (t) => {
  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'win32'
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
