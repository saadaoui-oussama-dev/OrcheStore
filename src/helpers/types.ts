/**
 * Convenience alias for `Record<PropertyKey, T>`.
 *
 * Used throughout the library to represent object-like types
 * without repeating the full `Record` declaration.
 */
export type Obj<Value = any> = Record<PropertyKey, Value>;

/**
 * Removes the first parameter from a function parameter tuple.
 *
 * Primarily used to omit framework-injected parameters when exposing
 * public APIs. For example, mutation functions receive a draft state
 * as their first parameter internally, while the corresponding runtime
 * methods expose only the user-defined arguments.
 */
export type Tail<T extends any[]> = T extends [any, ...infer R] ? R : T extends (infer U)[] ? U[] : never;

/**
 * Removes properties whose resolved value type is `never`.
 *
 * Primarily used to eliminate conditional mapped properties that
 * are intentionally excluded during type construction.
 */
export type OmitNever<T> = {
	[K in keyof T as T[K] extends never ? never : K]: T[K];
};

/**
 * Recursively applies readonly semantics to object properties and
 * array elements while preserving function types unchanged.
 */
export type ReadOnly<T> = T extends (...args: any[]) => any
	? T
	: T extends object
		? { readonly [K in keyof T]: ReadOnly<T[K]> }
		: T;

export type * from "../factory/types";
export type * from "../utils/types";
export type * from "../store/types";
export type * from "../slice/types";
export type * from "../slice/types-listeners";
