'use strict'

const download = require('../lib/index')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('dSYM test', (t) => {
  download({
    version: '1.4.15',
    arch: 'x64',
    platform: 'darwin',
    dsym: true,
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.ok(/-dsym\.zip$/.test(zipPath), 'Zip path should end with -dsym.zip')
    t.end()
  })
})
