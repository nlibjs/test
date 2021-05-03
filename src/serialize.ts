import * as util from 'util';

export const serialize = (value: unknown): string => util.inspect(value, {breakLength: 60, depth: null});
