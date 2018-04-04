'use strict'

const download = require('../lib/index')
const fs = require('fs')
const test = require('tape')
const inGFW = require('in-gfw')

test('404 test', (t) => {
  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'darwin',
    quiet: true
  }, (err, zipPath) => {
    if (!err) t.fail('Download should throw an error')
    t.equal(fs.existsSync(zipPath), false, 'Zip path should not exist')
    if (inGFW.osSync()) {
      t.equal(err.message, 'Failed to find Electron v0.25.1 for darwin-ia32 at https://npm.taobao.org/mirrors/electron/0.25.1/electron-v0.25.1-darwin-ia32.zip', 'Error message should contain version and URL')
    } else {
      t.equal(err.message, 'Failed to find Electron v0.25.1 for darwin-ia32 at https://github.com/electron/electron/releases/download/v0.25.1/electron-v0.25.1-darwin-ia32.zip', 'Error message should contain version and URL')
    }
    t.end()
  })
})
