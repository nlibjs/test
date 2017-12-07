const assert = require('assert');
const test = require('..');

function wait(duration, data) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(data);
		}, duration);
	});
}

test('wait', async (test) => {

	await test('50ms', async () => {
		const start = new Date();
		await wait(50);
		const end = new Date();
		assert(45 < end - start);
	});

	await test('3000ms (1)', async () => {
		const start = new Date();
		await wait(3000);
		const end = new Date();
		assert(2700 < end - start);
	});

	await test('3000ms (2)', async () => {
		const start = new Date();
		await wait(3000);
		const end = new Date();
		assert(2700 < end - start);
	}, {timeout: 4000});

});
