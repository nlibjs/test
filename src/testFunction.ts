import ava from 'ava';
import type {ResolvedValue, Testee} from './type';
import {serialize} from './serialize';
import {getFunctionTestPrefix} from './getFunctionTestPrefix';

export const testFunction = <Fn extends Testee>(testee: Fn, ...args: [...Parameters<Fn>, ResolvedValue<ReturnType<Fn>>]) => {
    const result = args.pop();
    ava(
        `${getFunctionTestPrefix(testee, args)}→${serialize(result)}`,
        async (t) => t.deepEqual(await testee(...args), result),
    );
};
