'use strict'

const download = require('../lib/index')
const os = require('os')
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip

test('Cached version above version 1.3.2 is used as fallback', (t) => {
  const oldCachePath = path.join(os.homedir(), './.electron')
  const downloadOptions = {
    version: '1.6.2',
    arch: 'x64',
    platform: 'linux',
    quiet: true
  }

  download(
    Object.assign(
      {},
      downloadOptions,
      { cache: oldCachePath }
    ),
    (err, zipPath) => {
      t.notOk(err, 'No error should occur')

      download(downloadOptions, (err, zipPath) => {
        verifyDownloadedZip(t, err, zipPath)
        t.end()
      })
    }
  )
})
