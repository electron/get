# @electron/get

> Download Electron release artifacts

## Usage

### Simple: Downloading an Electron Binary ZIP

```js
import { download } from '@electron/get';

const zipFilePath = await download('4.0.4');
```

### Advanced: Downloading a macOS Electron Symbol File


```js
import { downloadArtifact } from '@electron/get';

const zipFilePath = await downloadArtifact({
  version: '4.0.4',
  platform: 'darwin',
  artifactName: 'electron',
  artifactSuffix: 'symbols',
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
