# jdk-download

Downloads an [OpenJDK](https://github.com/ojdkbuild/ojdkbuild) release zip from GitHub.

### Usage

**Note: Requires Node >= 4.0 to run.**

```javascript
const download = require('jdk-download')

download({
  version: '1.8.0',
  build: '151-1.b12',
  arch: 'x64',
  platform: 'win32',
  cache: './zips'
}, function (err, zipPath) {
  // zipPath will be the path of the zip that it downloaded.
  // If the zip was already cached it will skip
  // downloading and call the cb with the cached zip path.
  // If it wasn't cached it will download the zip and save
  // it in the cache path.
})
```
If you don't specify `arch` or `platform` args it will use the built-in `os` module to get the values from the current OS.

**NOTE: As of version 1.0.0 only Windows platform builds are available.**

Specifying `version` is mandatory. The downloaded zip will be verified by its SHA256 checksum.

You can also use `jdk-download` to download the debuginfo assets for a specific OpenJDK release. This can be
configured by setting the `debuginfo` property to `true` in the specified options object.

You can force a re-download of the asset and the `SHASUM` file by setting the
`force` option to `true`.

If you would like to override the mirror location, three options are available. The mirror URL is composed as `url = ELECTRON_MIRROR + ELECTRON_CUSTOM_DIR + '/' + ELECTRON_CUSTOM_FILENAME`.

You can set the `JDK_MIRROR` or [`NPM_CONFIG_JDK_MIRROR`](https://docs.npmjs.com/misc/config#environment-variables) environment variable or `mirror` opt variable to use a custom base URL for grabbing Electron zips. The same pattern applies to `JDK_CUSTOM_DIR` and `JDK_CUSTOM_FILENAME`:

```plain
## local mirror
JDK_MIRROR="https://10.1.2.105/"
JDK_CUSTOM_DIR="our/internal/filePath"
```

You can set JDK_MIRROR in `.npmrc` as well, using the lowercase name:

```plain
jdk_mirror=https://10.1.2.105/
```

### Cache location
The location of the cache depends on the operating system, the defaults are:
- Linux: `$XDG_CACHE_HOME` or `~/.cache/jdk/`
- MacOS: `~/Library/Caches/jdk/`
- Windows: `$LOCALAPPDATA/jdk/Cache` or `~/AppData/Local/jdk/Cache/`

You can set the `JDK_CACHE` environment variable to set cache location explicitly.
