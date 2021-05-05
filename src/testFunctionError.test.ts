import {testFunctionError} from './testFunctionError';

const syncObjectTestee = (...args: Array<number>) => {
    throw new Error(`OK: ${args.join(', ')}`);
};
testFunctionError(syncObjectTestee, 5, 7, {message: 'OK: 5, 7'});

const asyncObjectTestee = async (...args: Array<number>) => {
    await Promise.resolve();
    throw new Error(`OK: ${args.join(', ')}`);
};
testFunctionError(asyncObjectTestee, 5, 7, {message: 'OK: 5, 7'});
