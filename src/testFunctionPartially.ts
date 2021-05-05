import ava from 'ava';
import type {ResolvedValue, Testee} from './type';
import {serialize} from './serialize';
import {getFunctionTestPrefix} from './getFunctionTestPrefix';

export const testFunctionPartially = <Fn extends Testee>(testee: Fn, ...args: [...Parameters<Fn>, Partial<ResolvedValue<ReturnType<Fn>>>]) => {
    const result = args.pop();
    ava(
        `${getFunctionTestPrefix(testee, args)}→${serialize(result)}`,
        async (t) => t.like(await testee(...args), result as Record<string, unknown>),
    );
};
