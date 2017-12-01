'use strict'

const debug = require('debug')('jdk-download')
const envPaths = require('env-paths')
const fs = require('fs-extra')
const rc = require('rc')
const nugget = require('nugget')
const os = require('os')
const path = require('path')
const pathExists = require('path-exists')
const sumchecker = require('sumchecker')

class JavaDownloader {
  constructor (opts) {
    this.opts = opts

    this.npmrc = {}
    try {
      rc('npm', this.npmrc)
    } catch (error) {
      console.error(`Error reading npm configuration: ${error.message}`)
    }
  }

  get baseUrl () {
    return process.env.NPM_CONFIG_JDK_MIRROR ||
      process.env.npm_config_jdk_mirror ||
      process.env.JDK_MIRROR ||
      this.opts.mirror ||
      'https://github.com/ojdkbuild/ojdkbuild/releases/download/'
  }

  get middleUrl () {
    return process.env.JDK_CUSTOM_DIR || this.opts.customDir || `${this.version}.${this.build.split('.')[0]}`
  }

  get urlSuffix () {
    return process.env.JDK_CUSTOM_FILENAME || this.opts.customFilename || this.filename
  }

  get arch () {
    const arch = this.opts.arch || os.arch()

    if (this.platform === 'windows') {
      if (arch === 'ia32') return 'x86'
      else if (arch === 'x64') return 'x86_64'
      else throw new Error('detected windows but unknown architecture supported')
    }

    return arch
  }

  get cache () {
    const cacheLocation = this.opts.cache || process.env.JDK_CACHE
    if (cacheLocation) return cacheLocation

    const oldCacheDirectory = path.join(os.homedir(), './.jdk')
    if (pathExists.sync(path.join(oldCacheDirectory, this.filename))) {
      return oldCacheDirectory
    }
    // use passed argument or XDG environment variable fallback to OS default
    return envPaths('jdk', {suffix: ''}).cache
  }

  get cachedChecksum () {
    return path.join(this.cache, `${this.checksumFilename}`)
  }

  get cachedZip () {
    return path.join(this.cache, this.filename)
  }

  get checksumFilename () {
    return `${this.filename}.sha256`
  }

  get checksumUrl () {
    return `${this.baseUrl}${this.middleUrl}/${this.checksumFilename}`
  }

  get filename () {
    const type = `${this.platform}.${this.arch}`
    const suffix = `${this.version}-openjdk-${this.version}.${this.build}.ojdkbuild.${type}`

    if (this.debuginfo) {
      return `java-${suffix}.debuginfo.zip`
    } else {
      return `java-${suffix}.zip`
    }
  }

  get platform () {
    const currentOs = this.opts.platform || os.platform()
    switch (currentOs) {
      case 'win32':
        return 'windows'
      default:
        throw new Error('only windows is supported for now')
    }
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

  get debuginfo () {
    return this.opts.debuginfo || false
  }

  get url () {
    return `${this.baseUrl}${this.middleUrl}/${this.urlSuffix}`
  }

  static get verifyChecksumNeeded () {
    return true
  }

  get build () {
    return this.opts.build
  }

  get version () {
    return this.opts.version
  }

  checkForCachedChecksum (cb) {
    pathExists(this.cachedChecksum)
      .then(exists => {
        if (exists && !this.force) {
          this.verifyChecksum(cb)
        } else {
          this.downloadChecksum(cb)
        }
      })
  }

  checkForCachedZip (cb) {
    pathExists(this.cachedZip).then(exists => {
      if (exists && !this.force) {
        debug('zip exists', this.cachedZip)
        this.checkIfZipNeedsVerifying(cb)
      } else {
        this.ensureCacheDir(cb)
      }
    })
  }

  checkIfZipNeedsVerifying (cb) {
    if (JavaDownloader.verifyChecksumNeeded) {
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
        const localCache = path.resolve('./.jdk')
        return fs.mkdirs(localCache, function (err) {
          if (err) return cb(err)
          cb(null, localCache)
        })
      }
      cb(null, this.cache)
    })
  }

  downloadChecksum (cb) {
    this.downloadFile(this.checksumUrl, this.cachedChecksum, cb, this.verifyChecksum.bind(this))
  }

  downloadFile (url, cacheFilename, cb, onSuccess) {
    const fileName = path.basename(cacheFilename)
    debug('downloading', url, 'to', this.cache)
    const nuggetOpts = {
      target: fileName,
      dir: this.cache,
      resume: true,
      quiet: this.quiet,
      strictSSL: this.strictSSL,
      proxy: this.proxy
    }
    nugget(url, nuggetOpts, (errors) => {
      if (errors) {
        // nugget returns an array of errors but we only need 1st because we only have 1 url
        return this.handleDownloadError(cb, errors[0])
      }

      this.moveFileToCache(fileName, cacheFilename, cb, onSuccess)
    })
  }

  downloadIfNotCached (cb) {
    if (!this.version) return cb(new Error('must specify version'))
    debug('info', {cache: this.cache, filename: this.filename, url: this.url})
    this.checkForCachedZip(cb)
  }

  downloadZip (cb) {
    this.downloadFile(this.url, this.cachedZip, cb, this.checkIfZipNeedsVerifying.bind(this))
  }

  ensureCacheDir (cb) {
    debug('creating cache dir')
    this.createCacheDir((err, actualCache) => {
      if (err) return cb(err)
      this.opts.cache = actualCache // in case cache dir changed
      this.downloadZip(cb)
    })
  }

  handleDownloadError (cb, error) {
    if (error.message.indexOf('404') === -1) return cb(error)
    error.message = `Failed to find JDK ${this.version} for ${this.platform}-${this.arch} at ${this.url}`
    return cb(error)
  }

  moveFileToCache (filename, target, cb, onSuccess) {
    const cache = this.cache
    debug('moving', filename, 'from', cache, 'to', target)
    fs.rename(path.join(cache, filename), target, (err) => {
      if (err) {
        fs.unlink(cache, cleanupError => {
          try {
            if (cleanupError) {
              console.error(`Error deleting cache file: ${cleanupError.message}`)
            }
          } finally {
            cb(err)
          }
        })
      } else {
        onSuccess(cb)
      }
    })
  }

  verifyChecksum (cb) {
    const options = {
      defaultTextEncoding: 'binary'
    }
    const checker = new sumchecker.ChecksumValidator('sha256', this.cachedChecksum, options)
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
  const downloader = new JavaDownloader(opts)
  downloader.downloadIfNotCached(cb)
}
