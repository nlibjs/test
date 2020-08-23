import ava, {ThrowsExpectation} from 'ava';

export interface SingleParameterTestCase<V> {
    input: any,
    expected: V,
}

export interface SingleParameterErrorTestCase {
    input: any,
    error: ThrowsExpectation,
}

export interface MultipleParametersTestCase<V> {
    parameters: Array<any>,
    expected: V,
}

export interface MultipleParametersErrorTestCase {
    parameters: Array<any>,
    error: ThrowsExpectation,
}

export type TestCase<V> =
| SingleParameterTestCase<V>
| SingleParameterErrorTestCase
| MultipleParametersTestCase<V>
| MultipleParametersErrorTestCase;

let count = 0;
export const testFunction = <V>(
    testee: (...args: Array<any>) => (V | Promise<V>),
    testCase: TestCase<V>,
) => {
    const params = 'input' in testCase ? [testCase.input] : testCase.parameters;
    ava(
        [
            `#${++count}`,
            `${testee.name}(${JSON.stringify(params).slice(1, -1)})`,
            '→',
            'expected' in testCase ? testCase.expected : `Error${JSON.stringify(testCase.error)}`,
        ].join(' '),
        async (t) => {
            if ('expected' in testCase) {
                t.deepEqual(await testee(...params), testCase.expected);
            } else {
                await t.throwsAsync(
                    async () => await testee(...params),
                    testCase.error,
                );
            }
        },
    );
};
