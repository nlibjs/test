const console = require('console');
const assert = require('assert');
const {Test} = require('..');
const {defaultOptions} = require('../src/default-options');

Promise.resolve()
.then(() => {
	header('Run a test');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	return test.run()
	.then(() => {
		testCalledHooks(options.calledHooks, [
			['start', test],
			['beforeEach', test],
			['afterEach', test],
			['end', test],
		]);
		testSummary(test, 1, 0);
	});
})
.then(() => {
	header('Run tests');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	test('test1', (test) => {
		test('test11', () => wait());
		test('test12', () => wait());
		return wait();
	});
	test('test2', (test) => {
		test('test21', () => wait());
		return wait();
	});
	return test.run()
	.then(() => {
		const tests = flatten(test);
		testCalledHooks(options.calledHooks, [
			['start', tests.root],
			['beforeEach', tests.root],
			['firstChild', tests.root],
			['beforeEach', tests.test1],
			['firstChild', tests.test1],
			['beforeEach', tests.test11],
			['afterEach', tests.test11],
			['beforeEach', tests.test12],
			['afterEach', tests.test12],
			['afterEach', tests.test1],
			['beforeEach', tests.test2],
			['firstChild', tests.test2],
			['beforeEach', tests.test21],
			['afterEach', tests.test21],
			['afterEach', tests.test2],
			['afterEach', tests.root],
			['end', tests.root],
		]);
		testSummary(test, 6, 0);
	})
	.then(footer);
})
.then(() => {
	header('Add tests by array');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	test('test1', (test) => {
		test('test12', () => wait());
		return wait();
	});
	test(['test1', 'test11'], () => wait());
	test(['test2', 'test21'], () => wait());
	return test.run()
	.then(() => {
		const tests = flatten(test);
		testCalledHooks(options.calledHooks, [
			['start', tests.root],
			['beforeEach', tests.root],
			['firstChild', tests.root],
			['beforeEach', tests.test1],
			['firstChild', tests.test1],
			['beforeEach', tests.test11],
			['afterEach', tests.test11],
			['beforeEach', tests.test12],
			['afterEach', tests.test12],
			['afterEach', tests.test1],
			['beforeEach', tests.test2],
			['firstChild', tests.test2],
			['beforeEach', tests.test21],
			['afterEach', tests.test21],
			['afterEach', tests.test2],
			['afterEach', tests.root],
			['end', tests.root],
		]);
		testSummary(test, 6, 0);
	})
	.then(footer);
})
.then(() => {
	header('Run tests and report errors');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	const error1 = new Error('error1');
	const error2 = 'error2';
	const error3 = undefined;
	test('test1', (test) => {
		test('test11', () => wait().then(() => Promise.reject(error1)));
		test('test12', () => wait());
		return wait();
	});
	test('test2', (test) => {
		test('test21', () => {
			throw error3;
		});
		throw error2;
	});
	return test.run()
	.then(() => {
		const tests = flatten(test);
		testCalledHooks(options.calledHooks, [
			['start', tests.root],
			['beforeEach', tests.root],
			['firstChild', tests.root],
			['beforeEach', tests.test1],
			['firstChild', tests.test1],
			['beforeEach', tests.test11],
			['afterEach', tests.test11],
			['beforeEach', tests.test12],
			['afterEach', tests.test12],
			['afterEach', tests.test1],
			['beforeEach', tests.test2],
			['firstChild', tests.test2],
			['beforeEach', tests.test21],
			['afterEach', tests.test21],
			['afterEach', tests.test2],
			['afterEach', tests.root],
			['end', tests.root],
		]);
		testSummary(test, 3, 3, [
			error1,
			(actualError) => {
				assert.equal(actualError.value, error2);
				return true;
			},
			(actualError) => {
				assert.equal(actualError.value, error3);
				return true;
			},
		]);
		assert.equal(error1.test, tests.test11);
	})
	.then(footer);
})
.then(() => {
	header('Run tests and report timeout errors');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	test('test1', (test) => {
		test('test11', () => wait(100), {timeout: 50});
		test('test12', () => wait());
		return wait();
	});
	test('test2', (test) => {
		test('test21', () => {});
		return wait(100);
	}, {timeout: 50});
	return test.run()
	.then(() => {
		const tests = flatten(test);
		testCalledHooks(options.calledHooks, [
			['start', tests.root],
			['beforeEach', tests.root],
			['firstChild', tests.root],
			['beforeEach', tests.test1],
			['firstChild', tests.test1],
			['beforeEach', tests.test11],
			['afterEach', tests.test11],
			['beforeEach', tests.test12],
			['afterEach', tests.test12],
			['afterEach', tests.test1],
			['beforeEach', tests.test2],
			['firstChild', tests.test2],
			['beforeEach', tests.test21],
			['afterEach', tests.test21],
			['afterEach', tests.test2],
			['afterEach', tests.root],
			['end', tests.root],
		]);
		testSummary(test, 4, 2, [tests.test11.error, tests.test2.error]);
		assert.equal(tests.test11.error.code, 'ETIMEOUT');
		assert.equal(tests.test2.error.code, 'ETIMEOUT');
	})
	.then(footer);
})
.then(() => {
	header('Run tests and report timeout and skipped errors');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	test('test1', (test) => {
		test('test11', () => wait(100), {timeout: 50});
		test('test12', () => wait());
		return wait();
	}, {bailout: true});
	test('test2', (test) => {
		test('test21', () => {});
		return wait(100);
	}, {timeout: 50});
	return test.run()
	.then(() => {
		const tests = flatten(test);
		testCalledHooks(options.calledHooks, [
			['start', tests.root],
			['beforeEach', tests.root],
			['firstChild', tests.root],
			['beforeEach', tests.test1],
			['firstChild', tests.test1],
			['beforeEach', tests.test11],
			['afterEach', tests.test11],
			['beforeEach', tests.test12],
			['afterEach', tests.test12],
			['afterEach', tests.test1],
			['beforeEach', tests.test2],
			['afterEach', tests.test2],
			['afterEach', tests.root],
			['end', tests.root],
		]);
		testSummary(test, 2, 3, [tests.test11.error, tests.test12.error, tests.test2.error]);
		assert.equal(tests.test11.error.code, 'ETIMEOUT');
		assert.equal(tests.test12.error.code, 'ESKIPPED');
		assert.equal(tests.test2.error.code, 'ESKIPPED');
	})
	.then(footer);
})
.then(() => {
	header('Throw an error on summarizing an unclosed test');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	let caughtError;
	try {
		test.summarize();
	} catch (error) {
		caughtError = error;
	}
	assert.equal(caughtError.code, 'EUNCLOSED');
	footer();
})
.then(() => {
	header('Throw an error on adding a test to a closed test');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	return test.run()
	.then(() => {
		let caughtError;
		try {
			test('test1');
		} catch (error) {
			caughtError = error;
		}
		assert.equal(caughtError.code, 'ECLOSED');
	})
	.then(footer);
})
.then(() => {
	header('AutoRun');
	return new Promise((resolve, reject) => {
		const options = generateOptions({
			autoRun: true,
			hooks: {
				end: () => resolve(options),
				error: reject,
			},
		});
		const test = new Test({title: 'root', options});
		test('test1', () => {});
	})
	.then(footer);
})
.then(() => {
	header('defaultOptions');
	const $console = {
		history: [],
		log(...args) {
			args.unshift('log');
			$console.history.push(args);
		},
		error(...args) {
			args.unshift('error');
			$console.history.push(args);
		},
		exit(...args) {
			args.unshift('exit');
			$console.history.push(args);
		},
	};
	const test = new Test({
		title: 'root',
		options: Object.assign(defaultOptions($console, $console), {
			autoRun: false,
		}),
	});
	test('test1', (test) => {
		test('test11', () => wait(100), {timeout: 50});
		test('test12', () => wait());
		return wait();
	});
	test('test2', (test) => {
		test('test21', () => {});
		return wait(100);
	}, {timeout: 50});
	return test.run()
	.then(() => {
		const expectedHistory = [
			['log', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/],
			['log', /^root$/],
			['log', /^\| {2}test1$/],
			['log', /^\| {2}\| {2}❌ test11/],
			['log', /^\| {2}\| {2}✅ test12/],
			['log', /^\| {2}\[2\/3\] test1/],
			['log', /^\| {2}test2$/],
			['log', /^\| {2}\| {2}✅ test21/],
			['log', /^\| {2}\[1\/2\] test2/],
			['log', /^\[4\/6\] root/],
			['log', /^passed: 4, failed: 2/],
			['error', /^#1 root/],
			['error', /^--------/],
			['error', /^Error: Timeout of 50ms exceeded/],
			['error', /^--------/],
			['error', /^#2 root/],
			['error', /^--------/],
			['error', /^Error: Timeout of 50ms exceeded/],
			['error', /^--------/],
			['exit', 1],
		];
		const length = Math.max($console.history.length, expectedHistory.length);
		for (let i = 0; i < length; i++) {
			const actualArgs = $console.history[i];
			const expectedArgs = expectedHistory[i];
			const argsLength = Math.max(actualArgs.length, expectedArgs.length);
			for (let j = 0; j < argsLength; j++) {
				const actualArg = actualArgs[j];
				const expectedArg = expectedArgs[j];
				let [shortened] = `${actualArg}`.split('\n');
				if (20 < shortened.length) {
					shortened = `${shortened.slice(0, 17)}...`;
				}
				shortened = JSON.stringify(shortened);
				if (expectedArg.test) {
					console.log(`#${i}.${j} ${expectedArg}.test(${shortened})`);
					assert.ok(expectedArg.test(actualArg));
				} else if (typeof expectedArg === 'function') {
					console.log(`#${i}.${j} ${shortened}`);
					assert.ok(expectedArg(actualArg));
				} else {
					console.log(`#${i}.${j} ${shortened} === ${expectedArg}`);
					assert.equal(actualArg, expectedArg);
				}
			}
		}
	});
})
.catch((error) => {
	console.error(error);
	process.exit(1);
});

function header(...messages) {
	console.log(`-------- ${messages.join(' ')} --------`);
}

function footer() {
	console.log('✅  done.\n');
}

function wait(duration = 50) {
	return new Promise((resolve) => setTimeout(resolve, duration));
}

function generateOptions(...args) {
	const calledHooks = [];
	return Object.assign({
		autoRun: false,
		calledHooks,
		hooks: {},
		globalHooks: {
			all: (...args) => calledHooks.push(args),
		},
	}, ...args);
}

function flatten(test) {
	return Object.assign({[test.title]: test}, ...test.children.map(flatten));
}

function testCalledHooks(actualHooks, expectedHooks) {
	const length = Math.max(actualHooks.length, expectedHooks.length);
	for (let i = 0; i < length; i++) {
		const [expectedKey, expectedTest, ...expectedArgs] = expectedHooks[i] || [];
		const [actualKey, actualTest, ...actualArgs] = actualHooks[i] || [];
		console.log(`Hook#${i} ${actualTest.title}.${actualKey} === ${expectedTest.title}.${expectedKey}`);
		assert.equal(actualKey, expectedKey);
		assert.equal(actualTest, expectedTest);
		assert.deepEqual(actualArgs, expectedArgs);
	}
}

function testSummary(test, expectedPassed, expectedFailed, expectedErrors = []) {
	test.summarize();
	console.log(`passed: ${test.passed} === ${expectedPassed}, failed: ${test.failed} === ${expectedFailed}`);
	assert.equal(test.passed, expectedPassed);
	assert.equal(test.failed, expectedFailed);
	const length = Math.max(test.errors.length, expectedErrors.length);
	for (let i = 0; i < length; i++) {
		const actualError = test.errors[i];
		const expectedError = expectedErrors[i];
		if (typeof expectedError === 'function') {
			assert(expectedError(actualError));
		} else {
			console.log(`Error#${i} ${actualError.message} === ${expectedError.message}`);
			assert.equal(actualError, expectedError);
		}
	}
}
