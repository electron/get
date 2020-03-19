'use strict';

const assert = require('assertthat');

const boolean = require('../../src/boolean');

suite('boolean', () => {
  test('is a function.', done => {
    assert.that(boolean).is.ofType('function');
    done();
  });

  suite('undefined', () => {
    test('returns false.', done => {
      assert.that(boolean(undefined)).is.false();
      done();
    });
  });

  suite('object', () => {
    test('null returns false.', done => {
      assert.that(boolean(null)).is.false();
      done();
    });

    test('{} returns false.', done => {
      assert.that(boolean({})).is.false();
      done();
    });
  });

  suite('boolean', () => {
    test('true returns true.', done => {
      assert.that(boolean(true)).is.true();
      done();
    });

    test('false returns false.', done => {
      assert.that(boolean(false)).is.false();
      done();
    });
  });

  suite('string', () => {
    test('"true" returns true.', done => {
      assert.that(boolean('true')).is.true();
      done();
    });

    test('"false" returns false.', done => {
      assert.that(boolean('false')).is.false();
      done();
    });

    test('"TRUE" returns true.', done => {
      assert.that(boolean('TRUE')).is.true();
      done();
    });

    test('"FALSE" returns false.', done => {
      assert.that(boolean('FALSE')).is.false();
      done();
    });

    test('"t" returns true.', done => {
      assert.that(boolean('t')).is.true();
      done();
    });

    test('"f" returns false.', done => {
      assert.that(boolean('f')).is.false();
      done();
    });

    test('"T" returns true.', done => {
      assert.that(boolean('T')).is.true();
      done();
    });

    test('"F" returns false.', done => {
      assert.that(boolean('F')).is.false();
      done();
    });

    test('"yes" returns true.', done => {
      assert.that(boolean('yes')).is.true();
      done();
    });

    test('"no" returns false.', done => {
      assert.that(boolean('no')).is.false();
      done();
    });

    test('"YES" returns true.', done => {
      assert.that(boolean('YES')).is.true();
      done();
    });

    test('"NO" returns false.', done => {
      assert.that(boolean('NO')).is.false();
      done();
    });

    test('"y" returns true.', done => {
      assert.that(boolean('y')).is.true();
      done();
    });

    test('"n" returns false.', done => {
      assert.that(boolean('n')).is.false();
      done();
    });

    test('"Y" returns true.', done => {
      assert.that(boolean('Y')).is.true();
      done();
    });

    test('"N" returns false.', done => {
      assert.that(boolean('N')).is.false();
      done();
    });

    test('"on" returns true.', done => {
      assert.that(boolean('on')).is.true();
      done();
    });

    test('"ON" returns true.', done => {
      assert.that(boolean('ON')).is.true();
      done();
    });

    test('"1" returns true.', done => {
      assert.that(boolean('1')).is.true();
      done();
    });

    test('"0" returns false.', done => {
      assert.that(boolean('0')).is.false();
      done();
    });

    test('"contains-the-letter-t" returns false.', done => {
      assert.that(boolean('contains-the-letter-t')).is.false();
      done();
    });

    test('"contains-the-word-yes" returns false.', done => {
      assert.that(boolean('noyesno')).is.false();
      done();
    });

    test('arbitrary string returns false.', done => {
      assert.that(boolean('123')).is.false();
      done();
    });

    test('trims whitespace.', done => {
      assert.that(boolean(' true  ')).is.true();
      done();
    });
  });

  suite('number', () => {
    test('1 returns true.', done => {
      assert.that(boolean(1)).is.true();
      done();
    });

    test('0 returns false.', done => {
      assert.that(boolean(0)).is.false();
      done();
    });

    test('123 returns false.', done => {
      assert.that(boolean(123)).is.false();
      done();
    });
  });
});
