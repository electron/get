'use strict'

const download = require('..')
const fs = require('fs')
const test = require('tape')

test('Basic test', (t) => {
  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'win32'
  }, (err, zipPath) => {
    t.error(err, 'Error should be null')
    t.equal(fs.statSync(zipPath).isFile(), true, 'Zip path should exist')
    t.notEqual(fs.statSync(zipPath).size, 0, 'Zip path should be non-empty')
    t.end()
  })
})
