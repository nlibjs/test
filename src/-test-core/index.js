const console = require('console');
const humanReadable = require('@nlib/human-readable');
const {Timer} = require('../-timer');
const {Hooks} = require('../-hooks');
const {isObject} = require('../is-object');
const {assignFix} = require('../assign-fix');

const NEXT = Symbol('next');
const SUMMARY = Symbol('summary');

exports.TestCore = class TestCore extends Function {

	static get defaultOptions() {
		return {
			timeout: 1000,
			bailout: false,
			hooks: {
				beforeEach(test) {
					console.log(test.title);
				},
				afterEach(test) {
					console.log(humanReadable(test.elapsed));
					if (test.isRoot) {
						process.exit(test.passed ? 0 : 1);
					}
				},
				error(test, error) {
					console.error(error);
					process.exit(1);
				},
			},
		};
	}

	constructor({
		parent,
		title = process.mainModule.filename,
		fn,
		options = {},
	} = {}) {
		const hooks = new Hooks(parent ? parent.hooks : []);
		if (isObject(options.hooks)) {
			hooks.add(options.hooks);
		}
		assignFix(super(), {
			parent,
			depth: parent ? parent.depth + 1 : 0,
			breadcrumbs: parent ? parent.breadcrumbs.concat(title) : [],
			title,
			fn,
			hooks,
			options: Object.assign({}, parent ? parent.options : TestCore.defaultOptions, options),
			children: [],
		});
		return Object.setPrototypeOf(
			(...args) => this.add(...args),
			Object.getPrototypeOf(this)
		);
	}

	get root() {
		return this.parent ? this.parent.root : this;
	}

	get isRoot() {
		return !this.parent;
	}

	* ancestors() {
		yield this;
		if (this.parent) {
			yield* this.parent.ancestors();
		}
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
			if (!this.done) {
				throw new Error(`Failed to summarize the result. This test "${this.title}" is not ended.`);
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

	// reportErrors() {
	// 	const {errors} = this.summary;
	// 	for (let index = 0; index < errors.length; index++) {
	// 		const error = errors[index];
	// 		const lines = [error.stack || error];
	// 		if (error.code === 'ERR_ASSERTION') {
	// 			lines.push(
	// 				'# actual:',
	// 				this.indent(error.actual, 1),
	// 				'# expected:',
	// 				this.indent(error.expected, 1)
	// 			);
	// 		}
	// 		const breadcrumbs = error.test.breadcrumbs.join(' > ');
	// 		this.stderr.write([
	// 			'',
	// 			`${this.options.error} #${index + 1} ${breadcrumbs}`,
	// 			this.indent(lines.join('\n'), 1),
	// 			'',
	// 		].join('\n'));
	// 	}
	// 	this.stderr.write('\n');
	// }

	add(title, fn, options) {
		if (this.done) {
			throw new Error(`Failed to add a child test because the parent test "${this.title}" is done.`);
		}
		title = Array.isArray(title) ? title : [title];
		const test = title
		.reduce((parent, title) => {
			const found = parent.children.find((test) => test.title === title);
			if (found) {
				return found;
			} else {
				const test = new Test({parent, title, options});
				parent.children.push(test);
				return test;
			}
		}, this);
		this.children.push(test);
		test.fn.push(fn);
		if (this.isRoot && this.options.autoStart && this.run) {
			this.run();
		}
		// const test = new this.constructor({parent: this, title, fn, options});
		// this.children.push(test);
		// if (test === this.firstChild) {
		// 	if (this.isRoot) {
		// 		this.run();
		// 	}
		// }
	}

	execute() {
		if (this.skip) {
			return Promise.reject(Object.assign(new Error('Skipped'), {code: 'EBAILOUT'}));
		}
		return Promise.resolve().then(() => this.isRoot ? undefined : this.fn.call(undefined, this));
	}

	run() {
		const timer = new Timer(this.options.timeout);
		return this.hooks.call('beforeEach')
		.then(() => Promise.race([timer.start(), this.execute()]))
		.then(
			(value) => assignFix(this, {resolved: true, value}),
			(error) => assignFix(this, {rejected: true, error: Object.assign(
				isObject(error) ? error : new Error(`The test "${this.title}" failed with ${error}.`),
				{test: this}
			)})
		)
		.then(() => assignFix({elapsed: timer.stop(), done: true}).runChildren())
		.then(() => {
			if (this.failed && this.options.bailout) {
				this.bailout();
			}
			return this.hooks.call('afterEach');
		})
		.catch((error) => this.hooks.call('error', error));
	}

	bailout() {
		assignFix(this, {skip: true});
		for (const child of this.children) {
			assignFix(child, {skip: true});
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
