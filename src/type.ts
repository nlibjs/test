export interface Testee<Return = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: Array<any>): Return,
}
export interface GeneratorTestee<Item = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: Array<any>): AsyncGenerator<Item, void> | Generator<Item, void>,
}
export interface GeneratorWithReturnTestee<Item = unknown, Return = unknown> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: Array<any>): AsyncGenerator<Item, Return> | Generator<Item, Return>,
}
export type ResolvedValue<T> = T extends Promise<infer V> ? V : T;
