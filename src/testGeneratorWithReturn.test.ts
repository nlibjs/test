import {testGeneratorWithReturn} from './testGeneratorWithReturn';

testGeneratorWithReturn(
    function* () {
        yield 1;
        yield -1;
        return 'OK';
    },
    [1, -1],
    'OK',
);
testGeneratorWithReturn(
    async function* () {
        yield 1;
        yield await Promise.resolve(-1);
        return await Promise.resolve('OK');
    },
    [1, -1],
    'OK',
);
