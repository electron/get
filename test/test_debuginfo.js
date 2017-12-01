'use strict'

const download = require('../lib/index')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('debuginfo test', (t) => {
  download({
    version: '1.8.0',
    build: '151-1.b12',
    arch: 'x64',
    platform: 'win32',
    debuginfo: true,
    quiet: false
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.ok(/.debuginfo\.zip$/.test(zipPath), 'Zip path should end with .debuginfo.zip')
    t.end()
  })
})
