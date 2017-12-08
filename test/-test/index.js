const assert = require('assert');
const {PassThrough} = require('stream');
const $test = require('../..');
const {Test} = $test;

$test('Test', ($test) => {

	$test('return undefined', ($test) => {
		assert.equal($test('dummy', () => {}), undefined);
	});

	$test('Test.prototype.lines', ($test) => {

		const written = [];

		return new Promise((resolve, reject) => {
			const stream = new PassThrough()
			.on('data', (chunk) => {
				written.push(chunk);
			});
			new Test({
				options: {
					stdout: stream,
					stderr: stream,
					onEnd: (test) => {
						if (test.isRoot) {
							resolve(test);
						}
					},
					onInternalError: reject,
				},
			}).lines(
				[
					'123',
					'123',
					'abc',
					'abc',
					'def',
					'def',
				].join('\n'),
				[
					'123',
					'1234',
					/abc/,
					/abcd/,
					(actual) => {
						return actual === 'def';
					},
					(actual) => {
						return actual === 'defg';
					},
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
			$test.lines(Buffer.concat(written), [
				process.mainModule.filename,
				/^\| {2}✅ line 1: 123 (\S+)/,
				/^\| {2}❌ line 2: 123 (\S+) → AssertionError/,
			]);
		});
	});

	$test('single case', ($test) => {

		const written = [];
		const returnValue = Date.now();

		return new Promise((resolve, reject) => {
			const stream = new PassThrough()
			.on('data', (chunk) => {
				written.push(chunk);
			});
			new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
			$test.lines(Buffer.concat(written), [
				process.mainModule.filename,
				/^\| {2}✅ foo \(\S+\)$/,
				/^✅ \S+ \[2\/2\] \(\S+\)$/,
			]);
		});
	});

	$test('nested case', ($test) => {

		const written = [];
		const returnValue1 = `${Date.now()}-1`;
		const returnValue2 = `${Date.now()}-2`;
		const returnValue3 = `${Date.now()}-3`;

		return new Promise((resolve, reject) => {
			const stream = new PassThrough()
			.on('data', (chunk) => {
				written.push(chunk);
			});
			const test = new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
					return returnValue3;
				});
				return returnValue1;
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
								passed: true,
								failed: false,
								title: 'bar2',
								value: returnValue3,
							},
						},
					},
				},
			}, 'test');
			$test.lines(Buffer.concat(written), [
				process.mainModule.filename,
				/^\| {2}foo$/,
				/^\| {2}\| {2}✅ bar1 \(\S+\)$/,
				/^\| {2}\| {2}✅ bar2 \(\S+\)$/,
				/^\| {2}✅ foo \[3\/3\] \(\S+\)$/,
				/^✅ \S+ \[4\/4\] \(\S+\)$/,
			]);
		});
	});

	$test('failed case', ($test) => {

		const written = [];
		const returnValue1 = `${Date.now()}-1`;
		const returnValue2 = `${Date.now()}-2`;
		const returnValue3 = `${Date.now()}-3`;

		return new Promise((resolve, reject) => {
			const stream = new PassThrough()
			.on('data', (chunk) => {
				written.push(chunk);
			});
			const test = new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
			$test.lines(Buffer.concat(written), [
				process.mainModule.filename,
				/^\| {2}foo$/,
				/^\| {2}\| {2}✅ bar1 \(\S+\)$/,
				/^\| {2}\| {2}❌ bar2 \(\S+\) → Error: Expected$/,
				/^\| {2}❌ foo \[2\/3\] \(\S+\) → Error: 1 test$/,
				/^❌ \S+ \[3\/4\] \(\S+\) → Error: 1 test$/,
			]);
		});
	});

	$test('bailout case', ($test) => {
		const written = [];
		const returnValue1 = `${Date.now()}-1`;
		const returnValue2 = `${Date.now()}-2`;
		const returnValue3 = `${Date.now()}-3`;
		const returnValue4 = `${Date.now()}-4`;
		const returnValue5 = `${Date.now()}-5`;
		return new Promise((resolve, reject) => {
			const stream = new PassThrough()
			.on('data', (chunk) => {
				written.push(chunk);
			});
			const test = new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
			$test.lines(Buffer.concat(written), [
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
	});

	$test('throw an error if the test is closed when add() is called.', () => {
		return new Promise((resolve, reject) => {
			const stream = new PassThrough();
			const test = new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
	});

	$test('Test.prototype.object', ($test) => {

		$test.object(
			{
				foo: {
					bar: 'bazbaz',
				},
			},
			{
				foo: {
					bar(bar) {
						return bar.startsWith('baz');
					},
				},
			}
		);

		$test('handle cyclic references.', ($test) => {
			const actual = {
				a: 1,
			};
			actual.b = actual;
			const expected = {
				a: 1,
			};
			expected.b = expected;
			assert.throws(() => {
				$test.object(actual, expected);
			});
		});

	});

	$test('throw an error if summary() is called before closing', ($test) => {
		$test('dummy', () => {}, {
			onEnd(test) {
				$test('should fail to get summary', () => {
					assert.throws(() => {
						return test.parent.summary;
					});
				});
			},
		});
	});

	$test('timeout', ($test) => {

		const written = [];

		return new Promise((resolve, reject) => {
			const stream = new PassThrough()
			.on('data', (chunk) => {
				written.push(chunk);
			});
			new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
			$test.lines(Buffer.concat(written), [
				process.mainModule.filename,
				/^\| {2}❌ timeout \(\S+\)/,
				/^❌ \S+ \[1\/2\] \(\S+\)/,
			]);
		});
	});

	$test('logLevel', ($test) => {

		$test('throw an error if given logLevel is invalid', () => {
			assert.throws(() => {
				return new Test({options: {logLevel: 'foo'}});
			});
		});

		$test('logLevel: error', () => {
			$test('nested case', ($test) => {
				const out = [];
				const err = [];
				return new Promise((resolve, reject) => {
					const outStream = new PassThrough()
					.on('data', (chunk) => {
						out.push(chunk);
					});
					const errStream = new PassThrough()
					.on('data', (chunk) => {
						err.push(chunk);
					});
					const test = new Test({
						options: {
							stdout: outStream,
							stderr: errStream,
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
					$test.lines(Buffer.concat(out), [
						/^✅ \S+ \[4\/4\] (\S+)/,
					]);
					assert.equal(`${Buffer.concat(err)}`, '\n');
				});
			});

			$test('failed case', ($test) => {

				const out = [];
				const err = [];

				return new Promise((resolve, reject) => {
					const outStream = new PassThrough()
					.on('data', (chunk) => {
						out.push(chunk);
					});
					const errStream = new PassThrough()
					.on('data', (chunk) => {
						err.push(chunk);
					});
					const test = new Test({
						options: {
							stdout: outStream,
							stderr: errStream,
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
					assert.equal(`${Buffer.concat(out)}`, '');
					$test.lines(Buffer.concat(err), [
						/^\| {2}\| {2}❌ bar2 \(\S+\) → Error: Expected$/,
						/^\| {2}❌ foo \[2\/3\] \(\S+\) → Error: 1 test$/,
						/^❌ \S+ \[3\/4\] \(\S+\) → Error: 1 test$/,
					]);
				});
			});
		});

	});

	$test('wrap thrown value if it is not an instance of Error', ($test) => {
		const value = Date.now();
		return new Promise((resolve, reject) => {
			const stream = new PassThrough();
			const test = new Test({
				options: {
					stdout: stream,
					stderr: stream,
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
	});

});
