const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['bailout case', ($test) => {
	const logger = new Logger();
	const returnValue1 = `${Date.now()}-1`;
	const returnValue2 = `${Date.now()}-2`;
	const returnValue3 = `${Date.now()}-3`;
	const returnValue4 = `${Date.now()}-4`;
	const returnValue5 = `${Date.now()}-5`;
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
		test('foo1', (test) => {
			test('bar1', () => {
				return returnValue2;
			});
			test('bar2', () => {
				const error = new Error('Expected');
				error.value = returnValue3;
				throw error;
			}, {bailout: true});
			test('bar3', () => {
				return returnValue4;
			});
			test('bar4', () => {
				return returnValue5;
			});
			return returnValue1;
		});
		test('foo2', (test) => {
			test('bar1', () => {
				return returnValue2;
			});
			test('bar2', () => {
				return returnValue3;
			});
			test('bar3', () => {
				return returnValue4;
			});
			test('bar4', () => {
				return returnValue5;
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
				length: 2,
				0: {
					closed: true,
					passed: false,
					failed: true,
					title: 'foo1',
					value: returnValue1,
					children: {
						length: 4,
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
						2: {
							closed: true,
							passed: false,
							failed: true,
							title: 'bar3',
							value: undefined,
							error: {
								code: 'EBAILOUT',
							},
						},
						3: {
							closed: true,
							passed: false,
							failed: true,
							title: 'bar4',
							value: undefined,
							error: {
								code: 'EBAILOUT',
							},
						},
					},
				},
				1: {
					closed: true,
					passed: false,
					failed: true,
					title: 'foo2',
					value: undefined,
					error: {
						code: 'EBAILOUT',
					},
				},
			},
		}, 'test');
		$test.lines(Buffer.concat(logger.written), [
			process.mainModule.filename,
			/^\| {2}foo1$/,
			/^\| {2}\| {2}✅ bar1 \(\S+\)$/,
			/^\| {2}\| {2}❌ bar2 \(\S+\) → Error: Expected$/,
			/^\| {2}\| {2}❌ bar3 \(\S+\) → Error: Skipped$/,
			/^\| {2}\| {2}❌ bar4 \(\S+\) → Error: Skipped$/,
			/^\| {2}❌ foo1 \[2\/5\] \(\S+\) → Error: 3 tests$/,
			/^\| {2}❌ foo2 \(\S+\) → Error: Skipped$/,
			/^❌ \S+ \[3\/7\] \(\S+\) → Error: 4 tests$/,
		]);
	});
}];
