export type UndefinableFields<T, Fields> = {
  [K in keyof T]: K extends Fields
    ? T[K] | undefined
    : T[K]
};

export type Override<
  T extends object, K extends { [P in keyof T]?: unknown }
> = Omit<T, keyof K> & K;

export type AtLeastOne<T> = { [K in keyof T]: Pick<T, K> }[keyof T];

export type ElementType<T extends Iterable<unknown>> = T extends Iterable<infer E>
  ? E
  : never;
