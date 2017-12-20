const assert = require('assert');
const humanReadable = require('@nlib/human-readable');

const DEPTH = Symbol('depth');
const NEXT = Symbol('next');
const SUMMARY = Symbol('summary');

module.exports = class Test {

	static get logLevels() {
		return {
			debug: 0,
			info: 1,
			error: 2,
			silent: 3,
		};
	}

	static get defaultOptions() {
		return {
			stdout: process.stdout,
			stderr: process.stderr,
			passed: '✅',
			failed: '❌',
			error: '🚨',
			timeout: 1000,
			bailout: false,
			logLevel: Test.logLevels.info,
			onEnd(test) {
				if (test.isRoot) {
					process.exit(test.passed ? 0 : 1);
				}
			},
			onInternalError(error, test) {
				test.options.stderr.write(`\n${error.stack || error}\n`);
				process.exit(1);
			},
		};
	}

	constructor({
		parent,
		title = process.mainModule.filename,
		fn,
		options,
	} = {}) {
		options = Object.assign(
			{},
			parent ? parent.options : Test.defaultOptions,
			options
		);
		if ((options.logLevel in Test.logLevels)) {
			options.logLevel = Test.logLevels[options.logLevel];
		} else if (typeof options.logLevel !== 'number') {
			throw new Error(`Invalid logLevel: ${options.logLevel} (allowed: ${Test.logLevels.join(',')})`);
		}
		Object.assign(this, {
			parent,
			title,
			fn,
			options,
			children: [],
		});
		return new Proxy(() => {}, Object.assign(
			Object.getOwnPropertyNames(Reflect)
			.reduce((reflector, key) => {
				const fn = Reflect[key];
				reflector[key] = (target, ...args) => {
					return fn(this, ...args);
				};
				return reflector;
			}, {}),
			{
				apply: (target, thisArg, argumentsList) => {
					return this.add(...argumentsList);
				},
			}
		));
	}

	get stdout() {
		return this.options.stdout;
	}

	get stderr() {
		return this.options.stderr;
	}

	get isRoot() {
		return !this.parent;
	}

	get childCount() {
		return this.children.length;
	}

	get firstChild() {
		return this.children[0];
	}

	get nextChild() {
		for (let i = this[NEXT] || 0; i < this.childCount; i++) {
			const child = this.children[i];
			if (!child.done) {
				return child;
			}
			this[NEXT] = i + 1;
		}
		return null;
	}

	get depth() {
		if (!(DEPTH in this)) {
			this[DEPTH] = this.isRoot ? 0 : this.parent.depth + 1;
		}
		return this[DEPTH];
	}

	get timer() {
		const {options: {timeout}} = this;
		let timer;
		let startedAt;
		return {
			start() {
				startedAt = process.hrtime();
				return new Promise((resolve, reject) => {
					timer = setTimeout(() => {
						const error = new Error(`Timeout of ${timeout}ms exceeded`);
						error.code = 'ETIMEOUT';
						reject(error);
					}, timeout);
				});
			},
			stop() {
				clearTimeout(timer);
				return process.hrtime(startedAt);
			},
		};
	}

	get breadcrumbs() {
		if (this.isRoot) {
			return [];
		}
		return this.parent.breadcrumbs.concat(this.title);
	}

	get summary() {
		if (!(SUMMARY in this)) {
			if (!this.closed) {
				throw new Error(`Failed to summarize the result. This test "${this.title}" is not closed.`);
			}
			let passed = 0;
			let failed = 0;
			const errors = [];
			for (const child of this.children) {
				const {summary} = child;
				passed += summary.passed;
				failed += summary.failed;
				errors.push(...summary.errors);
			}
			if (this.resolved) {
				passed++;
			}
			if (this.rejected) {
				failed++;
				errors.push(this.error);
			}
			if (0 < failed) {
				this.passed = false;
				this.failed = true;
				if (!this.error) {
					this.error = new Error(`${failed} test${1 < failed ? 's' : ''}`);
				}
			} else {
				this.passed = true;
				this.failed = false;
			}
			this[SUMMARY] = {
				total: passed + failed,
				passed,
				failed,
				errors,
			};
		}
		return this[SUMMARY];
	}

	indent(text, level = this.depth, chars = '|  ') {
		const indent = chars.repeat(level);
		return `${text}`.trim().split(/\r\n|\r|\n/)
		.map((line) => {
			return `${indent}${line}`;
		})
		.join('\n');
	}

	report() {
		const {logLevels} = Test;
		const {options: {logLevel}, summary: {total, passed}} = this;
		const [prefix, writer] = this.passed
		? [this.options.passed, this.stdout]
		: [this.options.failed, this.stderr];
		const heading = this.indent([
			prefix,
			` ${this.title} `,
			1 < total ? `[${passed}/${total}] ` : '',
			`(${humanReadable(this.elapsed)}s)`,
		].join(''));
		if (this.isRoot) {
			writer.write(heading);
			if (this.failed) {
				writer.write(` → ${this.error}`);
			}
			writer.write('\n');
			this.reportErrors();
		} else if (logLevel <= logLevels.error) {
			if (this.failed) {
				writer.write(`${heading} → ${this.error}\n`);
			} else if (logLevel <= logLevels.info) {
				writer.write(`${heading}\n`);
			}
		}
	}

	reportErrors() {
		const {errors} = this.summary;
		for (let index = 0; index < errors.length; index++) {
			const error = errors[index];
			const lines = [error.stack || error];
			if (error.code === 'ERR_ASSERTION') {
				lines.push(
					'# actual:',
					this.indent(error.actual, 1),
					'# expected:',
					this.indent(error.expected, 1)
				);
			}
			const breadcrumbs = error.test.breadcrumbs.join(' > ');
			this.stderr.write([
				'',
				`${this.options.error} #${index + 1} ${breadcrumbs}`,
				this.indent(lines.join('\n'), 1),
				'',
			].join('\n'));
		}
		this.stderr.write('\n');
	}

	add(title, fn, options) {
		if (this.closed) {
			throw new Error(`Failed to add a child test. This test "${this.title}" is closed.`);
		}
		const test = new Test({parent: this, title, fn, options});
		this.children.push(test);
		if (test === this.firstChild) {
			const {logLevels} = Test;
			if (this.options.logLevel <= logLevels.info) {
				this.stdout.write(`${this.indent(this.title)}\n`);
			}
			if (this.isRoot) {
				this.run();
			}
		}
	}

	execute() {
		if (this.skip) {
			const error = new Error('Skipped');
			error.code = 'EBAILOUT';
			return Promise.reject(error);
		}
		return Promise.resolve()
		.then(() => {
			return this.isRoot ? undefined : this.fn.call(undefined, this);
		});
	}

	run() {
		const {timer} = this;
		return Promise.race([
			timer.start(),
			this.execute(),
		])
		.then(
			(value) => {
				this.resolved = true;
				this.value = value;
			},
			(error) => {
				this.rejected = true;
				error = error instanceof Error ? error : new Error(`The test "${this.title}" failed with ${error}.`);
				error.test = this;
				this.error = error;
			}
		)
		.then(() => {
			const [s, ns] = timer.stop();
			this.elapsed = s + (ns / 1e9);
			this.done = true;
			return this.runChildren();
		})
		.then(() => {
			this.closed = true;
			this.report();
			if (this.failed && this.options.bailout) {
				this.bailout();
			}
			this.options.onEnd(this);
		})
		.catch((error) => {
			this.options.onInternalError(error, this);
		});
	}

	bailout() {
		this.skip = true;
		for (const child of this.children) {
			child.skip = true;
		}
		if (!this.isRoot) {
			this.parent.bailout();
		}
	}

	runChildren() {
		return new Promise((resolve, reject) => {
			const runNext = () => {
				const {nextChild} = this;
				if (nextChild) {
					nextChild.run()
					.then(() => {
						setImmediate(runNext);
					})
					.catch(reject);
				} else {
					resolve();
				}
			};
			runNext();
		});
	}

	object(actual, expected, ancestors = [['object', actual, expected]]) {
		if (typeof ancestors === 'string') {
			ancestors = [[ancestors, actual, expected]];
		}
		for (const key of Object.keys(expected)) {
			const expectedValue = expected[key];
			const actualValue = actual[key];
			const nextAncestors = [...ancestors, [key, actualValue, expectedValue]];
			const accessor = nextAncestors
			.map(([key]) => {
				return key;
			})
			.join('.');
			switch (typeof expectedValue) {
			case 'object':
				for (const [,, e] of ancestors) {
					if (e === expectedValue) {
						throw new Error(`${accessor}: cyclic reference`);
					}
				}
				this.object(actualValue, expectedValue, nextAncestors);
				break;
			case 'function':
				this.add(`${accessor} (${actualValue})`, () => {
					assert(expectedValue(actualValue));
				});
				break;
			default:
				this.add(`${accessor} (${actualValue}) === ${expectedValue}`, () => {
					assert.strictEqual(actualValue, expectedValue);
				});
			}
		}
	}

	lines(actualLines, expectedLines) {
		[actualLines, expectedLines] = [actualLines, expectedLines]
		.map((source) => {
			const lines = [];
			if (Buffer.isBuffer(source) || typeof source === 'string') {
				source = [`${source}`];
			}
			for (const item of source) {
				if (Buffer.isBuffer(item) || typeof item === 'string') {
					lines.push(...`${item}`.split(/\r\n|\r|\n/));
				} else {
					lines.push(item);
				}
			}
			return lines;
		});
		for (let index = 0; index < expectedLines.length; index++) {
			const expected = expectedLines[index];
			const actual = actualLines[index];
			this.add(`line ${index + 1}: ${actual}`, () => {
				try {
					switch (typeof expected) {
					case 'function':
						assert(expected(actual));
						break;
					case 'string':
						assert.equal(actual, expected);
						break;
					default:
						if (typeof expected.test === 'function') {
							assert(expected.test(actual));
						}
					}
				} catch (error) {
					error.actual = actual;
					error.expected = expected;
					throw error;
				}
			});
		}
	}

};
