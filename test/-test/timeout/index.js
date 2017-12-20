const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['timeout case', ($test) => {
	const logger = new Logger();
	return new Promise((resolve, reject) => {
		new Test({
			options: {
				stdout: logger,
				stderr: logger,
				onEnd: (test) => {
					if (test.isRoot) {
						resolve(test);
					}
				},
				onInternalError: reject,
			},
		})('timeout', () => {
			return new Promise((resolve) => {
				setTimeout(resolve, 200);
			});
		}, {timeout: 100});
	})
	.then((test) => {
		$test.object(test, {
			closed: true,
			passed: false,
			failed: true,
			title: process.mainModule.filename,
			value: undefined,
			children: {
				length: 1,
				0: {
					closed: true,
					passed: false,
					failed: true,
					title: 'timeout',
					error: {
						code: 'ETIMEOUT',
					},
				},
			},
		}, 'test');
		$test.lines(Buffer.concat(logger.written), [
			process.mainModule.filename,
			/^\| {2}❌ timeout \(\S+\)/,
			/^❌ \S+ \[1\/2\] \(\S+\)/,
		]);
	});
}];
