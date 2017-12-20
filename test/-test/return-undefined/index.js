const assert = require('assert');
module.exports = ['return undefined', (test) => {
	assert.equal(test('dummy', () => {}), undefined);
}];
