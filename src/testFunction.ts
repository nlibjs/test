import ava, {ThrowsExpectation} from 'ava';

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
| SingleParameterTestCase<V>
| SingleParameterLikeTestCase<V>
| SingleParameterErrorTestCase
| MultipleParametersTestCase<V>
| MultipleParametersLikeTestCase<V>
| MultipleParametersErrorTestCase;


let count = 0;
export const getTestName = function* <V>(
    testee: (...args: Array<any>) => (V | Promise<V>),
    params: Array<any>,
    test: TestCase<V>,
): Generator<string> {
    yield `#${++count} ${testee.name}(`;
    const parameterString = JSON.stringify(params).slice(1, -1);
    yield 77 < parameterString.length ? `${parameterString.slice(0, 77)}...` : parameterString;
    yield ') → ';
    if ('expected' in test) {
        yield JSON.stringify(test.expected);
    } else if ('like' in test) {
        yield JSON.stringify(test.like);
    } else {
        yield `Error ${JSON.stringify(test.error)}`;
    }
};

export const testFunction = <V>(
    testee: (...args: Array<any>) => (V | Promise<V>),
    testCase: TestCase<V>,
) => {
    const params = 'input' in testCase ? [testCase.input] : testCase.parameters;
    ava(
        [...getTestName(testee, params, testCase)].join(''),
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
