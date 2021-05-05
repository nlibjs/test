import {serialize} from './serialize';

let count = 0;
export const getFunctionTestPrefix = (
    {name}: {name: string},
    parameters: Array<unknown>,
): string => `#${++count} ${name}(${parameters.map(serialize).join(', ')})`;
