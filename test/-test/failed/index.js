const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['failed case', ($test) => {
	const logger = new Logger();
	const returnValue1 = `${Date.now()}-1`;
	const returnValue2 = `${Date.now()}-2`;
	const returnValue3 = `${Date.now()}-3`;

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
			},
		});
		test('foo', (test) => {
			test('bar1', () => {
				return returnValue2;
			});
			test('bar2', () => {
				const error = new Error('Expected');
				error.value = returnValue3;
				throw error;
			});
			return returnValue1;
		});
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
					title: 'foo',
					value: returnValue1,
					children: {
						length: 2,
						0: {
							closed: true,
							passed: true,
							failed: false,
							title: 'bar1',
							value: returnValue2,
						},
						1: {
							closed: true,
							passed: false,
							failed: true,
							title: 'bar2',
							value: undefined,
							error: {
								value: returnValue3,
							},
						},
					},
				},
			},
		}, 'test');
		$test.lines(Buffer.concat(logger.written), [
			process.mainModule.filename,
			/^\| {2}foo$/,
			/^\| {2}\| {2}✅ bar1 \(\S+\)$/,
			/^\| {2}\| {2}❌ bar2 \(\S+\) → Error: Expected$/,
			/^\| {2}❌ foo \[2\/3\] \(\S+\) → Error: 1 test$/,
			/^❌ \S+ \[3\/4\] \(\S+\) → Error: 1 test$/,
		]);
	});
}];
