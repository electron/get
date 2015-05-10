var fs = require('fs')
var os = require('os')
var path = require('path')
var pathExists = require('path-exists')
var mkdir = require('mkdirp')
var nugget = require('nugget')
var homePath = require('home-path')

module.exports = function download (opts, cb) {
  var platform = opts.platform || os.platform()
  var arch = opts.arch || os.arch()
  var version = opts.version
  if (!version) return cb(new Error('must specify version'))
  var filename = 'electron-v' + version + '-' + platform + '-' + arch + '.zip'
  var url = 'https://github.com/atom/electron/releases/download/v' + version + '/electron-v' + version + '-' + platform + '-' + arch + '.zip'
  var homeDir = homePath()
  var cache = path.join(homeDir, './.electron')
  
  var cachedZip = path.join(cache, filename)
  if (pathExists.sync(cachedZip)) {
    return cb(null, cachedZip)
  } else {
    mkdir(cache, function (err) {
      if (err) return cb(err)
      nugget(url, {target: filename, dir: cache, resume: true, verbose: true}, function (err) {
        if (err) return cb(err)
        cb(null, cachedZip)
      })
    })
  }
}
