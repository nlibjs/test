export interface Testee<ReturnType = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: Array<any>): ReturnType,
}

export type ResolvedValue<T> = T extends Promise<infer V> ? V : T;
