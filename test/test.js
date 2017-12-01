'use strict'

const download = require('../lib/index')
const fs = require('fs')
const path = require('path')
const temp = require('temp').track()
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Basic test', (t) => {
  download({
    version: '1.8.0',
    build: '151-1.b12',
    arch: 'x64',
    platform: 'win32',
    debuginfo: true,
    quiet: false
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})

test('Force option', (t) => {
  const cachePath = temp.mkdirSync('jdk-download-')

  fs.writeFileSync(path.join(cachePath, 'java-1.8.0-openjdk-1.8.0.151-1.b12.ojdkbuild.windows.x86_64.debuginfo.zip'), '')
  fs.writeFileSync(path.join(cachePath, 'java-1.8.0-openjdk-1.8.0.151-1.b12.ojdkbuild.windows.x86_64.debuginfo.zip.sha256'), '')

  download({
    version: '1.8.0',
    build: '151-1.b12',
    arch: 'x64',
    platform: 'win32',
    debuginfo: true,
    cache: cachePath,
    force: true,
    quiet: false
  }, (err, zipPath) => {
    verifyDownloadedZip(t, err, zipPath)
    t.end()
  })
})
