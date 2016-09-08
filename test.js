'use strict'

const download = require('./')

console.log('Basic test')
download({
  version: '0.25.1',
  arch: 'ia32',
  platform: 'win32'
}, (err, zipPath) => {
  if (err) throw err
  console.log('OK! zip:', zipPath)
})
