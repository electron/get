'use strict'

const download = require('../lib/index')
const fs = require('fs')
const path = require('path')
const temp = require('temp').track()
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

test('Disable checksum option', (t) => {
  const cachePath = temp.mkdirSync('electron-download-')

  fs.writeFileSync(path.join(cachePath, 'electron-v1.4.13-win32-ia32.zip'), 'X')

  download({
    version: '1.4.13',
    arch: 'ia32',
    platform: 'win32',
    cache: cachePath,
    quiet: true,
    disableChecksumSafetyCheck: true
  }, (err, zipPath) => {
    t.error(err, 'Error should be null')
    if (!err) {
      t.equal(fs.readFileSync(path.join(cachePath, 'electron-v1.4.13-win32-ia32.zip'), 'utf8'), 'X')
    }
    t.end()
  })
})
