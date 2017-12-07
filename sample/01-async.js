const assert = require('assert');
const test = require('..');

function wait(duration, data) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(data);
		}, duration);
	});
}

test('wait', (test) => {

	test('50ms', () => {
		const start = new Date();
		return wait(50)
		.then(() => {
			const end = new Date();
			assert(45 < end - start);
		});
	});

	test('3000ms (1)', () => {
		const start = new Date();
		return wait(3000)
		.then(() => {
			const end = new Date();
			assert(2700 < end - start);
		});
	});

	test('3000ms (2)', () => {
		const start = new Date();
		return wait(3000)
		.then(() => {
			const end = new Date();
			assert(2700 < end - start);
		});
	}, {timeout: 4000});

});
