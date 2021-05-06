import ava from 'ava';
import {serialize} from './serialize';
import type {GeneratorTestee} from './type';
import {getFunctionTestPrefix} from './getFunctionTestPrefix';

export const testGenerator = <Item, Fn extends GeneratorTestee<Item>>(testee: Fn, ...args: [...Parameters<Fn>, Array<Item>]) => {
    const items = args.pop() as Array<Item>;
    ava(
        `${getFunctionTestPrefix(testee, args)}${items.map((value) => `→${serialize(value)}`)}`,
        async (t) => {
            const generator = await Promise.resolve(testee(...args));
            for (const value of items) {
                t.deepEqual(await generator.next(), {done: false, value});
            }
            t.deepEqual(await generator.next(), {done: true, value: undefined});
        },
    );
};
