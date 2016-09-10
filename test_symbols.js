const download = require('./')

console.log('Symbols test')
download({
  version: '0.26.1',
  arch: 'x64',
  platform: 'darwin',
  symbols: 'true'
}, (err, zipPath) => {
  if (err) throw err
  console.log('OK! zip:', zipPath)
})
