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

test('Cache directory is moved to new location', (t) => {
  // Download to old cache directory location
  download({
    version: '1.4.3',
    arch: 'x64',
    platform: 'linux',
    cache: path.join(homePath(), './.electron')
  }, (err, oldZipPath) => {
    verifyDownloadedZip(t, err, oldZipPath)
    download({
      version: '1.4.4',
      arch: 'x64',
      platform: 'linux'
    }, (err, zipPath) => {
      const oldZipPathName = path.parse(oldZipPath).base
      const movedOldZipPath = path.parse(zipPath)
      movedOldZipPath.base = oldZipPathName

      verifyDownloadedZip(t, err, path.format(movedOldZipPath))
      t.end()
    })
  })
})
