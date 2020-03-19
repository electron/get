# p-filter [![Build Status](https://travis-ci.org/sindresorhus/p-filter.svg?branch=master)](https://travis-ci.org/sindresorhus/p-filter)

> Filter promises concurrently

Useful when you need to run promise-returning & async functions multiple times with different inputs concurrently and get a filtered down result.


## Install

```
$ npm install --save p-filter
```


## Usage

```js
const pFilter = require('p-filter');
const getWeather = require('get-weather'); // not a real module

const places = [
	getCapital('Norway').then(info => info.name),
	'Bangkok, Thailand',
	'Berlin, Germany',
	'Tokyo, Japan'
];

const filterer = el => getWeather(el).then(place => place.temperature > 30);

pFilter(places, filterer).then(result => {
	console.log(result);
	//=> [{name: 'Bangkok, Thailand', temperature: 36}]
});
```


## API

### pFilter(input, filterer, [options])

Returns a `Promise` that is fulfilled when all promises in `input` and ones returned from `filterer` are fulfilled, or rejects if any of the promises reject. The fulfilled value is an `Array` of the fulfilled values returned from `filterer` in `input` order.

#### input

Type: `Iterable<Promise|any>`

Iterated over concurrently in the `filterer` function.

#### filterer(element, index)

Type: `Function`

Expected to return a `boolean` or a `Promise` for a `boolean`.

#### options

Type: `Object`

##### concurrency

Type: `number`<br>
Default: `Infinity`

Number of concurrently pending promises returned by `filterer`. Minimum `1`.


## Related

- [p-map](https://github.com/sindresorhus/p-map) - Map over promises concurrently
- [More…](https://github.com/sindresorhus/promise-fun)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
