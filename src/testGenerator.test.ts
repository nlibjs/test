import {testGenerator} from './testGenerator';

testGenerator(
    function* () {
        yield 1;
        yield -1;
    },
    [1, -1],
);
testGenerator(
    async function* () {
        yield 1;
        yield await Promise.resolve(-1);
    },
    [1, -1],
);
