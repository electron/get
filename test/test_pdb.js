"use strict";

const download = require("../lib/index");
const test = require("tape");
const verifyDownloadedZip = require("./helpers").verifyDownloadedZip;

test("PDB test", t => {
  download(
    {
      version: "1.4.15",
      arch: "x64",
      platform: "win32",
      pdb: true,
      quiet: true
    },
    (err, zipPath) => {
      verifyDownloadedZip(t, err, zipPath);
      t.ok(/-pdb\.zip$/.test(zipPath), "Zip path should end with -pdb.zip");
      t.end();
    }
  );
});
