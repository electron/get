# electron-download

[![NPM](https://nodei.co/npm/electron-download.png)](https://nodei.co/npm/electron-download/)

downloads a electron release zip from github

used by [electron-prebuilt](https://npmjs.org/electron-prebuilt) and [electron-packager](https://npmjs.org/electron-packager)

### usage

```plain
$ npm install --global electron-download
$ electron-download --version=0.31.1
```

```
var download = require('electron-download')

download({
  version: '0.25.1',
  arch: 'ia32',
  platform: 'win32',
  cache: './zips' // defaults to <users home directory>/.electron
}, function (err, zipPath) {
  // zipPath will be the path of the zip that it downloaded.
  // if the zip was already cached it will skip
  // downloading and call the cb with the cached zip path
  // if it wasn't cached it will download the zip and save
  // it in the cache path
})
```

if you don't specify `arch` or `platform` args it will use `require('os')` to get them from the current OS. specifying `version` is mandatory.

If you would like to override the mirror location, three options are available. The mirror URL is composed as `url = ELECTRON_MIRROR + ELECTRON_CUSTOM_DIR + '/' + ELECTRON_CUSTOM_FILENAME`.

You can set the `ELECTRON_MIRROR` or [`NPM_CONFIG_ELECTRON_MIRROR`](https://docs.npmjs.com/misc/config#environment-variables) env or `mirror` opt variable to use a custom base URL for grabbing electron zips. The same pattern applies to `ELECTRON_CUSTOM_DIR` and `ELECTRON_CUSTOM_FILENAME`

```plain
## Electron Mirror of China
ELECTRON_MIRROR="https://npm.taobao.org/mirrors/electron/"

## or for a local mirror
ELECTRON_MIRROR="https://10.1.2.105/"
ELECTRON_CUSTOM_DIR="our/internal/filePath"
```

