import * as util from 'util';
import ava from 'ava';
import type {ThrowsExpectation} from 'ava';

export interface SingleParameterTestCase<V> {
    input: any,
    expected: V,
}

export interface SingleParameterLikeTestCase<V> {
    input: any,
    like: Partial<V>,
}

export interface SingleParameterErrorTestCase {
    input: any,
    error: ThrowsExpectation,
}

export interface MultipleParametersTestCase<V> {
    parameters: Array<any>,
    expected: V,
}

export interface MultipleParametersLikeTestCase<V> {
    parameters: Array<any>,
    like: Partial<V>,
}

export interface MultipleParametersErrorTestCase {
    parameters: Array<any>,
    error: ThrowsExpectation,
}

export type TestCase<V> =
| MultipleParametersErrorTestCase
| MultipleParametersLikeTestCase<V>
| MultipleParametersTestCase<V>
| SingleParameterErrorTestCase
| SingleParameterLikeTestCase<V>
| SingleParameterTestCase<V>;

const stringify = (value: unknown): string => util.inspect(value, {breakLength: 60, depth: null});

let count = 0;
const serializeTestName = function* <V>(
    testee: (...args: Array<any>) => (Promise<V> | V),
    params: Array<any>,
    test: TestCase<V>,
): Generator<string> {
    yield `#${++count} ${testee.name}(${stringify(params).slice(1, -1).trim()}) → `;
    if ('expected' in test) {
        yield stringify(test.expected);
    } else if ('like' in test) {
        yield stringify(test.like);
    } else {
        yield `Error ${stringify(test.error)}`;
    }
};

export const testFunction = <V>(
    testee: (...args: Array<any>) => (Promise<V> | V),
    testCase: TestCase<V>,
) => {
    const params = 'input' in testCase ? [testCase.input] : testCase.parameters;
    ava(
        [...serializeTestName(testee, params, testCase)].join(''),
        async (t) => {
            if ('expected' in testCase) {
                t.deepEqual(await testee(...params), testCase.expected);
            } else if ('like' in testCase) {
                t.like(await testee(...params), testCase.like);
            } else {
                await t.throwsAsync(
                    async () => await testee(...params),
                    testCase.error,
                );
            }
        },
    );
};
