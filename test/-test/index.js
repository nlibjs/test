const $test = require('../..');
const returnUndefined = require('./return-undefined');
const lines = require('./lines');
const object = require('./object');
const single = require('./single');
const nested = require('./nested');
const failed = require('./failed');
const bailout = require('./bailout');
const timeout = require('./timeout');
const addToClosed = require('./add-to-closed');
const getSummaryFromUnclosed = require('./get-summary-from-unclosed');
const wrapValue = require('./wrap-value');

$test('Test', ($test) => {
	$test(...returnUndefined);
	$test(...lines);
	$test(...object);
	$test(...single);
	$test(...nested);
	$test(...failed);
	$test(...bailout);
	$test(...timeout);
	$test(...addToClosed);
	$test(...getSummaryFromUnclosed);
	$test(...wrapValue);
});
