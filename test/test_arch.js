'use strict'

const arch = require('../lib/arch')
const sinon = require('sinon')
const test = require('tape')

test('hostArch detects incorrectly configured armv7l Node', t => {
  sinon.stub(arch, 'uname').returns('armv6l')
  sinon.stub(process, 'arch').value('arm')
  sinon.stub(process, 'config').value({variables: {arm_version: '6'}})

  t.is(arch.host(), 'armv6l')

  sinon.restore()
  t.end()
})

test('hostArch detects correctly configured armv7l Node', t => {
  sinon.stub(process, 'arch').value('arm')
  sinon.stub(process, 'config').value({variables: {arm_version: '7'}})

  t.is(arch.host(), 'armv7l')

  sinon.restore()
  t.end()
})

test('hostArch cannot determine ARM version', t => {
  sinon.stub(process, 'arch').value('arm')
  sinon.stub(process, 'config').value({variables: {arm_version: '99'}})

  t.is(arch.host(), 'arm')

  sinon.restore()
  t.end()
})
