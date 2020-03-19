'use strict';

var properties = require('../lib/properties.js'),
    PropertiesFile = properties.PropertiesFile;
var props;

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['properties'] = {
  setUp: function(done) {
    props = properties.of('test/fixtures/example.properties');
    done();
  },
  'basic read from a file': function(test) {
    test.expect(2);
    test.equal('2.5', props.get('ricola.version.major'));
    test.equal('7', props.get('ricola.version.minor'));
    test.done();
  },
  'nested values': function(test) {
    test.expect(1);
    test.equal('2.5', props.get('ricola.version.symlink'));
    test.done();
  },
  'complicated nest': function(test) {
    test.expect(2);
    test.equal('ricola-2.5', props.get('ricola.version.prefixed'));
    test.equal('ricola-2.5-tothemax', props.get('ricola.version.postfixed'));
    test.done();
  },
  'recursive nest': function(test) {
    test.expect(1);
    test.equal('ricola-2.5-recursive', props.get('ricola.recursive'));
    test.done();
  },
  'double nest': function(test) {
    test.expect(1);
    test.equal('2.5.7', props.get('ricola.version'));
    test.done();
  },
  'with spaces' : function(test) {
    test.expect(1);
    test.equal('hello', props.get('ricola.withSpaces'));
    test.done();
  },
  'second file': function(test) {
    test.expect(3);
    props = properties.of('test/fixtures/example.properties', 'test/fixtures/example2.properties');
    test.equal('14.47', props.get('extra.property'));
    test.equal('444', props.get('another.property'));
    test.equal('7', props.get('referenced.property'));
    test.done();
  },
  'not found property': function(test) {
    test.expect(1);
    test.equal(undefined, props.get('undefinedValue'));
    test.done();
  },
  'additional property': function(test) {
    test.expect(2);
    test.equal(undefined, props.get('undefinedValue'));
    props.set('undefinedValue', '14.8');
    test.equal('14.8', props.get('undefinedValue'));
    test.done();
  },
  'with backslashes': function(test) {
    var key = "^(0?[1-9]|1[012])\\/?(0?[1-9]|[12][0-9]|3[01])$";
    test.expect(1);
    test.equal(key, props.get('regex.format.date'));
    test.done();
  },
  'interpolating' : function(test) {
    test.expect(1);
    test.equal('version 7 is the best!', props.interpolate('version ${ricola.version.minor} is the best!'));
    test.done();
  },
  'unix line endings' : function(test) {
    test.expect(2);
    props = properties.of('test/fixtures/unix.properties');
    test.equal('value 1', props.get('value.1'));
    test.equal('Another Value', props.get('value.2'));
    test.done();
  },
  'includes multiple equals' : function(test) {
    test.expect(1);
    test.equal('some=value',props.get('property.with.equals'));
    test.done();
  },
  'empty string' : function (test) {
    test.expect(1);
    test.equal('', props.get('property.emptyString'));
    test.done();
  },
  'get keys' : function(test) {
      test.expect(1);
      // check that properties are well loaded
      test.deepEqual(props.getKeys(), [ 'ricola.version',
         'ricola.version.major',
         'ricola.version.minor',
         'ricola.version.symlink',
         'ricola.withSpaces',
         'ricola.version.prefixed',
         'ricola.version.postfixed',
         'ricola.recursive',
         'regex.format.date',
         'property.with.equals',
         'property.emptyString',
         'withNewline',
         'withIndentation',
         'targetCities'
      ]);
      test.done();
  },
  'reset' : function(test) {
      test.expect(1);
      props.reset();
      test.equals(0, props.getKeys());
      test.done();
  },
  'addFile' : function(test) {
      test.expect(6);
      // Reset and add manually the 2 first files
      props.reset();
      props.addFile('test/fixtures/example.properties');
      props.addFile('test/fixtures/example2.properties');
      test.equal('14.47', props.get('extra.property'));
      test.equal('444', props.get('another.property'));
      test.equal('7', props.get('referenced.property'));

      // 'value.1' must not be defined cause it is unix.properties file
      test.equal(undefined, props.get('value.1'));
      // add the unix.properties file
      props.addFile('test/fixtures/unix.properties');
      // check that value.1 is now defined
      test.equal('value 1', props.get('value.1'));
      // and that old values are still there
      test.equal('444', props.get('another.property'));

      test.done();
  },
  'array file': function(test) {
      test.expect(5);
      props = properties.of('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');
      var arrayKey = props.get('arrayKey');
      test.equal(true, Array.isArray(arrayKey));
      test.equal(3, arrayKey.length);
      test.equal('first : ricola-2.5', arrayKey[0]);
      test.equal('second', arrayKey[1]);
      test.equal('third', arrayKey[2]);
      test.done();
    },
  'array file undefined': function(test) {
        test.expect(1);
        props = properties.of('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');
        test.equal(undefined, props.get('arrayKeyUndefined'));
        test.done();
  },
  'Using PropertiesFile with files provided': function(test) {
      test.expect(2);
      props.reset();
      var myFile = new PropertiesFile('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');
      test.equal(3, myFile.get('arrayKey').length);
      myFile.reset();
      test.equal(undefined, myFile.get('arrayKey'));
      test.done();
  },
  'Using PropertiesFile with 2 different contexts': function(test) {
      test.expect(4);
      props.reset();
      var myFile = new PropertiesFile();
      myFile.of('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');

      var myOtherFile = new PropertiesFile();
      myOtherFile.addFile('test/fixtures/example.properties');
      myOtherFile.addFile('test/fixtures/example2.properties');

      test.equal(3, myFile.get('arrayKey').length);
      test.equal(undefined, myFile.get('referenced.property'));
      test.equal('some=value', myOtherFile.get('property.with.equals'));
      test.equal('7', myOtherFile.get('referenced.property'));
      test.done();
    },
  'Using defaut value for get': function(test) {
      test.expect(4);
      var myFile = new PropertiesFile('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');
      test.equal(undefined, myFile.get('referenced.property'));
      test.equal('defaultValue', myFile.get('referenced.property', 'defaultValue'));
      test.equal('hello', myFile.get('ricola.withSpaces'));
      test.equal('hello', myFile.get('ricola.withSpaces', 'defaultValue'));
      test.done();
  },
  'Using int value with getInt': function(test) {
      test.expect(5);
      var myFile = new PropertiesFile('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');
      test.equal('7', myFile.get('ricola.version.minor'));
      test.equal(7, myFile.getInt('ricola.version.minor'));
      test.equal(undefined, myFile.getInt('dont.exists'));
      test.equal(12, myFile.getInt('dont.exists', 12));
      test.equal(true,  isNaN(myFile.getInt('ricola.withSpaces')));
      test.done();
  },
  'Using float value with getFloat': function(test) {
      test.expect(5);
      var myFile = new PropertiesFile('test/fixtures/example.properties', 'test/fixtures/arrayExample.properties');
      test.equal('2.5', myFile.get('ricola.version.major'));
      test.equal(2.5, myFile.getFloat('ricola.version.major'));
      test.equal(undefined, myFile.getFloat('dont.exists'));
      test.equal(12.23, myFile.getFloat('dont.exists', 12.23));
      test.equal(true,  isNaN(myFile.getFloat('ricola.withSpaces')));
      test.done();
  },
  'Using boolean value with getBoolean' : function(test) {
      test.expect(11);
      var myFile = new PropertiesFile('test/fixtures/boolean.properties');
      test.equal(true, myFile.getBoolean('boolean.true1'));
      test.equal(true, myFile.getBoolean('boolean.true2'));
      test.equal(true, myFile.getBoolean('boolean.true3'));
      test.equal(true, myFile.getBoolean('boolean.true4'));
      test.equal(false, myFile.getBoolean('boolean.false1'));
      test.equal(false, myFile.getBoolean('boolean.false2'));
      test.equal(false, myFile.getBoolean('boolean.false3'));
      test.equal(false, myFile.getBoolean('boolean.false4'));

      test.equal(false, myFile.getBoolean('boolean.empty', false));
      test.equal(true, myFile.getBoolean('boolean.empty', true));
      test.equal(false, myFile.getBoolean('boolean.empty'));
      test.done();
  },
  'getMatchingKeys': function(test) {
    test.expect(2);
      var myFile = new PropertiesFile('test/fixtures/example.properties');
      var props = myFile.getMatchingKeys('property');
      test.equal(2, props.length);
      test.deepEqual(['property.with.equals', 'property.emptyString'], props);
      test.done();
  },

  'with newline': function(test) {
    test.expect(1);
    test.equal('Welcome to The Monkey House!', props.get('withNewline'));
    test.done();
  },

  'with indentations': function(test) {
    test.expect(1);
    test.equal('Welcome to The Rock.', props.get('withIndentation'));
    test.done();
  },

  'multiple backslashes': function(test) {
    test.expect(1);
    test.equal('Detroit,Chicago,Los Angeles', props.get('targetCities'));
    test.done();
  },
  'Multivalued property in interpolation' : function(test) {
      test.expect(6);
      var myFile = new PropertiesFile('test/fixtures/multivalued.properties');
      test.equal(myFile.get('multi.value').length, 2);
      test.equal(myFile.get('multi.value')[0], 'value1');
      test.equal(myFile.get('multi.value')[1], 'value2');
      test.equal(myFile.getLast('multi.value'), 'value2');
      test.equal(myFile.getFirst('multi.value'), 'value1');
      test.equal('The value is value2', myFile.get('multi.interpolated.value'));
      test.done();
  },
  'Multivalued boolean property' : function(test) {
      test.expect(1);
      var myFile = new PropertiesFile('test/fixtures/multivalued.properties');
      test.equal(myFile.getBoolean('multi.bool.value'), true);
      test.done();
  },
  'Multivalued int property' : function(test) {
      test.expect(1);
      var myFile = new PropertiesFile('test/fixtures/multivalued.properties');
      test.equal(myFile.getInt('multi.int.value'), 1);
      test.done();
  },
  'utf8 strings' : function(test) {
      test.expect(2);
      var myFile = new PropertiesFile('test/fixtures/utf8.properties');
      var str = myFile.get('utf8.string');
      test.equal(str, '\u2601 a string with accent : crédits seront très bientôt épuisés');
      test.equal(str.charAt(0),String.fromCharCode(0x2601));
      test.done();
  },
  'double quoted strings' : function(test) {
      test.expect(1);
      var myFile = new PropertiesFile('test/fixtures/doublequoted.properties');
      var str = myFile.get('double.quoted.string');
      test.equal(str, 'The first " and the second " should be replaced. Can we replace " in interpolation ?');
      test.done();
  },
  'teamcity unescaped `:` & `=`' : function(test) {
    test.expect(2);
    var myFile = new PropertiesFile('test/fixtures/teamcity.properties');
    test.equal(myFile.get('teamcity.agent.dotnet.agent_url'), 'http://localhost:9090/RPC2');
    test.equal(myFile.get('teamcity.auth.userId'), 'TeamCityBuildId=673');
    test.done();
  }
};
