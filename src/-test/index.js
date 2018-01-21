const assert = require('assert');
const {TestCore} = require('../-test-core');

exports.Test = class Test extends TestCore {

	object(actual, expected, ancestors = [['object', actual, expected]]) {
		if (typeof ancestors === 'string') {
			ancestors = [[ancestors, actual, expected]];
		}
		for (const key of Object.keys(expected)) {
			const expectedValue = expected[key];
			const actualValue = actual[key];
			const nextAncestors = [...ancestors, [key, actualValue, expectedValue]];
			const accessor = nextAncestors
			.map(([key]) => {
				return key;
			})
			.join('.');
			if (typeof expectedValue === 'function') {
				this.add(`${accessor} (${actualValue})`, () => {
					assert(expectedValue(actualValue));
				});
			} else if (typeof expectedValue === 'object' && expectedValue !== null) {
				for (const [,, e] of ancestors) {
					if (e === expectedValue) {
						throw new Error(`${accessor}: cyclic reference`);
					}
				}
				this.object(actualValue, expectedValue, nextAncestors);
			} else {
				this.add(`${accessor} (${actualValue}) === ${expectedValue}`, () => {
					assert.strictEqual(actualValue, expectedValue);
				});
			}
		}
	}

	lines(actualLines, expectedLines) {
		[actualLines, expectedLines] = [actualLines, expectedLines]
		.map((source) => {
			const lines = [];
			if (Buffer.isBuffer(source) || typeof source === 'string') {
				source = [`${source}`];
			}
			for (const item of source) {
				if (Buffer.isBuffer(item) || typeof item === 'string') {
					lines.push(...`${item}`.split(/\r\n|\r|\n/));
				} else {
					lines.push(item);
				}
			}
			return lines;
		});
		for (let index = 0; index < expectedLines.length; index++) {
			const expected = expectedLines[index];
			const actual = actualLines[index];
			this.add(`line ${index + 1}: ${actual}`, () => {
				try {
					switch (typeof expected) {
					case 'function':
						assert(expected(actual));
						break;
					case 'string':
						assert.equal(actual, expected);
						break;
					default:
						if (typeof expected.test === 'function') {
							assert(expected.test(actual));
						}
					}
				} catch (error) {
					throw Object.assign(error, {actual, expected});
				}
			});
		}
	}

};
