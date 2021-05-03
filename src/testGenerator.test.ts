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
