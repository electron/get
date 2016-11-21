'use strict'

const download = require('../lib/index')
const envPaths = require('env-paths')
const fs = require('fs')
const homePath = require('home-path')
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

<<<<<<< 6cd027ea33232966abc4efcaf1215133df966572
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
  const oldCachePath = path.join(homePath(), './.electron')
  const newCachePath = envPaths('electron-download', {suffix: ''}).cache

  fs.mkdir(oldCachePath, () => {
    // Put file in old cache location
    fs.writeFileSync(path.join(oldCachePath, 'moveMe'))

    download({
      version: '1.1.0',
      arch: 'x64',
      platform: 'linux'
    }, (downloadError, zipPath) => {
      t.false(downloadError)

      fs.stat(path.join(newCachePath, 'moveMe'), (error) => {
        // If file exists no error is returned
        t.false(error, 'File should be moved to new cache directory')

        // Cleanup
        fs.unlinkSync(path.join(newCachePath, 'moveMe'))

        t.end()
      })
    })
  })
})
