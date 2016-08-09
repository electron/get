'use strict'

const debug = require('debug')('electron-download')
const homePath = require('home-path')
const mkdir = require('mkdirp')
const mv = require('mv')
const npmrc = require('rc')('npm')
const nugget = require('nugget')
const os = require('os')
const path = require('path')
const pathExists = require('path-exists')

class ElectronDownloader {
  constructor (opts) {
    this.opts = opts
  }

  get baseUrl () {
    return process.env.NPM_CONFIG_ELECTRON_MIRROR ||
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

  get cachedZip () {
    return path.join(this.cache, this.filename)
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

  get version () {
    return this.opts.version
  }

  checkForCachedZip (cb) {
    pathExists(this.cachedZip, (err, exists) => {
      if (err) return cb(err)
      if (exists) {
        debug('zip exists', this.cachedZip)
        return cb(null, this.cachedZip)
      }

      this.ensureCacheDir(cb)
    })
  }

  createCacheDir (cb) {
    mkdir(this.cache, (err) => {
      if (err) {
        if (err.code !== 'EACCES') return cb(err)
        // try local folder if homedir is off limits (e.g. some linuxes return '/' as homedir)
        let localCache = path.resolve('./.electron')
        return mkdir(localCache, function (err) {
          if (err) return cb(err)
          cb(null, localCache)
        })
      }
      cb(null, this.cache)
    })
  }

  createTempDir (cb) {
    this.tmpdir = path.join(os.tmpdir(), `electron-tmp-download-${process.pid}-${Date.now()}`)
    mkdir(this.tmpdir, (err) => {
      if (err) return cb(err)
      this.downloadZip(cb)
    })
  }

  downloadIfNotCached (cb) {
    if (!this.version) return cb(new Error('must specify version'))
    debug('info', {cache: this.cache, filename: this.filename, url: this.url})
    this.checkForCachedZip(cb)
  }

  downloadZip (cb) {
    debug('downloading zip', this.url, 'to', this.tmpdir)
    let nuggetOpts = {
      target: this.filename,
      dir: this.tmpdir,
      resume: true,
      verbose: true,
      strictSSL: this.strictSSL,
      proxy: this.proxy
    }
    nugget(this.url, nuggetOpts, (errors) => {
      if (errors) {
        // nugget returns an array of errors but we only need 1st because we only have 1 url
        return this.handleDownloadError(cb, errors[0])
      }

      this.moveZipToCache(cb)
    })
  }

  ensureCacheDir (cb) {
    debug('creating cache/tmp dirs')
    this.createCacheDir((err, actualCache) => {
      if (err) return cb(err)
      this.opts.cache = actualCache // in case cache dir changed
      this.createTempDir(cb)
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

  moveZipToCache (cb) {
    debug('moving zip to', this.cachedZip)
    mv(path.join(this.tmpdir, this.filename), this.cachedZip, (err) => {
      if (err) return cb(err)
      cb(null, this.cachedZip)
    })
  }
}

module.exports = function download (opts, cb) {
  let downloader = new ElectronDownloader(opts)
  downloader.downloadIfNotCached(cb)
}
