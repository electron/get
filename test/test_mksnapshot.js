'use strict'

const download = require('../lib/index')
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('mksnapshot test', (t) => {
  download({
    version: '1.4.0',
    arch: 'x64',
    platform: 'darwin',
    mksnapshot: true,
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.ok(/^mksnapshot-v1\.4\.0-/.test(path.basename(zipPath)), 'Zip path should start with mksnapshot-v.1.4.0')
    t.end()
  })
})
