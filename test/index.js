// require('./return-undefined');
// require('./lines');
// require('./object');
// require('./single');
// require('./nested');
// require('./failed');
// require('./bailout');
// require('./timeout');
// require('./add-to-closed');
// require('./get-summary-from-unclosed');
// require('./wrap-value');

const console = require('console');
const assert = require('assert');
const {Test} = require('..');

Promise.resolve()

.then(() => {
	heading('Run a test');
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
	heading('Run tests');
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
	});
})

.then(() => {
	heading('Run tests and report errors');
	const options = generateOptions();
	const test = new Test({title: 'root', options});
	const error1 = new Error('error1');
	const error2 = new Error('error2');
	test('test1', (test) => {
		test('test11', () => wait().then(() => Promise.reject(error1)));
		test('test12', () => wait());
		return wait();
	});
	test('test2', (test) => {
		test('test21', () => {});
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
		testSummary(test, 4, 2, [error1, error2]);
		assert.equal(error1.test, tests.test11);
		assert.equal(error2.test, tests.test2);
	});
})

.then(() => {
	heading('Run tests and report timeout errors');
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
	});
})

.then(() => {
	heading('Run tests and report timeout and skipped errors');
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
	});
})

.catch((error) => {
	console.error(error);
	process.exit(1);
});

function heading(...messages) {
	console.log(`\n-------- ${messages.join(' ')} --------`);
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
		console.log(`Error#${i} ${actualError.message} === ${expectedError.message}`);
		assert.equal(actualError, expectedError);
	}
}
