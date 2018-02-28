'use strict'

const download = require('../lib/index')
const fs = require('fs')
const path = require('path')
const temp = require('temp').track()
const test = require('tape')

test('Autodownload test', (t) => {
  const cachePath = temp.mkdirSync('electron-download-')

  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'win32',
    quiet: true,
    autoDownload: false,
    cache: cachePath
  }, (err) => {
    t.not(err, null, 'threw error')
    t.equal(err.message.substr(err.message.length - 48), 'does not exist locally and autoDownload is false', 'missing file throws error')

    download({
      version: '0.25.1',
      arch: 'ia32',
      platform: 'win32',
      quiet: true,
      autoDownload: false,
      cache: cachePath,
      force: true
    }, (err) => {
      t.not(err, null, 'threw error')
      t.equal(err.message, 'force and autoDownload options are incompatible for Electron Download', 'force and autoDownload incompat')

      fs.writeFileSync(path.join(cachePath, 'electron-v0.25.9-win32-ia32.zip'), 'local')

      download({
        version: '0.25.9',
        arch: 'ia32',
        platform: 'win32',
        quiet: true,
        autoDownload: false,
        cache: cachePath
      }, (err, zipPath) => {
        t.error(err)
        if (!err) {
          t.equal(fs.readFileSync(zipPath, 'utf8'), 'local', 'should use local version')
        }
      })
      t.end()
    })
  })
})
