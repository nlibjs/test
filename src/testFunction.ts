import ava from 'ava';
import type {ThrowsExpectation} from 'ava';
import {serialize} from './serialize';
import {getTestId} from './getTestId';

interface SingleParameterTestCase<V> {
    input: unknown,
    expected: V,
}

interface SingleParameterLikeTestCase<V> {
    input: unknown,
    like: Partial<V>,
}

interface SingleParameterErrorTestCase {
    input: unknown,
    error: ThrowsExpectation,
}

interface MultipleParametersTestCase<V> {
    parameters: Array<unknown>,
    expected: V,
}

interface MultipleParametersLikeTestCase<V> {
    parameters: Array<unknown>,
    like: Partial<V>,
}

interface MultipleParametersErrorTestCase {
    parameters: Array<unknown>,
    error: ThrowsExpectation,
}

type TestCase<V> =
| MultipleParametersErrorTestCase
| MultipleParametersLikeTestCase<V>
| MultipleParametersTestCase<V>
| SingleParameterErrorTestCase
| SingleParameterLikeTestCase<V>
| SingleParameterTestCase<V>;

const serializeFunctionTestName = function* <V>(
    testee: (...args: Array<unknown>) => (Promise<V> | V),
    params: Array<unknown>,
    test: TestCase<V>,
): Generator<string> {
    yield `#${getTestId()} ${testee.name}(${serialize(params).slice(1, -1).trim()}) → `;
    if ('expected' in test) {
        yield serialize(test.expected);
    } else if ('like' in test) {
        yield serialize(test.like);
    } else {
        yield `Error ${serialize(test.error)}`;
    }
};

export const testFunction = <V>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testee: (...args: Array<any>) => (Promise<V> | V),
    testCase: TestCase<V>,
) => {
    const params = 'input' in testCase ? [testCase.input] : testCase.parameters;
    ava(
        [...serializeFunctionTestName(testee, params, testCase)].join(''),
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
