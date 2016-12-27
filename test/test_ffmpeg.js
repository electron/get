'use strict'

const download = require('../lib/index')
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('ffmpeg test', (t) => {
  download({
    version: '1.4.0',
    arch: 'x64',
    platform: 'darwin',
    ffmpeg: true,
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.ok(/^ffmpeg-v1\.4\.0-/.test(path.basename(zipPath)), 'Zip path should start with ffmpeg-v1.4.0')
    t.end()
  })
})
