# @nlib/test

[![Build Status](https://travis-ci.org/nlibjs/test.svg?branch=master)](https://travis-ci.org/nlibjs/test)
[![Build status](https://ci.appveyor.com/api/projects/status/a6e5cq05uvqn6fjk/branch/master?svg=true)](https://ci.appveyor.com/project/kei-ito/test/branch/master)
[![codecov](https://codecov.io/gh/nlibjs/test/branch/master/graph/badge.svg)](https://codecov.io/gh/nlibjs/test)
[![dependencies Status](https://david-dm.org/nlibjs/test/status.svg)](https://david-dm.org/nlibjs/test)
[![devDependencies Status](https://david-dm.org/nlibjs/test/dev-status.svg)](https://david-dm.org/nlibjs/test?type=dev)

A test runner.

## Install

```
npm install --save-dev @nlib/test
```

## Usage

### Synchronous tests

source: [sample/00-sync.js](https://github.com/nlibjs/test/blob/master/test/sample/00-sync.js)

```javascript
const assert = require('assert');
const test = require('@nlib/test');

function add(a, b) {
  return a + b;
}

test('add', (test) => {
  test('2 numbers', (test) => {
    test('add(0, 1) = 1', () => {
      assert.equal(add(0, 1), 1);
    });
    test('add(1, 0) = 1', () => {
      assert.equal(add(1, 0), 1);
    });
  });
  test('3 numbers', (test) => {
    test('add(0, 1, 2) = 3', () => {
      assert.equal(add(0, 1, 2), 3);
    });
    test('add(2, 1, 0) = 3', () => {
      assert.equal(add(2, 1, 0), 3);
    });
  });
});
```

![output: sample/00-sync.js](https://github.com/nlibjs/test/raw/master/images/00-sync.png)

### Asynchronous tests

source: [sample/01-async.js](https://github.com/nlibjs/test/blob/master/test/sample/01-async.js)

```javascript
const assert = require('assert');
const test = require('@nlib/test');

function wait(duration, data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, duration);
  });
}

test('wait', (test) => {
  test('50ms', () => {
    const start = new Date();
    return wait(50)
    .then(() => {
      const end = new Date();
      assert(45 < end - start);
    });
  });
  test('3000ms', () => {
    const start = new Date();
    return wait(3000)
    .then(() => {
      const end = new Date();
      assert(2700 < end - start);
    });
  });
  test('3000ms', () => {
    const start = new Date();
    return wait(3000)
    .then(() => {
      const end = new Date();
      assert(2700 < end - start);
    });
  }, {timeout: 4000});
});
```

![output: sample/01-async.js](https://github.com/nlibjs/test/raw/master/images/01-async.png)

## JavaScript API

**test**(*title*: String, *fn*(*child_test*: Function) → undefined, *options*: ?Object);

- *title*: A title.
- *fn*(*child_test*: Function):
A test function which throws an error or a rejected promise when it detects something unexpected.
The return value can be a promise.
*child_test* is a function which has the same interface as **test**.
Tests run by *child_test* are reported as sub tests of a parent test made by **test**().
- *options*: configures its behavior.
  - *timeout*: Number. Sets timeout in milliseconds.

## LICENSE

MIT
