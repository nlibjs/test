import {testFunction} from './testFunction';

const singleSyncTestee = (input: number) => {
    if (input < 10) {
        return input * 2;
    }
    throw new Error(`Input:${input}`);
};
testFunction(singleSyncTestee, {input: 5, expected: 10});
testFunction(singleSyncTestee, {input: 10, error: {message: 'Input:10'}});

const singleLikeSyncTestee = (input: number) => {
    if (input < 10) {
        return {result1: input, result2: input * 2, result3: input * 3};
    }
    throw new Error(`Input:${input}`);
};
testFunction(singleLikeSyncTestee, {input: 5, like: {result1: 5, result2: 10}});
testFunction(singleLikeSyncTestee, {input: 10, error: {message: 'Input:10'}});

const multipleSyncTestee = (input1: number, input2: number) => {
    if (input1 < 10) {
        return input1 + input2;
    }
    throw new Error(`Input:${input1},${input2}`);
};
testFunction(multipleSyncTestee, {parameters: [1, 2], expected: 3});
testFunction(multipleSyncTestee, {parameters: [10, 11], error: {message: 'Input:10,11'}});

const singleAsyncTestee = async (input: number) => {
    await Promise.resolve(input);
    if (input < 10) {
        return input * 2;
    }
    throw new Error(`Input:${input}`);
};
testFunction(singleAsyncTestee, {input: 5, expected: 10});
testFunction(singleAsyncTestee, {input: 10, error: {message: 'Input:10'}});

const multipleAsyncTestee = async (input1: number, input2: number) => {
    await Promise.resolve(input1);
    if (input1 < 10) {
        return input1 + input2;
    }
    throw new Error(`Input:${input1},${input2}`);
};
testFunction(multipleAsyncTestee, {parameters: [1, 2], expected: 3});
testFunction(multipleAsyncTestee, {parameters: [10, 11], error: {message: 'Input:10,11'}});
