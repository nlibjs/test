import ava from 'ava';
import type {ThrowsExpectation} from 'ava';
import {getTestId} from './getTestId';
import {serialize} from './serialize';

interface SingleParameterTestCase<V, R> {
    input: unknown,
    expected: Array<{error: ThrowsExpectation} | {value: V}>,
    return?: R,
}

interface SingleParameterErrorTestCase {
    input: unknown,
    error: ThrowsExpectation,
}

interface MultipleParametersTestCase<V, R> {
    parameters: Array<unknown>,
    expected: Array<{error: ThrowsExpectation} | {value: V}>,
    return?: R,
}

interface MultipleParametersErrorTestCase {
    parameters: Array<unknown>,
    error: ThrowsExpectation,
}

type TestCase<V, R> =
| MultipleParametersErrorTestCase
| MultipleParametersTestCase<V, R>
| SingleParameterErrorTestCase
| SingleParameterTestCase<V, R>;

type GeneratorLike<V, R> = AsyncGenerator<V, R> | Generator<V, R>;

const serializeGeneratorTestName = function* <V, R>(
    testee: (...args: Array<unknown>) => (GeneratorLike<V, R> | Promise<GeneratorLike<V, R>>),
    params: Array<unknown>,
    test: TestCase<V, R>,
): Generator<string> {
    yield `#${getTestId()} ${testee.name}(${serialize(params).slice(1, -1).trim()}) `;
    if ('expected' in test) {
        const {expected} = test;
        const {length} = expected;
        for (let index = 0; index < length; index++) {
            const item = expected[index];
            if ('value' in item) {
                yield `→${serialize(item.value)}`;
            } else {
                yield `→Error ${serialize(item.error)}`;
            }
        }
    } else {
        yield `→ Error ${serialize(test.error)}`;
    }
};

export const testGenerator = <V, R>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    testee: (...args: Array<any>) => (GeneratorLike<V, R> | Promise<GeneratorLike<V, R>>),
    testCase: TestCase<V, R>,
) => {
    const params = 'input' in testCase ? [testCase.input] : testCase.parameters;
    ava(
        [...serializeGeneratorTestName(testee, params, testCase)].join(''),
        async (t) => {
            if ('expected' in testCase) {
                const {expected} = testCase;
                const {length} = expected;
                const generator = await testee(...params);
                for (let index = 0; index < length; index++) {
                    const item = expected[index] as {error: ThrowsExpectation} | {value: R | V | undefined} | undefined;
                    if (!item) {
                        t.deepEqual(await generator.next(), {value: testCase.return as R, done: true});
                    } else if ('value' in item) {
                        t.deepEqual(await generator.next(), {value: item.value as V, done: false});
                    } else {
                        await t.throwsAsync(async () => {
                            await generator.next();
                        });
                    }
                }
            } else {
                const items: Array<unknown> = [];
                await t.throwsAsync(
                    async () => {
                        for await (const item of await testee(...params)) {
                            items.push(item);
                        }
                    },
                    testCase.error,
                );
                t.is(items.length, 0);
            }
        },
    );
};
