'use strict'

const download = require('./')

download({
  version: '0.26.1',
  platform: 'darwin',
  symbols: 'true'
}, (err, zipPath) => {
  if (err) throw err
  console.log('OK! zip:', zipPath)
  process.exit(0)
})
