import {testFunctionPartially} from './testFunctionPartially';

const syncObjectTestee = (...args: Array<number>) => {
    const sum = args.reduce((s, value) => s + value, 0);
    const mean = sum / args.length;
    return {sum, mean};
};
testFunctionPartially(syncObjectTestee, 5, {sum: 5, mean: 5});
testFunctionPartially(syncObjectTestee, 5, 7, {sum: 12, mean: 6});
testFunctionPartially(syncObjectTestee, 5, {sum: 5});
testFunctionPartially(syncObjectTestee, 5, 7, {sum: 12});
testFunctionPartially(syncObjectTestee, 5, {mean: 5});
testFunctionPartially(syncObjectTestee, 5, 7, {mean: 6});

const asyncObjectTestee = async (...args: Array<number>) => {
    await Promise.resolve();
    const sum = args.reduce((s, value) => s + value, 0);
    const mean = sum / args.length;
    return {sum, mean};
};
testFunctionPartially(asyncObjectTestee, 5, {sum: 5, mean: 5});
testFunctionPartially(asyncObjectTestee, 5, 7, {sum: 12, mean: 6});
testFunctionPartially(asyncObjectTestee, 5, {sum: 5});
testFunctionPartially(asyncObjectTestee, 5, 7, {sum: 12});
testFunctionPartially(asyncObjectTestee, 5, {mean: 5});
testFunctionPartially(asyncObjectTestee, 5, 7, {mean: 6});
