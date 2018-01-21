const humanReadable = require('@nlib/human-readable');
const {Timer} = require('../-timer');

const NEXT = Symbol('next');
const SUMMARY = Symbol('summary');

exports.TestCore = class TestCore extends Function {

	static get defaultOptions() {
		return {
			stdout: process.stdout,
			stderr: process.stderr,
			passed: '✅',
			failed: '❌',
			error: '🚨',
			timeout: 1000,
			bailout: false,
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
		Object.assign(super(), {
			parent,
			title,
			fn,
			children: [],
			depth: parent ? parent.depth + 1 : 0,
			breadcrumbs: parent ? parent.breadcrumbs.concat(title) : [],
			options: Object.assign(
				{},
				parent ? parent.options : TestCore.defaultOptions,
				options
			),
		});
		return new Proxy(this, {
			apply: (target, thisArg, argumentsList) => {
				return this.add(...argumentsList);
			},
		});
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
		const {summary: {total, passed}} = this;
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
		} else {
			if (this.failed) {
				writer.write(`${heading} → ${this.error}\n`);
			} else {
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
		const test = new this.constructor({parent: this, title, fn, options});
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
			return Promise.reject(Object.assign(
				new Error('Skipped'),
				{code: 'EBAILOUT'}
			));
		}
		return Promise.resolve()
		.then(() => this.isRoot ? undefined : this.fn.call(undefined, this));
	}

	run() {
		const timer = new Timer(this.options.timeout);
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
				this.error = isObject(error) ? error : new Error(`The test "${this.title}" failed with ${error}.`);
				this.error.test = this;
			}
		)
		.then(() => {
			this.elapsed = timer.stop();
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

};

function isObject(x) {
	if (!x) {
		return false;
	}
	const type = typeof x;
	return type === 'object' || type === 'function';
}
