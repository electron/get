'use strict'

const download = require('../lib/index')
const fs = require('fs')
const test = require('tape')

test('404 test', (t) => {
  download({
    version: '1.8.0',
    build: '151-1.b99',
    arch: 'x64',
    platform: 'win32',
    quiet: false
  }, (err, zipPath) => {
    if (!err) t.fail('Download should throw an error')
    t.equal(fs.existsSync(zipPath), false, 'Zip path should not exist')
    t.equal(err.message, 'Failed to find JDK 1.8.0 for windows-x86_64 at https://github.com/ojdkbuild/ojdkbuild/releases/download/1.8.0.151-1/java-1.8.0-openjdk-1.8.0.151-1.b99.ojdkbuild.windows.x86_64.zip', 'Error message should contain version and URL')
    t.end()
  })
})
