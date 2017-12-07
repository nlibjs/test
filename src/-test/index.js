const humanReadable = require('@nlib/human-readable');

module.exports = class Test {

	constructor({
		parent,
		title = 'test',
		fn,
		options,
	} = {}) {
		options = Object.assign(
			{},
			parent ? parent.options : {
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
			},
			options
		);
		Object.assign(this, {
			parent,
			title,
			fn,
			options,
			children: [],
			add: this.add.bind(this),
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
			this.failed = true;
		} else {
			this.passed = true;
		}
		return {
			total: passed + failed,
			passed,
			failed,
			errors,
		};
	}

	indent(text) {
		const indent = '|  '.repeat(this.depth);
		return text.trim().split(/\r\n|\r|\n/)
		.map((line) => {
			return `${indent}${line}`;
		})
		.join('\n');
	}

	report() {
		const {total, passed} = this.summary;
		const summary = `${1 < total ? ` [${passed}/${total}]` : ''} (${this.elapsed})`;
		if (this.failed) {
			this.stdout.write(`${this.indent(`${this.options.failed} ${this.title}${summary}`)}\n`);
		} else {
			this.stderr.write(this.indent(`${this.options.passed} ${this.title}${summary}`));
			if (this.rejected) {
				this.stderr.write(` → ${this.error}`);
			}
			this.stderr.write('\n');
		}
		if (this.isRoot) {
			this.reportErrors();
		}
	}

	reportErrors() {
		const {errors} = this.summary;
		for (const error of errors) {
			const breadcrumbs = error.test.breadcrumbs.join(' > ');
			this.stderr.write(`\n${this.options.error} ${breadcrumbs}\n${error.stack || error}\n`);
		}
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
		return test;
	}

	execute() {
		if (this.skip) {
			return Promise.reject(new Error('bailout: skipped'));
		}
		return Promise.resolve()
		.then(() => {
			return !this.isRoot && this.fn.call(undefined, this.add);
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
			this.elapsed = `${humanReadable(s + (ns / 1e9))}s`;
			this.done = true;
			return this.runChildren();
		})
		.then(() => {
			this.closed = true;
			this.summary = this.summarize();
			this.report();
			if (this.failed && this.options.bailout) {
				this.parent.skipChildren();
			}
			this.end();
		});
	}

	skipChildren() {
		for (const child of this.children) {
			child.skip = true;
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

	end() {
		this.options.onEnd(this);
	}

};
