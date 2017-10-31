# @nlib/test

[![Build Status](https://travis-ci.org/nlibjs/test.svg?branch=master)](https://travis-ci.org/nlibjs/test)
[![Build status](https://ci.appveyor.com/api/projects/status/a6e5cq05uvqn6fjk/branch/master?svg=true)](https://ci.appveyor.com/project/kei-ito/test/branch/master)
[![Coverage Status](https://coveralls.io/repos/github/nlibjs/test/badge.svg?branch=master)](https://coveralls.io/github/nlibjs/test?branch=master)

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

test('add', function (test) {
  test('2 numbers', function (test) {
    test('add(0, 1) = 1', function () {
      assert.equal(add(0, 1), 1);
    });
    test('add(1, 0) = 1', function () {
      assert.equal(add(1, 0), 1);
    });
  });
  test('3 numbers', function (test) {
    test('add(0, 1, 2) = 3', function () {
      assert.equal(add(0, 1, 2), 3);
    });
    test('add(2, 1, 0) = 3', function () {
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

test('wait', function (test) {
  test('50ms', function () {
    const start = new Date();
    return wait(50)
    .then(() => {
      const end = new Date();
      assert(45 < end - start);
    });
  });
  test('3000ms', function () {
    const start = new Date();
    return wait(3000)
    .then(() => {
      const end = new Date();
      assert(2700 < end - start);
    });
  });
  test('3000ms', function () {
    const start = new Date();
    this.timeout = 4000;
    return wait(3000)
    .then(() => {
      const end = new Date();
      assert(2700 < end - start);
    });
  });
});
```

![output: sample/01-async.js](https://github.com/nlibjs/test/raw/master/images/01-async.png)

## JavaScript API

**test**(*title*: String, *fn*(*child_test*: Function) → ?Promise, *options*: ?Object);

- *title*: A title.
- *fn*(*child_test*: Function):
A test function which throws an error or a rejected promise when it detects something unexpected.
The return value can be a promise.
*child_test* is a function which has the same interface as **test**.
Tests run by *child_test* are reported as sub tests of a parent test made by **test**().
- *options*: configures its behavior.
  - *exitProcessOnEnd*: Boolean.
  When it is true, [process.exit](https://nodejs.org/api/process.html#process_process_exit_code) is called after the test.
  The default value is *true* for root tests and *false* for child tests.
  - *rejectable*: Boolean.
  When it is false, `test()` returns a promise will be resolved even if it caught an error.
  This means tests aren't stopped by error.
  When it is true, `test()` (or `child_test()`) skips the folloing tests which has same parent.
  - *timeout*: Number. Sets timeout in milliseconds.

## LICENSE

MIT
