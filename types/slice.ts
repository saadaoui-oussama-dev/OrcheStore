import type { Dict, GlobalUtils, Obj, OmitNever, ReadOnly, RootStore, Tail } from "./internal";

/** Runtime slice API exposed by createSlice(...). */
type slice<S extends Obj, R extends Mutations<S, C>, M, C> = GlobalUtils & {
	/** Unique slice identifier. */
	readonly name: string;

	/** Fully qualified runtime path of the slice. */
	readonly path: string;

	/** Returns the latest immutable state snapshot. */
	readonly getState: () => SliceState.State<S, C>;

	/** Subscribes to state changes within React components. Runs with a context-bound `this` containing `root` store, `rootState` and `global` utilities. */
	readonly useSelect: <T>(selector: (this: GlobalUtils, state: SliceState.State<S, C>, context: GlobalUtils) => T) => T;

	/** Collection of derived state functions. */
	// readonly computed: {
	// 	readonly [K in keyof G]: (...args: Tail<Parameters<G[K]>>) => ReturnType<G[K]>;
	// };
} & OmitNever<{
		/** Exposed mutation functions. */
		readonly [K in Exclude<keyof R, ReservedSliceKeys>]: R[K] extends (...args: any[]) => void
			? (...args: Tail<Parameters<R[K]>>) => void
			: never;
	}> &
	OmitNever<{
		/** Exposed method functions. */
		readonly [K in Exclude<keyof M, ReservedSliceKeys<R>>]: M[K] extends (...args: any[]) => void ? M[K] : never;
	}> &
	OmitNever<{
		/** Exposed children. */
		readonly [K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends slice<infer S, infer R, infer M, infer C>
			? slice<S, R, M, C>
			: never;
	}>;

/** Configuration object used to create a slice. */
type sliceOptions<S extends Obj, R extends Mutations<S, C>, M, C> = {
	/** Unique slice identifier. */
	name: string;

	/** Initial state object or lazy state initializer. */
	state: S | (() => S);

	/** Collection of synchronous state transition functions. */
	mutations?: R & ThisType<GlobalUtils>;

	/** Collection of slice methods and orchestration logic. */
	methods?: M & ThisType<slice<S, R, M, C> & { root: RootStore }>;

	/** Collection of derived state functions. */ // TODO: Including root, and child slices.
	// computed?: G & ThisType<GlobalUtils & Omit<G, "global">>;

	/** Collection of nested child slices. */
	children?: C;
};

/** Defines the mutations available on a slice. */
type Mutations<S extends Obj, C> = Dict<(state: SliceState.Draft<S, C>, ...args: any[]) => void | S>;

/** Derived state shape exposed by a slice, excluding internal framework fields. */
namespace SliceState {
	type InferState<C> = C extends Obj ? (C["getState"] extends () => infer S ? S extends Obj ? S : never : never) : never; // prettier-ignore

	export type State<S extends Obj, C> = ReadOnly<
		Omit<S, "computed" | keyof OmitNever<{ [K in keyof C]: InferState<C[K]> }>> &
			OmitNever<{ [K in keyof C]: InferState<C[K]> }>
	>;

	export type Draft<S extends Obj, C> = Omit<
		S,
		"computed" | keyof OmitNever<{ [K in keyof C]: C[K] extends AnySlice ? true : never }>
	> &
		OmitNever<{ [K in keyof C]: C[K] extends slice<infer S, infer _, infer __, infer C> ? Draft<S, C> : never }>;
}

/** Reserved slice member names that cannot be overridden by user-defined APIs. */
type ReservedSliceKeys<R = {}, M = {}> =
	| ("name" | "path" | "computed" | "root" | "global" | "children" | "getState" | "useSelect")
	| (keyof R | keyof M);

type AnySlice = slice<any, Mutations<any, any>, any, any>;

type AnySliceOptions = sliceOptions<any, Mutations<any, any>, any, any>;

export type { slice as Slice, sliceOptions as SliceOptions, SliceState, Mutations, AnySlice, AnySliceOptions };
