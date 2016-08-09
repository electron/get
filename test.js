'use strict'

const download = require('./')

download({
  version: '0.25.1',
  arch: 'ia32',
  platform: 'win32'
}, (err, zipPath) => {
  if (err) throw err
  console.log('OK! zip:', zipPath)
  process.exit(0)
})
