const assert = require('assert');
const path = require('path');
const test = require('../..');
const packageJSON = require('../../package.json');
const CLI = require('..');
const pathToNoop = path.join(__dirname, 'noop', 'index.js');

test('@nlib/test/cli', (test) => {

	test('CLI.package', () => {
		const actual = CLI.package;
		const expected = packageJSON;
		assert.deepEqual(actual, expected);
	});

	test('CLI.version', () => {
		const actual = CLI.version;
		const expected = packageJSON.version;
		assert.equal(actual, expected);
	});

	test('CLI.help', () => {
		const actual = typeof CLI.help;
		const expected = 'string';
		assert.equal(actual, expected);
	});

	test('CLI.hr', () => {
		const actual = typeof CLI.hr;
		const expected = 'string';
		assert.equal(actual, expected);
	});

	test('CLI.prototype.runScript', (test) => {

		test('returns a promise will be resolved with 0', () => {
			const cli = new CLI();
			return cli.runScript(pathToNoop, 0)
			.then((actual) => {
				const expected = 0;
				assert.equal(actual, expected);
			});
		});

		test('returns a promise will be resolved with 1', () => {
			const cli = new CLI();
			return cli.runScript(pathToNoop, 1)
			.then((actual) => {
				const expected = 1;
				assert.equal(actual, expected);
			});
		});

	});

	test('CLI.prototype.runScripts', (test) => {

		test('runs the script and exits with 0', () => {
			return new Promise((resolve) => {
				const cli = new CLI();
				cli.runScripts([pathToNoop], 0, resolve);
			})
			.then((actual) => {
				const expected = 0;
				assert.equal(actual, expected);
			});
		});

	});

	test('CLI.prototype.run', (test) => {

		test('runs the script and exits with 0', () => {
			return new Promise((resolve) => {
				const cli = new CLI([pathToNoop]);
				cli.run(resolve);
			})
			.then((actual) => {
				const expected = 0;
				assert.equal(actual, expected);
			});
		});

	});

});
