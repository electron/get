'use strict'

const debug = require('debug')('electron-download')
const fs = require('fs-extra')
const homePath = require('home-path')
const npmrc = require('rc')('npm')
const nugget = require('nugget')
const os = require('os')
const path = require('path')
const pathExists = require('path-exists')
const semver = require('semver')
const sumchecker = require('sumchecker')

class ElectronDownloader {
  constructor (opts) {
    this.opts = opts
  }

  get baseUrl () {
    return process.env.NPM_CONFIG_ELECTRON_MIRROR ||
      process.env.npm_config_electron_mirror ||
      process.env.ELECTRON_MIRROR ||
      this.opts.mirror ||
      'https://github.com/electron/electron/releases/download/v'
  }

  get middleUrl () {
    return process.env.ELECTRON_CUSTOM_DIR || this.opts.customDir || this.version
  }

  get urlSuffix () {
    return process.env.ELECTRON_CUSTOM_FILENAME || this.opts.customFilename || this.filename
  }

  get arch () {
    return this.opts.arch || os.arch()
  }

  get cache () {
    return this.opts.cache || path.join(homePath(), './.electron')
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
    return `electron-v${this.version}-${this.platform}-${this.arch}${this.symbols ? '-symbols' : ''}.zip`
  }

  get platform () {
    return this.opts.platform || os.platform()
  }

  get proxy () {
    let proxy
    if (npmrc && npmrc.proxy) proxy = npmrc.proxy
    if (npmrc && npmrc['https-proxy']) proxy = npmrc['https-proxy']

    return proxy
  }

  get strictSSL () {
    let strictSSL = true
    if (this.opts.strictSSL === false || npmrc['strict-ssl'] === false) {
      strictSSL = false
    }

    return strictSSL
  }

  get symbols () {
    return this.opts.symbols || false
  }

  get url () {
    return `${this.baseUrl}${this.middleUrl}/${this.urlSuffix}`
  }

  get verifyChecksumNeeded () {
    return semver.gte(this.version, '1.3.2')
  }

  get version () {
    return this.opts.version
  }

  checkForCachedChecksum (cb) {
    pathExists(this.cachedChecksum).then(exists => {
      if (exists) {
        this.verifyChecksum(cb)
      } else if (this.tmpdir) {
        this.downloadChecksum(cb)
      } else {
        this.createTempDir(cb, (callback) => {
          this.downloadChecksum(callback)
        })
      }
    })
  }

  checkForCachedZip (cb) {
    pathExists(this.cachedZip).then(exists => {
      if (exists) {
        debug('zip exists', this.cachedZip)
        this.checkIfZipNeedsVerifying(cb)
      } else {
        this.ensureCacheDir(cb)
      }
    })
  }

  checkIfZipNeedsVerifying (cb) {
    if (this.verifyChecksumNeeded) {
      debug('Verifying zip with checksum')
      return this.checkForCachedChecksum(cb)
    }
    return cb(null, this.cachedZip)
  }

  createCacheDir (cb) {
    fs.mkdirs(this.cache, (err) => {
      if (err) {
        if (err.code !== 'EACCES') return cb(err)
        // try local folder if homedir is off limits (e.g. some linuxes return '/' as homedir)
        let localCache = path.resolve('./.electron')
        return fs.mkdirs(localCache, function (err) {
          if (err) return cb(err)
          cb(null, localCache)
        })
      }
      cb(null, this.cache)
    })
  }

  createTempDir (cb, onSuccess) {
    this.tmpdir = path.join(os.tmpdir(), `electron-tmp-download-${process.pid}-${Date.now()}`)
    fs.mkdirs(this.tmpdir, (err) => {
      if (err) return cb(err)
      onSuccess(cb)
    })
  }

  downloadChecksum (cb) {
    this.downloadFile(this.checksumUrl, this.checksumFilename, this.cachedChecksum, cb, this.verifyChecksum.bind(this))
  }

  downloadFile (url, filename, cacheFilename, cb, onSuccess) {
    debug('downloading', url, 'to', this.tmpdir)
    let nuggetOpts = {
      target: filename,
      dir: this.tmpdir,
      resume: true,
      quiet: false,
      strictSSL: this.strictSSL,
      proxy: this.proxy
    }
    nugget(url, nuggetOpts, (errors) => {
      if (errors) {
        // nugget returns an array of errors but we only need 1st because we only have 1 url
        return this.handleDownloadError(cb, errors[0])
      }

      this.moveFileToCache(filename, cacheFilename, cb, onSuccess)
    })
  }

  downloadIfNotCached (cb) {
    if (!this.version) return cb(new Error('must specify version'))
    debug('info', {cache: this.cache, filename: this.filename, url: this.url})
    this.checkForCachedZip(cb)
  }

  downloadZip (cb) {
    this.downloadFile(this.url, this.filename, this.cachedZip, cb, this.checkIfZipNeedsVerifying.bind(this))
  }

  ensureCacheDir (cb) {
    debug('creating cache/tmp dirs')
    this.createCacheDir((err, actualCache) => {
      if (err) return cb(err)
      this.opts.cache = actualCache // in case cache dir changed
      this.createTempDir(cb, this.downloadZip.bind(this))
    })
  }

  handleDownloadError (cb, error) {
    if (error.message.indexOf('404') === -1) return cb(error)
    if (this.symbols) {
      error.message = `Failed to find Electron symbols v${this.version} for ${this.platform}-${this.arch} at ${this.url}`
    } else {
      error.message = `Failed to find Electron v${this.version} for ${this.platform}-${this.arch} at ${this.url}`
    }

    return cb(error)
  }

  moveFileToCache (filename, target, cb, onSuccess) {
    debug('moving', filename, 'from', this.tmpdir, 'to', target)
    fs.move(path.join(this.tmpdir, filename), target, (err) => {
      if (err) return cb(err)
      onSuccess(cb)
    })
  }

  verifyChecksum (cb) {
    let options = {}
    if (semver.lt(this.version, '1.3.5')) {
      options.defaultTextEncoding = 'binary'
    }
    let checker = new sumchecker.ChecksumValidator('sha256', this.cachedChecksum, options)
    checker.validate(this.cache, this.filename).then(() => {
      cb(null, this.cachedZip)
    }, (err) => {
      fs.unlink(this.cachedZip, (fsErr) => {
        if (fsErr) return cb(fsErr)
        cb(err)
      })
    })
  }
}

module.exports = function download (opts, cb) {
  let downloader = new ElectronDownloader(opts)
  downloader.downloadIfNotCached(cb)
}
