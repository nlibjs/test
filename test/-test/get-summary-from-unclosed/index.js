const assert = require('assert');

module.exports = ['throw an error if summary() is called before closing', ($test) => {
	$test('dummy', () => {}, {
		onEnd(test) {
			$test('should fail to get summary', () => {
				assert.throws(() => {
					return test.parent.summary;
				});
			});
		},
	});
}];
