const Logger = require('../../-logger');
const {Test} =require('../../..');

module.exports = ['Test.prototype.lines', ($test) => {
	$test('array', ($test) => {
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
			}).lines(
				['123', '123', 'abc', 'abc', 'def', 'def'],
				[
					'123\n1234',
					/abc/,
					/abcd/,
					(actual) => actual === 'def',
					(actual) => actual === 'defg',
				]
			);
		})
		.then((test) => {
			$test.object(test, {
				closed: true,
				passed: false,
				failed: true,
				title: process.mainModule.filename,
				value: undefined,
				children: {
					length: 6,
					0: {
						closed: true,
						passed: true,
						failed: false,
						title: 'line 1: 123',
						value: undefined,
					},
					1: {
						closed: true,
						passed: false,
						failed: true,
						title: 'line 2: 123',
						value: undefined,
					},
					2: {
						closed: true,
						passed: true,
						failed: false,
						title: 'line 3: abc',
						value: undefined,
					},
					3: {
						closed: true,
						passed: false,
						failed: true,
						title: 'line 4: abc',
						value: undefined,
					},
					4: {
						closed: true,
						passed: true,
						failed: false,
						title: 'line 5: def',
						value: undefined,
					},
					5: {
						closed: true,
						passed: false,
						failed: true,
						title: 'line 6: def',
						value: undefined,
					},
				},
			}, 'test');
			$test.lines(Buffer.concat(logger.written), [
				process.mainModule.filename,
				/^\| {2}✅ line 1: 123 (\S+)/,
				/^\| {2}❌ line 2: 123 (\S+) → AssertionError/,
			]);
		});
	});

	$test('string', ($test) => {
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
			}).lines(
				['123', '123', 'abc', 'abc', 'def', 'def'].join('\n'),
				[
					'123\n1234',
					/abc/,
					/abcd/,
					(actual) => actual === 'def',
					(actual) => actual === 'defg',
				]
			);
		})
		.then((test) => {
			$test.object(test, {
				closed: true,
				passed: false,
				failed: true,
				title: process.mainModule.filename,
				value: undefined,
				children: {
					length: 6,
					0: {
						closed: true,
						passed: true,
						failed: false,
						title: 'line 1: 123',
						value: undefined,
					},
					1: {
						closed: true,
						passed: false,
						failed: true,
						title: 'line 2: 123',
						value: undefined,
					},
					2: {
						closed: true,
						passed: true,
						failed: false,
						title: 'line 3: abc',
						value: undefined,
					},
					3: {
						closed: true,
						passed: false,
						failed: true,
						title: 'line 4: abc',
						value: undefined,
					},
					4: {
						closed: true,
						passed: true,
						failed: false,
						title: 'line 5: def',
						value: undefined,
					},
					5: {
						closed: true,
						passed: false,
						failed: true,
						title: 'line 6: def',
						value: undefined,
					},
				},
			}, 'test');
			$test.lines(Buffer.concat(logger.written), [
				process.mainModule.filename,
				/^\| {2}✅ line 1: 123 (\S+)/,
				/^\| {2}❌ line 2: 123 (\S+) → AssertionError/,
			]);
		});
	});
}];
