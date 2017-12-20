const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['single case', ($test) => {
	const logger = new Logger();
	const returnValue = Date.now();
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
		})('foo', () => {
			return returnValue;
		});
	})
	.then((test) => {
		$test.object(test, {
			closed: true,
			passed: true,
			failed: false,
			title: process.mainModule.filename,
			value: undefined,
			children: {
				length: 1,
				0: {
					closed: true,
					passed: true,
					failed: false,
					title: 'foo',
					value: returnValue,
				},
			},
		}, 'test');
		$test.lines(Buffer.concat(logger.written), [
			process.mainModule.filename,
			/^\| {2}✅ foo \(\S+\)$/,
			/^✅ \S+ \[2\/2\] \(\S+\)$/,
		]);
	});
}];
