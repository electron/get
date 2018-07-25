'use strict'

const arch = require('./arch')
const debug = require('debug')('electron-download')
const envPaths = require('env-paths')
const fs = require('fs-extra')
const nodeify = require('nodeify')
const nugget = require('nugget')
const os = require('os')
const path = require('path')
const pify = require('pify')
const rc = require('rc')
const semver = require('semver')
const sumchecker = require('sumchecker')

class ElectronDownloader {
  constructor (opts) {
    this.opts = Object.assign({ autoDownload: true }, opts)
  }

  get baseUrl () {
    if (this.version.indexOf('nightly') !== -1) {
      return process.env.NPM_CONFIG_ELECTRON_NIGHTLY_MIRROR ||
        process.env.npm_config_electron_nightly_mirror ||
        process.env.npm_package_config_electron_nightly_mirror ||
        process.env.ELECTRON_NIGHTLY_MIRROR ||
        this.opts.nightly_mirror ||
        'https://github.com/electron/nightlies/releases/download/v'
    }
    return process.env.NPM_CONFIG_ELECTRON_MIRROR ||
      process.env.npm_config_electron_mirror ||
      process.env.npm_package_config_electron_mirror ||
      process.env.ELECTRON_MIRROR ||
      this.opts.mirror ||
      'https://github.com/electron/electron/releases/download/v'
  }

  get middleUrl () {
    return process.env.NPM_CONFIG_ELECTRON_CUSTOM_DIR ||
      process.env.npm_config_electron_custom_dir ||
      process.env.npm_package_config_electron_custom_dir ||
      process.env.ELECTRON_CUSTOM_DIR ||
      this.opts.customDir ||
      this.version
  }

  get urlSuffix () {
    return process.env.NPM_CONFIG_ELECTRON_CUSTOM_FILENAME ||
      process.env.npm_config_electron_custom_filename ||
      process.env.npm_package_config_electron_custom_filename ||
      process.env.ELECTRON_CUSTOM_FILENAME ||
      this.opts.customFilename ||
      this.filename
  }

  get arch () {
    return this.opts.arch || arch.host(this.quiet)
  }

  get cache () {
    const cacheLocation = this.opts.cache || process.env.ELECTRON_CACHE
    if (cacheLocation) return cacheLocation

    const oldCacheDirectory = path.join(os.homedir(), './.electron')
    if (fs.pathExistsSync(path.join(oldCacheDirectory, this.filename))) {
      return oldCacheDirectory
    }
    // use passed argument or XDG environment variable fallback to OS default
    return envPaths('electron', {suffix: ''}).cache
  }

  get cachedChecksum () {
    return path.join(this.cache, `${this.checksumFilename}-${this.version}`)
  }

  get cachedZip () {
    return path.join(this.cache, this.filename)
  }

  get checksumFilename () {
    return 'SHASUMS256.txt'
  }

  get checksumUrl () {
    return `${this.baseUrl}${this.middleUrl}/${this.checksumFilename}`
  }

  get filename () {
    const type = `${this.platform}-${this.arch}`
    const suffix = `v${this.version}-${type}`

    if (this.chromedriver) {
      // Chromedriver started using Electron's version in asset name in 1.7.0
      if (semver.gte(this.version, '1.7.0')) {
        return `chromedriver-${suffix}.zip`
      } else {
        return `chromedriver-v2.21-${type}.zip`
      }
    } else if (this.mksnapshot) {
      return `mksnapshot-${suffix}.zip`
    } else if (this.ffmpeg) {
      return `ffmpeg-${suffix}.zip`
    } else if (this.symbols) {
      return `electron-${suffix}-symbols.zip`
    } else if (this.dsym) {
      return `electron-${suffix}-dsym.zip`
    } else {
      return `electron-${suffix}.zip`
    }
  }

  get platform () {
    return this.opts.platform || os.platform()
  }

  get proxy () {
    let proxy
    if (this.npmrc && this.npmrc.proxy) proxy = this.npmrc.proxy
    if (this.npmrc && this.npmrc['https-proxy']) proxy = this.npmrc['https-proxy']

    return proxy
  }

  get quiet () {
    return this.opts.quiet || process.stdout.rows < 1
  }

  get strictSSL () {
    let strictSSL = true
    if (this.opts.strictSSL === false || this.npmrc['strict-ssl'] === false) {
      strictSSL = false
    }

    return strictSSL
  }

  get force () {
    return this.opts.force || false
  }

  get symbols () {
    return this.opts.symbols || false
  }

  get dsym () {
    return this.opts.dsym || false
  }

  get chromedriver () {
    return this.opts.chromedriver || false
  }

  get mksnapshot () {
    return this.opts.mksnapshot || false
  }

  get ffmpeg () {
    return this.opts.ffmpeg || false
  }

  get url () {
    return process.env.ELECTRON_DOWNLOAD_OVERRIDE_URL ||
      `${this.baseUrl}${this.middleUrl}/${this.urlSuffix}`
  }

