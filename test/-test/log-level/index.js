const assert = require('assert');
const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['logLevel', ($test) => {
	$test('throw an error if given logLevel is invalid', () => {
		assert.throws(() => {
			return new Test({options: {logLevel: 'foo'}});
		});
	});
	$test('logLevel: error', () => {
		$test('nested case', ($test) => {
			const out = new Logger();
			const err = new Logger();
			return new Promise((resolve, reject) => {
				const test = new Test({
					options: {
						stdout: out,
						stderr: err,
						onEnd: (test) => {
							if (test.isRoot) {
								resolve(test);
							}
						},
						onInternalError: reject,
						logLevel: 'error',
					},
				});
				test('foo', (test) => {
					test('bar1', () => {});
					test('bar2', () => {});
				});
			})
			.then(() => {
				$test.lines(Buffer.concat(out.written), [
					/^✅ \S+ \[4\/4\] (\S+)/,
				]);
				assert.equal(`${Buffer.concat(err.written)}`, '\n');
			});
		});

		$test('failed case', ($test) => {

			const out = new Logger();
			const err = new Logger();

			return new Promise((resolve, reject) => {
				const test = new Test({
					options: {
						stdout: out,
						stderr: err,
						onEnd: (test) => {
							if (test.isRoot) {
								resolve(test);
							}
						},
						onInternalError: reject,
						logLevel: 'error',
					},
				});
				test('foo', (test) => {
					test('bar1', () => {});
					test('bar2', () => {
						throw new Error('Expected');
					});
				});
			})
			.then(() => {
				assert.equal(`${Buffer.concat(out.written)}`, '');
				$test.lines(Buffer.concat(err.written), [
					/^\| {2}\| {2}❌ bar2 \(\S+\) → Error: Expected$/,
					/^\| {2}❌ foo \[2\/3\] \(\S+\) → Error: 1 test$/,
					/^❌ \S+ \[3\/4\] \(\S+\) → Error: 1 test$/,
				]);
			});
		});
	});
}];
