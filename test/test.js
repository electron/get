'use strict'

const download = require('../lib/index')
const fs = require('fs')
const path = require('path')
const temp = require('temp').track()
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Basic test', (t) => {
  console.log('stdout rows?', process.stdout.rows)
  console.log('TTY?', process.stdout.isTTY)

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

test('Force option', (t) => {
  const cachePath = temp.mkdirSync('electron-download-')

  fs.writeFileSync(path.join(cachePath, 'ffmpeg-v1.4.13-win32-ia32.zip'), '')
  fs.writeFileSync(path.join(cachePath, 'SHASUMS256.txt-1.4.13'), '')

  download({
    version: '1.4.13',
    arch: 'ia32',
    platform: 'win32',
    ffmpeg: true,
    cache: cachePath,
    force: true,
    quiet: true
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
