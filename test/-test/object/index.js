const assert = require('assert');

module.exports = ['Test.prototype.object', ($test) => {

	$test.object(
		{
			foo: {
				bar: 'bazbaz',
			},
		},
		{
			foo: {
				bar(bar) {
					return bar.startsWith('baz');
				},
			},
		}
	);

	$test('handle cyclic references.', ($test) => {
		const actual = {
			a: 1,
		};
		actual.b = actual;
		const expected = {
			a: 1,
		};
		expected.b = expected;
		assert.throws(() => {
			$test.object(actual, expected);
		});
	});

}];
