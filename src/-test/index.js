const assert = require('assert');
const humanReadable = require('@nlib/human-readable');
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
			onInternalError(error) {
				this.stderr.write(`\n${error.stack || error}\n`);
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
			add: Object.assign(
				this.add.bind(this),
				{
					object: this.object.bind(this),
					lines: this.lines.bind(this),
				}
			),
		});
		if (this.isRoot) {
			return this.add;
		}
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

	get lastChild() {
		return this.children[this.childCount - 1];
	}

	get nextChild() {
		for (const child of this.children) {
			if (!child.done) {
				return child;
			}
		}
		return null;
	}

	get depth() {
		if (this.isRoot) {
			return 0;
		}
		return this.parent.depth + 1;
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
						reject(new Error(`Timeout of ${timeout}ms exceeded`));
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

	summarize() {
		if (!this.closed) {
			throw new Error(`Failed to summarize the result. This test "${this.title}" is not closed.`);
		}
		let passed = 0;
		let failed = 0;
		const errors = [];
		for (const child of this.children) {
			const summary = child.summarize();
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
		return {
			total: passed + failed,
			passed,
			failed,
			errors,
		};
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
		const {total, passed} = this.summary;
		const summary = `${1 < total ? ` [${passed}/${total}]` : ''} (${humanReadable(this.elapsed)}s)`;
		switch (this.options.logLevel) {
		case logLevels.debug:
		case logLevels.info:
			if (this.passed) {
				this.stdout.write(`${this.indent(`${this.options.passed} ${this.title}${summary}`)}\n`);
			}
		case logLevels.error:
			if (this.failed) {
				this.stderr.write(this.indent(`${this.options.failed} ${this.title}${summary}`));
				this.stderr.write(` → ${this.error}`);
				this.stderr.write('\n');
			}
		default:
			if (this.isRoot) {
				this.reportErrors();
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
			this.stdout.write(`${this.indent(this.title)}\n`);
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
			return this.isRoot ? undefined : this.fn.call(undefined, this.add);
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
			this.summary = this.summarize();
			this.report();
			if (this.failed && this.options.bailout) {
				this.bailout();
			}
			this.options.onEnd(this);
		})
		.catch(this.options.onInternalError);
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
			if (typeof expectedValue === 'object') {
				for (const [,, e] of ancestors) {
					if (e === expectedValue) {
						throw new Error(`${accessor}: cyclic reference`);
					}
				}
				this.object(actualValue, expectedValue, nextAncestors);
			} else {
				this.add(`${accessor} (${actualValue}) === ${expectedValue}`, () => {
					assert.strictEqual(actualValue, expectedValue);
				});
			}
		}
	}

	lines(actualLines, expectedLines) {
		actualLines = `${actualLines}`.split(/\r\n|\r|\n/);
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
