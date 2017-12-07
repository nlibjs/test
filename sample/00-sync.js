const assert = require('assert');
const test = require('..');

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
