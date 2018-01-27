const console = require('console');
const {indent} = require('../indent');
const humanReadable = require('@nlib/human-readable');

exports.defaultOptions = {
	autoRun: true,
	timeout: 1000,
	bailout: false,
	hooks: {
		start() {
			console.log(new Date().toISOString());
		},
		end(test) {
			const {breadcrumbs, passed, failed, errors} = test.summarize();
			console.log(`passed: ${passed}, failed: ${failed}\n`);
			for (let i = 0; i < errors.length; i++) {
				const error = errors[i];
				console.log(`#${i + 1} ${breadcrumbs.join('→')}`);
				console.log('--------');
				console.log(error.stack || error);
				console.log('--------\n');
			}
			if (0 < failed) {
				process.exit(1);
			}
		},
	},
	globalHooks: {
		firstChild(test) {
			console.log(`${indent(test.depth)}${test.title}`);
		},
		afterEach(test) {
			const {passed, failed} = test.summarize();
			const total = passed + failed;
			const prefix = 1 < total ? `[${passed}/${total}]` : `${0 < test.failed ? '❌' : '✅'}`;
			console.log(`${indent(test.depth)}${prefix} ${test.title} (${humanReadable(test.elapsed)})`);
		},
		error(test, error) {
			console.error(error);
			process.exit(1);
		},
	},
};
