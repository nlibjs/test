const {Timer} = require('../-timer');
const {Hooks} = require('../-hooks');
const {isObject} = require('../is-object');
const {assignFix} = require('../assign-fix');
const {runOver} = require('../run-over');
const {defaultOptions} = require('../default-options');

exports.Test = class Test extends Function {

	constructor({
		parent,
		title = process.mainModule.filename,
		options,
	} = {}) {
		options = Object.assign({}, parent ? parent.options : defaultOptions(), options);
		const hooks = new Hooks(parent ? parent.hooks : []);
		if (isObject(options.hooks)) {
			hooks.add(options.hooks);
		}
		if (isObject(options.globalHooks)) {
			hooks.add(options.globalHooks, true);
		}
		const properties = {
			Test,
			parent,
			depth: parent ? parent.depth + 1 : 0,
			breadcrumbs: parent ? parent.breadcrumbs.concat(title) : ['root'],
			title,
			hooks,
			options,
			fn: [],
			children: [],
		};
		const test = Object.assign(
			Object.setPrototypeOf(
				(...args) => test.add(...args),
				Object.getPrototypeOf(super())
			),
			properties
		);
		return test;
	}

	get root() {
		return this.parent ? this.parent.root : this;
	}

	get isRoot() {
		return this === this.root;
	}

	* queue() {
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			if (!child.closed) {
				yield child;
			}
		}
	}

	callHook(key, ...args) {
		return this.hooks.call(key, this, ...args);
	}

	add(title, fn, options) {
		if (this.closed) {
			throw Object.assign(
				new Error(`Failed to add a child test because the parent test "${this.title}" is closed.`),
				{code: 'ECLOSED'}
			);
		}
		const test = (Array.isArray(title) ? title : [title])
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
		test.fn.push(fn);
		if (this.isRoot && this.options.autoRun) {
			this.run();
		}
	}

	run() {
		assignFix(this, {run: null});
		const timer = new Timer(this.options.timeout);
		return Promise.resolve()
		.then(() => this.isRoot && this.callHook('start'))
		.then(() => this.callHook('beforeEach'))
		.then(() => Promise.race([timer.start(), this.execute()]))
		.then(
			(value) => assignFix(this, {resolved: true, rejected: false, value}),
			(error) => assignFix(this, {resolved: false, rejected: true, error: Object.assign(
				isObject(error)
				? error
				: Object.assign(
					new Error(`The test "${this.title}" failed with ${error}.`),
					{value: error}
				),
				{test: this}
			)})
		)
		.then(() => assignFix(this, {closed: true, elapsed: timer.stop()}).runChildren())
		.then(() => this.summarize().callHook('afterEach'))
		.then(() => 0 < this.failed && this.options.bailout && this.bailout())
		.then(() => this.isRoot && this.callHook('end'))
		.catch((error) => this.callHook('error', error));
	}

	execute() {
		if (this.skip) {
			return Promise.reject(Object.assign(new Error('Skipped'), {code: 'ESKIPPED'}));
		}
		return Promise.resolve().then(() => this.isRoot ? undefined : Promise.all(this.fn.map((fn) => fn(this))));
	}

	runChildren() {
		return new Promise((resolve, reject) => {
			let count = 0;
			const queue = this.queue();
			const runNext = () => {
				const {done, value: nextChild} = queue.next();
				if (done) {
					resolve();
				} else {
					Promise.resolve(count++ === 0 && this.callHook('firstChild'))
					.then(() => nextChild.run())
					.then(() => setImmediate(runNext))
					.catch(reject);
				}
			};
			runNext();
		});
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

	summarize() {
		if (!this.closed) {
			throw Object.assign(
				new Error(`Failed to summarize the result because the test ${this.title} is not closed.`),
				{code: 'EUNCLOSED'}
			);
		}
		if (!this.total) {
			const errors = [];
			let passed = 0;
			let failed = 0;
			if (this.resolved) {
				passed += 1;
			} else {
				failed += 1;
				errors.push(this.error);
			}
			for (const child of this.children) {
				child.summarize();
				errors.push(...child.errors);
				passed += child.passed;
				failed += child.failed;
			}
			assignFix(this, {
				errors,
				passed,
				failed,
				total: passed + failed,
			});
		}
		return this;
	}

	runOver(actual, expected) {
		runOver(this, actual, expected);
	}

};
