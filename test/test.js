'use strict'

const download = require('..')
const test = require('tape')

test('Basic test', (t) => {
  download({
    version: '0.25.1',
    arch: 'ia32',
    platform: 'win32'
  }, (err, zipPath) => {
    t.error(err, 'The error should be null')
    t.end()
  })
})
