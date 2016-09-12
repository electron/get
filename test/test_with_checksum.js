'use strict'

const download = require('..')
const fs = require('fs')
const test = require('tape')

test('Checksum test', (t) => {
  download({
    version: '1.3.3',
    arch: 'x64',
    platform: 'win32',
    symbols: true
  }, (err, zipPath) => {
    t.error(err, 'Error should be null')
    t.equal(fs.statSync(zipPath).isFile(), true, 'Zip path should exist')
    t.notEqual(fs.statSync(zipPath).size, 0, 'Zip path should be non-empty')
    t.end()
  })
})
