# @electron/download

> Download Electron release artifacts

## Usage

### Simple: Downloading an Electron Binary ZIP

```js
import { downloadElectron } from '@electron/download';

const zipFilePath = await downloadElectron('4.0.4');
```

### Advanced: Downloading a macOS Electron Symbol File


```js
import { downloadElectron } from '@electron/download';

const zipFilePath = await downloadElectron({
  version: '4.0.4',
  platform: 'darwin',
  assetName: 'electron',
  assetSuffix: 'symbols',
  arch: 'x64',
});
```

## How It Works

This module downloads Electron to a known place on your system and caches it
so that future requests for that asset can be returned instantly.  The cache
locations are:

* Linux: `$XDG_CACHE_HOME` or `~/.cache/electron/`
* MacOS: `~/Library/Caches/electron/`
* Windows: `%LOCALAPPDATA%/electron/Cache` or `~/AppData/Local/electron/Cache/`
