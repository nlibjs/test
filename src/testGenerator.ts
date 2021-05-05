import ava from 'ava';
import {serialize} from './serialize';
import type {GeneratorItem, GeneratorTestee} from './type';
import {getFunctionTestPrefix} from './getFunctionTestPrefix';

export const testGenerator = <Fn extends GeneratorTestee>(testee: Fn, ...args: [...Parameters<Fn>, Array<GeneratorItem<Fn>>]) => {
    const items = args.pop() as Array<GeneratorItem<Fn>>;
    ava(
        `${getFunctionTestPrefix(testee, args)}${args.map((value) => `→${serialize(value)}`)}`,
        async (t) => {
            const generator = await Promise.resolve(testee(...args));
            for (const value of items) {
                t.deepEqual(await generator.next(), {done: false, value});
            }
            t.deepEqual(await generator.next(), {done: true, value: undefined});
        },
    );
};
