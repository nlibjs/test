import {testFunction} from './testFunction';

const syncPrimitiveTestee = (...args: Array<number>) => args.reduce((sum, value) => sum + value, 0);
testFunction(syncPrimitiveTestee, 5, 5);
testFunction(syncPrimitiveTestee, 5, 7, 12);

const asyncPrimitiveTestee = async (...args: Array<number>) => {
    await Promise.resolve();
    return args.reduce((sum, value) => sum + value, 0);
};
testFunction(asyncPrimitiveTestee, 5, 5);
testFunction(asyncPrimitiveTestee, 5, 7, 12);

const syncObjectTestee = (...args: Array<number>) => {
    const sum = args.reduce((s, value) => s + value, 0);
    const mean = sum / args.length;
    return {sum, mean};
};
testFunction(syncObjectTestee, 5, {sum: 5, mean: 5});
testFunction(syncObjectTestee, 5, 7, {sum: 12, mean: 6});

const asyncObjectTestee = async (...args: Array<number>) => {
    await Promise.resolve();
    const sum = args.reduce((s, value) => s + value, 0);
    const mean = sum / args.length;
    return {sum, mean};
};
testFunction(asyncObjectTestee, 5, {sum: 5, mean: 5});
testFunction(asyncObjectTestee, 5, 7, {sum: 12, mean: 6});
