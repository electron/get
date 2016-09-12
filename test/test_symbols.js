'use strict'

const download = require('..')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Symbols test', (t) => {
  download({
    version: '0.26.1',
    arch: 'x64',
    platform: 'darwin',
    symbols: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.ok(/-symbols\.zip$/.test(zipPath), 'Zip path should end with -symbols.zip')
    t.end()
  })
})
