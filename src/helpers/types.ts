/** `Record` with string keys, requiring only the value type. */
type Dict<Value = any> = Record<string, Value>;

/** `Record` with default property keys, requiring only the value type. */
type Obj<Value = any> = Record<PropertyKey, Value>;

/** Returns all tuple elements except the first. */
type Tail<T extends any[]> = T extends [any, ...infer R] ? R : T extends (infer U)[] ? U[] : never;

/** Removes properties whose value type is `never`. */
type OmitNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K];
};

/** Recursively makes all object properties and array elements readonly. */
type ReadOnly<T> = T extends (...args: any[]) => any
	? T
	: T extends readonly (infer U)[]
		? ReadonlyArray<ReadOnly<U>>
		: T extends object
			? { readonly [K in keyof T]: ReadOnly<T[K]> }
			: T;

export type { Dict, Obj, OmitNever, ReadOnly, Tail };

export type * from "../factory/types";
export type * from "../utils/types";
export type * from "../store/types";
export type * from "../slice/types";
export type * from "../slice/types-listeners";
