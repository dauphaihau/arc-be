import { ZodType, z } from 'zod';

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

type DeepNonNullable<T> = T extends (infer U)[]
  ? DeepNonNullable<U>[]
  : T extends object
    ? { [K in keyof T]: DeepNonNullable<T[K]> }
    : NonNullable<T>;

/*
 .partial() or optional(), they forcefully added | undefined
 ex: type T = { a?: string | undefined };

 so use custom infer to fix
 ex: type T = { a?: string };
 */
// https://github.com/colinhacks/zod/issues/1510
export type CustomZodInfer<T extends ZodType> = DeepNonNullable<z.infer<T>>;
