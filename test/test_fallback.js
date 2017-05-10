'use strict'

const download = require('../lib/index')
const os = require('os')
const path = require('path')
const test = require('tape')
const verifyDownloadedZip = require('./helpers').verifyDownloadedZip
const oldCachePath = path.join(os.homedir(), './.electron')

test('Cached version above version 1.3.2 is used as fallback', (t) => {
  const downloadOptions = {
    version: '1.6.2',
    arch: 'x64',
    platform: 'linux',
    quiet: true
  }

  download(
    Object.assign({}, downloadOptions, { cache: oldCachePath }),
    (err, zipPath) => {
      t.notOk(err, 'No error should occur')

      download(downloadOptions, (err, zipPath) => {
        const expectedPath = path.join(oldCachePath, path.basename(zipPath))
        verifyDownloadedZip(t, err, expectedPath)
        t.end()
      })
    }
  )
})

test('Passed cache location has priority above fallback location', (t) => {
  const downloadOptions = {
    version: '1.6.2',
    arch: 'x64',
    platform: 'linux',
    quiet: true
  }

  download(
    Object.assign({}, downloadOptions, { cache: oldCachePath }),
    (err, zipPath) => {
      t.notOk(err, 'No error should occur')

      download(
        Object.assign({}, downloadOptions, { cache: os.tmpdir() }),
        (err, zipPath) => {
          const expectedPath = path.join(os.tmpdir(), path.basename(zipPath))
          t.equal(zipPath, expectedPath)
          verifyDownloadedZip(t, err, expectedPath)
          t.end()
        }
      )
    }
  )
})
