const assert = require('assert');
const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['throw an error if the test is closed when add() is called.', () => {
	const logger = new Logger();
	return new Promise((resolve, reject) => {
		const test = new Test({
			options: {
				stdout: logger,
				stderr: logger,
				onEnd: (endedTest) => {
					if (endedTest.isRoot) {
						resolve(test);
					}
				},
				onInternalError: reject,
			},
		});
		test('foo', () => {});
	})
	.then((test) => {
		assert.throws(() => {
			test('', () => {});
		});
	});
}];
