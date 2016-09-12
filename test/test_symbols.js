'use strict'

const download = require('..')
const test = require('tape')

test('Symbols test', (t) => {
  download({
    version: '0.26.1',
    arch: 'x64',
    platform: 'darwin',
    symbols: 'true'
  }, (err, zipPath) => {
    t.error(err, 'The error should be null')
    t.end()
  })
})
