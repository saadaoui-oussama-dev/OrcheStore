type Dict<Value = any> = Record<string | number | symbol, Value>;

type Tail<T extends any[]> = T extends [any, ...infer R] ? R : T extends (infer U)[] ? U[] : never;

type DeepReadonly<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly (infer U)[]
  ? ReadonlyArray<DeepReadonly<U>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

export type { Dict, Tail, DeepReadonly };
