'use strict'

const download = require('..')
const test = require('tape')

test('Checksum test', (t) => {
  download({
    version: '1.3.3',
    arch: 'x64',
    platform: 'win32',
    symbols: true
  }, (err, zipPath) => {
    t.error(err, 'The error should be null')
    t.end()
  })
})
