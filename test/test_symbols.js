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
    t.end()
  })
})
