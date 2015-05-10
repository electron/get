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
  pathExists(cachedZip, function (err, exists) {
    if (err) return cb(err)
    if (exists) return cb(null, cachedZip)
    // otherwise download it
    mkdir(cache, function (err) {
      if (err) return cb(err)
      // download to tmpdir
      var tmpdir = path.join(os.tmpdir(), 'electron-tmp-download')
      mkdir(tmpdir, function (err) {
        if (err) return cb(err)
        nugget(url, {target: filename, dir: tmpdir, resume: true, verbose: true}, function (err) {
          if (err) return cb(err)
          // when dl is done then put in cache
          fs.rename(path.join(tmpdir, filename), cachedZip, function (err) {
            if (err) return cb(err)
            cb(null, cachedZip)
          })
        })
      })
    })
  })
}
