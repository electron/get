# boolean

boolean converts lots of things to boolean.

## Installation

```shell
$ npm install boolean
```

## Quick start

First you need to add a reference to boolean in your application.

```javascript
const boolean = require('boolean');
```

To verify a value for its boolean value, call the `boolean` function and provide the value in question as parameter.

```javascript
console.log(boolean('true')); // => true
```

The `boolean` function considers the following values to be equivalent to `true`:

-   `true` (boolean)
-   `'true'` (string)
-   `'TRUE'` (string)
-   `'t'` (string)
-   `'T'` (string)
-   `'yes'` (string)
-   `'YES'` (string)
-   `'y'` (string)
-   `'Y'` (string)
-   `'on'` (string)
-   `'ON'` (string)
-   `'1'` (string)
-   `1` (number)

_Please note that if you provide a string, it will be trimmed._

All other values, including `undefined` and `null` are considered to be `false`.

## Running the build

To build this module use [roboter](https://www.npmjs.com/package/roboter).

```shell
$ npx roboter
```

## License

The MIT License (MIT)
Copyright (c) 2014-2019 the native web.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
