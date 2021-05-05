import ava from 'ava';
import {serialize} from './serialize';
import type {GeneratorWithReturnTestee} from './type';
import {getFunctionTestPrefix} from './getFunctionTestPrefix';

export const testGeneratorWithReturn = <Item, Return, Fn extends GeneratorWithReturnTestee<Item, Return>>(testee: Fn, ...args: [...Parameters<Fn>, Array<Item>, Return]) => {
    const returnValue = args.pop() as Return;
    const items = args.pop() as Array<Item>;
    ava(
        `${getFunctionTestPrefix(testee, args)}${items.map((value) => `→${serialize(value)}`)}→Return:${serialize(returnValue)}`,
        async (t) => {
            const generator = await Promise.resolve(testee(...args));
            for (const value of items) {
                t.deepEqual(await generator.next(), {done: false, value});
            }
            t.deepEqual(await generator.next(), {done: true, value: returnValue});
        },
    );
};
