/* eslint-disable no-empty-function, prefer-arrow-callback, consistent-this, no-invalid-this */
const packageJSON = require('../../package.json');
const console = require('console');
const assert = require('assert');
const chalk = require('chalk');
const test = require('..');

function expectedError(message = '') {
	const error = new Error(`Expected error ${message}`);
	error.code = 'EEXPECTED';
	return error;
}

Promise.resolve()
.then(() => {
	console.group(packageJSON.name);
})
.then(() => {
	const name = 'returns a promise';
	const actual = test(name, () => {}, {exitProcessOnEnd: false});
	assert(actual instanceof Promise, `Failed: ${name}`);
})
.then(() => {
	const name = 'calls the given function with the next test:Function';
	let actual;
	return test(
		name,
		function (arg) {
			actual = arg;
		},
		{exitProcessOnEnd: false}
	)
	.then(() => {
		const expected = 'function';
		assert.equal(typeof actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'calls the given function in its context (noRun pattern)';
	let actual;
	const testInstance = test(
		name,
		function () {
			actual = this;
		},
		{exitProcessOnEnd: false, noRun: true}
	);
	return testInstance.run()
	.then(() => {
		const expected = testInstance;
		assert.equal(actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'calls the given function in its context (promise.test pattern)';
	let actual;
	const promise = test(
		name,
		function () {
			actual = this;
		},
		{exitProcessOnEnd: false}
	);
	return promise
	.then(() => {
		const expected = promise.test;
		assert.equal(actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'calls the given async function with the next test:Function';
	let actual;
	return test(
		name,
		function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					actual = true;
					resolve();
				}, 100);
			});
		},
		{exitProcessOnEnd: false}
	)
	.then(() => {
		assert(actual, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'runs sync child tests';
	const actual = [];
	return test(
		name,
		function (test) {
			actual.push(this.name);
			test('sync.1', function (test) {
				actual.push(this.name);
				test('sync.1.1', function () {
					actual.push(this.name);
				});
				test('sync.1.2', function () {
					actual.push(this.name);
				});
			});
			test('sync.2', function (test) {
				actual.push(this.name);
				test('sync.2.1', function () {
					actual.push(this.name);
				});
				test('sync.2.2', function () {
					actual.push(this.name);
				});
			});
		},
		{exitProcessOnEnd: false}
	)
	.then(() => {
		const expected = [
			name,
			'sync.1',
			'sync.1.1',
			'sync.1.2',
			'sync.2',
			'sync.2.1',
			'sync.2.2',
		];
		assert.deepEqual(actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'runs async child tests';
	const actual = [];
	return test(
		name,
		function (test) {
			actual.push(this.name);
			return Promise.resolve()
			.then(() => {
				return test('async.1', function (test) {
					actual.push(this.name);
					return Promise.resolve()
					.then(() => {
						return test('async.1.1', function () {
							actual.push(this.name);
						});
					})
					.then(() => {
						return test('async.1.2', function () {
							actual.push(this.name);
						});
					});
				});
			})
			.then(() => {
				return test('async.2', function (test) {
					actual.push(this.name);
					return Promise.resolve()
					.then(() => {
						return test('async.2.1', function () {
							actual.push(this.name);
						});
					})
					.then(() => {
						return test('async.2.2', function () {
							actual.push(this.name);
						});
					});
				});
			});
		},
		{exitProcessOnEnd: false}
	)
	.then(() => {
		const expected = [
			name,
			'async.1',
			'async.1.1',
			'async.1.2',
			'async.2',
			'async.2.1',
			'async.2.2',
		];
		assert.deepEqual(actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'runs tests sequentially';
	const actual = [];
	return test(
		name,
		function (test) {
			actual.push(this.name);
			test('mixed.1', function (test) {
				actual.push(this.name);
				test('mixed.1.1', function () {
					return new Promise((resolve) => {
						setTimeout(() => {
							actual.push(this.name);
							resolve();
						}, 50);
					});
				});
				test('mixed.1.2', function () {
					actual.push(this.name);
				});
			});
			test('mixed.2', function () {
				actual.push(this.name);
			});
		},
		{exitProcessOnEnd: false}
	)
	.then(() => {
		const expected = [
			name,
			'mixed.1',
			'mixed.1.1',
			'mixed.1.2',
			'mixed.2',
		];
		assert.deepEqual(actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'catches an error internally';
	let actual;
	return test(
		name,
		function () {
			actual = this.name;
			throw expectedError(this.name);
		},
		{exitProcessOnEnd: false}
	)
	.then(
		() => {
			const expected = name;
			assert.equal(actual, expected, `Failed: ${name}`);
		},
		() => {
			throw new Error(`Failed: ${name}`);
		}
	);
})
.then(() => {
	const name = 'throws an error';
	return test(
		name,
		function () {
			throw expectedError(this.name);
		},
		{exitProcessOnEnd: false, rejectable: true}
	)
	.then(
		() => {
			throw new Error(`Failed: ${name}`);
		},
		(actual) => {
			const expected = 'EEXPECTED';
			assert.equal(actual.code, expected, `Failed: ${name}`);
		}
	);
})
.then(() => {
	const name = 'skips following tests';
	const actual = [];
	return test(
		name,
		function (test) {
			actual.push(this.name);
			test('chained.1', function (test) {
				actual.push(this.name);
				test('chained.1.1', function () {
					actual.push(this.name);
				});
				test('chained.1.2', function () {
					actual.push(this.name);
					throw expectedError(this.name);
				});
				test('chained.1.3', function () {
					actual.push(this.name);
					throw expectedError(this.name);
				}, {rejectable: true});
				test('chained.1.4', function () {
					actual.push(this.name);
					throw expectedError(this.name);
				});
			});
			test('chained.2', function (test) {
				actual.push(this.name);
				test('chained.2.1', function () {
					actual.push(this.name);
				});
				test('chained.2.2', function () {
					actual.push(this.name);
					throw expectedError(this.name);
				});
				test('chained.2.3', function () {
					actual.push(this.name);
				});
			}, {rejectable: true});
			test('chained.3', function () {
				actual.push(this.name);
			});
		},
		{exitProcessOnEnd: false}
	)
	.then(() => {
		const expected = [
			name,
			'chained.1',
			'chained.1.1',
			'chained.1.2',
			'chained.1.3',
			'chained.2',
			'chained.2.1',
			'chained.2.2',
			'chained.2.3',
		];
		assert.deepEqual(actual, expected, `Failed: ${name}`);
	});
})
.then(() => {
	const name = 'catches a timeout error';
	return test(
		name,
		function () {
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 500);
			});
		},
		{exitProcessOnEnd: false, rejectable: true, timeout: 100}
	)
	.then(
		() => {
			throw new Error(`Failed: ${name}`);
		},
		(error) => {
			assert.equal(error.code, 'ETIMEOUT', `Failed: ${name}`);
		}
	);
})
.then(() => {
	const name = 'changes the timeout limit';
	return test(
		name,
		function () {
			this.timeout = 1000;
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 500);
			});
		},
		{exitProcessOnEnd: false, rejectable: true, timeout: 100}
	);
})
.then(() => {
	console.groupEnd();
	console.log(`${chalk.green('✔︎')} ${packageJSON.name} passed the tests`);
})
.catch((error) => {
	console.groupEnd();
	console.log(`${chalk.red('✖︎')} ${packageJSON.name} doesn't pass the tests`);
	console.error(error);
	process.exit(1);
});
