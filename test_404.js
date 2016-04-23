var download = require('./')

download({
  version: '0.25.1',
  arch: 'ia32',
  platform: 'darwin'
}, function (err, zipPath) {
  if (!err) throw Error('Download did not throw an error')
  if (err.message !== 'Failed to find Electron v0.25.1 for darwin-ia32 at https://github.com/electron/electron/releases/download/v0.25.1/electron-v0.25.1-darwin-ia32.zip') {
    throw Error('Download did not throw an error with a custom 404 message: ' + err.message)
  }
  console.log('OK! got expected error:', err.message)
  process.exit(0)
})
