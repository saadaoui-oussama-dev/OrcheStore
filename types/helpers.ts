/** String-keyed object map. */
type Dict<Value = any> = Record<string, Value>;

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

export type { Dict, Tail, OmitNever, ReadOnly };
