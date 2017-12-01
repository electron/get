# jdk-download

Downloads an [OpenJDK](https://github.com/ojdkbuild/ojdkbuild) release zip from GitHub.

### Usage

**Note: Requires Node >= 4.0 to run.**

```javascript
const download = require('jdk-download')

download({
  version: '0.25.1',
  arch: 'ia32',
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