  get verifyChecksumNeeded () {
    return !this.opts.disableChecksumSafetyCheck && semver.gte(this.version, '1.3.2')
  }

  get version () {
    return this.opts.version
  }

  get headers () {
    return this.opts.headers
  }

  validateOptions () {
    return new Promise((resolve, reject) => {
      if (this.opts.force && !this.opts.autoDownload) {
        reject(new Error('force and autoDownload options are incompatible for Electron Download'))
      }

      this.npmrc = {}
      try {
        rc('npm', this.npmrc)
      } catch (error) {
        console.error(`Error reading npm configuration: ${error.message}`)
      }

      resolve()
    })
  }

  checkForCachedChecksum () {
    return fs.pathExists(this.cachedChecksum)
      .then(exists => {
        if (exists && !this.force) {
          return this.verifyChecksum()
        } else {
          return this.downloadChecksum()
        }
      })
  }

  checkForCachedZip () {
    return fs.pathExists(this.cachedZip).then(exists => {
      if (exists && !this.force) {
        debug('zip exists', this.cachedZip)
        return this.checkIfZipNeedsVerifying()
      } else if (this.opts.autoDownload) {
        return this.ensureCacheDir()
      } else {
        throw new Error(`File: "${this.cachedZip}" does not exist locally and autoDownload is false`)
      }
    })
  }

  checkIfZipNeedsVerifying () {
    if (this.verifyChecksumNeeded) {
      debug('Verifying zip with checksum')
      return this.checkForCachedChecksum()
    }
    return this.cachedZip
  }

  createLocalCacheDir () {
    // try local folder if homedir is off limits (e.g. some linuxes return '/' as homedir)
    const localCache = path.resolve('./.electron')
    return fs.mkdirs(localCache)
      .then(() => localCache)
  }

  createCacheDir () {
    return fs.mkdirs(this.cache)
      .catch(err => {
        if (err.code !== 'EACCES') throw err
        return this.createLocalCacheDir()
      }).then(cache => cache || this.cache)
  }

  downloadChecksum () {
    return this.downloadFile(this.checksumUrl, this.cachedChecksum)
      .then(() => this.verifyChecksum())
  }

  downloadFile (url, cacheFilename) {
    const tempFileName = `tmp-${process.pid}-${(ElectronDownloader.tmpFileCounter++).toString(16)}-${path.basename(cacheFilename)}`
    const nuggetOpts = {
      target: tempFileName,
      dir: this.cache,
      resume: true,
      quiet: this.quiet,
      strictSSL: this.strictSSL,
      proxy: this.proxy,
      headers: this.headers
    }

    debug('downloading', url, 'to', this.cache)
    return pify(nugget)(url, nuggetOpts)
      .catch(errors => {
        // nugget returns an array of errors but we only need 1st because we only have 1 url
        return this.handleDownloadError(errors[0])
      }).then(() => this.moveFileToCache(tempFileName, cacheFilename))
  }

  downloadIfNotCached () {
    if (!this.version) throw new Error('must specify version')
    debug('info', {cache: this.cache, filename: this.filename, url: this.url})
    return this.validateOptions()
      .then(() => this.checkForCachedZip())
  }

  downloadZip () {
    return this.downloadFile(this.url, this.cachedZip)
      .then(() => this.checkIfZipNeedsVerifying())
  }

  ensureCacheDir () {
    debug('creating cache dir')
    return this.createCacheDir()
      .then(actualCache => {
        this.opts.cache = actualCache // in case cache dir changed
        return this.downloadZip()
      })
  }

  handleDownloadError (error) {
    if (error.message.indexOf('404') === -1) throw error
    if (this.symbols) {
      error.message = `Failed to find Electron symbols v${this.version} for ${this.platform}-${this.arch} at ${this.url}`
    } else {
      error.message = `Failed to find Electron v${this.version} for ${this.platform}-${this.arch} at ${this.url}`
    }

    throw error
  }

  moveFileToCache (filename, target) {
    const cache = this.cache
    debug('moving', filename, 'from', cache, 'to', target)
    return fs.rename(path.join(cache, filename), target)
      .catch(err => this.cleanupLocation(cache, err))
  }

  verifyChecksum () {
    const options = {}
    if (semver.lt(this.version, '1.3.5')) {
      options.defaultTextEncoding = 'binary'
    }
    const checker = new sumchecker.ChecksumValidator('sha256', this.cachedChecksum, options)
    return checker.validate(this.cache, this.filename)
      .catch(err => this.cleanupLocation(this.cachedZip, err))
      .then(() => this.cachedZip)
  }

  cleanupLocation (location, error) {
    return fs.unlink(location)
      .then(() => { throw error })
  }
}

ElectronDownloader.tmpFileCounter = 0

module.exports = function download (opts, cb) {
  const downloader = new ElectronDownloader(opts)
  return nodeify(downloader.downloadIfNotCached(), cb)
}
