'use strict'

const download = require('./')

console.log('Checksum test')
download({
  version: '1.3.3',
  arch: 'x64',
  platform: 'win32',
  symbols: true
}, (err, zipPath) => {
  if (err) throw err
  console.log('OK! zip:', zipPath)
})
