import {testGenerator} from './testGenerator';

testGenerator(
    function* () {
        yield 1;
        yield -1;
        throw new Error('OK');
    },
    {
        parameters: [],
        expected: [
            {value: 1},
            {value: -1},
            {error: {message: 'OK'}},
        ],
    },
);

testGenerator(
    async function* () {
        yield 1;
        yield await Promise.resolve(-1);
        throw new Error('OK');
    },
    {
        parameters: [],
        expected: [
            {value: 1},
            {value: -1},
            {error: {message: 'OK'}},
        ],
    },
);

testGenerator(
    function* () {
        if (0 < Math.PI) {
            throw new Error('OK');
        }
        yield 1;
    },
    {
        parameters: [],
        error: {message: 'OK'},
    },
);
