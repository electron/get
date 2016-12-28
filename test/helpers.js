'use strict'

const fs = require('fs')

exports.verifyDownloadedZip = (t, err, zipPath) => {
  t.error(err, 'Error should be null')

  if (err == null) {
    t.equal(fs.statSync(zipPath).isFile(), true, 'Zip path should exist')
    t.notEqual(fs.statSync(zipPath).size, 0, 'Zip path should be non-empty')
  }
}
