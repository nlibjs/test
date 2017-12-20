const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['wrap thrown value if it is not an instance of Error', ($test) => {
	const logger = new Logger();
	const value = Date.now();
	return new Promise((resolve, reject) => {
		const test = new Test({
			options: {
				stdout: logger,
				stderr: logger,
				onEnd: (test) => {
					if (test.isRoot) {
						resolve(test);
					}
				},
				onInternalError: reject,
				logLevel: 'error',
			},
		});
		test('throw test', () => {
			throw value;
		});
	})
	.then((test) => {
		$test.object(test, {
			closed: true,
			passed: false,
			failed: true,
			children: {
				length: 1,
				0: {
					closed: true,
					passed: false,
					failed: true,
					error(error) {
						return `${error}`.includes(`${value}`);
					},
				},
			},
		});
	});
}];
