import type {ThrowsExpectation} from 'ava';
import ava from 'ava';
import type {Testee} from './type';
import {serialize} from './serialize';
import {getFunctionTestPrefix} from './getFunctionTestPrefix';

export const testFunctionError = <Fn extends Testee>(testee: Fn, ...args: [...Parameters<Fn>, ThrowsExpectation]) => {
    const error = args.pop() as ThrowsExpectation;
    ava(
        `${getFunctionTestPrefix(testee, args)}→Error(${serialize(error)})`,
        async (t) => {
            await t.throwsAsync(async () => {
                await testee(...args);
            }, error);
        },
    );
};
