const Test = require('./Test');
const console = require('./console');
const tests = [];
let passes = 0;
let failures = 0;

function run() {
	setImmediate(() => {
		if (run.running) {
			return;
		}
		if (0 < tests.length) {
			const [test, resolve, reject] = tests.shift();
			run.running = true;
			test.run()
			.then(resolve, reject)
			.then(() => {
				if (test.failed) {
					failures++;
				} else if (test.passed) {
					passes++;
				}
				run.running = false;
				run();
			});
		} else {
			test.onEnd({passes, failures});
		}
	});
}

function test(...args) {
	const test = new Test(...args);
	const promise = new Promise((resolve, reject) => {
		tests.push([test, resolve, reject]);
	});
	promise.test = test;
	run();
	return promise;
}

test.onEnd = ({failures}) => {
	const exitCode = 0 < failures ? 1 : 0;
	console.log(`exitCode: ${exitCode}`);
	process.exit(exitCode);
};

module.exports = test;
