const console = require('console');
const chalk = require('chalk');

if (typeof console.group !== 'function') {
	const {log, error} = console;
	let indent = '';
	Object.assign(
		console,
		{
			group() {
				indent += '  ';
			},
			groupEnd() {
				indent = indent.slice(2);
			},
			log(...args) {
				args.unshift(indent);
				log(...args);
			},
			error(...args) {
				args.unshift(indent);
				error(...args);
			},
		}
	);
}

class Test {

	constructor(
		name,
		fn,
		{
			parent,
			exitProcessOnEnd = true,
			rejectable = false,
			timeout = parent ? parent.timeout : 2000,
		} = {}
	) {
		Object.assign(
			this,
			{
				name,
				fn,
				parent,
				exitProcessOnEnd,
				rejectable,
				timeout,
				children: [],
			}
		);
	}

	clone() {
		const {
			name,
			fn,
			parent,
			exitProcessOnEnd,
			rejectable,
			timeout,
		} = this;
		return new Test(name, fn, {
			parent,
			exitProcessOnEnd,
			rejectable,
			timeout,
		});
	}

	eq(anotherTest) {
		return this.fn === anotherTest.fn;
	}

	get done() {
		return this.passed || this.failed;
	}

	get result() {
		let total = 0;
		let passed = 0;
		let failed = 0;
		for (const child of this.children) {
			total++;
			if (child.passed) {
				passed++;
			} else if (child.failed) {
				failed++;
			}
		}
		return {
			total,
			passed,
			failed,
		};
	}

	startGroup() {
		if (!this.group) {
			this.group = true;
			console.log();
			console.group(chalk.underline(this.name));
		}
	}

	endGroup() {
		if (this.group) {
			this.group = false;
			console.groupEnd();
		}
	}

	startTimer() {
		this.startedAt = new Date();
		return new Promise((resolve, reject) => {
			this.timer = setTimeout(() => {
				const {timeout} = this;
				this.timer = setTimeout(() => {
					if (this.children.length === 0) {
						reject(Object.assign(
							new Error(`Timeout of ${timeout}ms exceeded`),
							{code: 'ETIMEOUT'}
						));
					}
				}, timeout);
			}, 100);
		});
	}

	stopTimer() {
		clearTimeout(this.timer);
		this.endedAt = new Date();
		this.elapsed = this.endedAt - this.startedAt;
	}

	_run() {
		let lastChildPromise = Promise.resolve();
		return Promise.race([
			this.startTimer(),
			Promise.resolve(this.fn((name, fn, params = {}) => {
				const test = new Test(
					name,
					fn,
					Object.assign(
						{
							exitProcessOnEnd: false,
							rejectable: false,
						},
						params,
						{parent: this}
					)
				);
				this.children.push(test);
				lastChildPromise = lastChildPromise
				.then(() => {
					return test.run();
				});
				return lastChildPromise;
			}))
			.then(() => {
				return lastChildPromise;
			})
			.then(() => {
				const {passed, failed, total} = this.result;
				if (0 < total) {
					const message = `passes: ${passed}, failures: ${failed}`;
					if (0 < failed) {
						throw Object.assign(
							new Error(message),
							{
								code: 'ECOUNT',
								passed,
								failed,
								total,
							}
						);
					}
					return message;
				}
				return this.name;
			}),
		]);
	}

	run() {
		if (this.parent) {
			this.parent.startGroup();
		}
		let promise;
		try {
			promise = this._run();
		} catch (error) {
			promise = Promise.reject(error);
		}
		promise = promise
		.then((message) => {
			this.pass(message);
		})
		.catch((error) => {
			this.fail(error);
		});
		this.promise = promise;
		this.run = () => {
			return promise;
		};
		promise.test = this;
		return promise;
	}

	fix() {
		if (this.done || (this.parent && this.parent.done)) {
			throw new Error(`"${this.name}" ended out of sequence`);
		}
		this.stopTimer();
		this.endGroup();
	}

	pass(massage) {
		this.fix();
		this.passed = true;
		console.log(chalk.green('✔︎'), massage || this.name, chalk.gray(`(${this.elapsed}ms)`));
		this.end(0);
	}

	fail(error) {
		this.fix();
		this.failed = true;
		error = error || new Error(`Caught ${error}`);
		this.error = error;
		const isCount = error.code === 'ECOUNT';
		const elapsed = chalk.gray(`(${this.elapsed}ms)`);
		if (isCount) {
			console.log(`${chalk.red(`✖︎ ${error.message}`)} ${elapsed}\n`);
		} else {
			console.log(`${chalk.red('✖︎')} ${this.name} ${elapsed}`);
			console.error(error.stack || error);
		}
		if (this.rejectable) {
			throw error;
		}
		this.end(1);
	}

	end(exitCode) {
		if (this.exitProcessOnEnd) {
			process.exit(exitCode);
		}
	}

}

function test(name, fn, params = {exitProcessOnEnd: true}) {
	const test = new Test(name, fn, params);
	return test.run();
}

module.exports = test;
