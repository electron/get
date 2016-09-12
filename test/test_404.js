'use strict'

const download = require('..')
const fs = require('fs')
const test = require('tape')

test('404 test', (t) => {
  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'darwin'
  }, (err, zipPath) => {
    if (!err) t.fail('Download should throw an error')
    t.equal(fs.existsSync(zipPath), false, 'Zip path should not exist')
    t.equal(err.message, 'Failed to find Electron v0.25.1 for darwin-ia32 at https://github.com/electron/electron/releases/download/v0.25.1/electron-v0.25.1-darwin-ia32.zip', 'Error message should contain version and URL')
    t.end()
  })
})
