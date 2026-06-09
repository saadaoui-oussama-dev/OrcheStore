import type { Dict, GlobalUtils, ReadOnly, RootStore, Store, Tail } from "./internal";

/** Runtime slice API exposed by createSlice(...). */
type slice<S, R extends Mutations<S>, M> = GlobalUtils & {
	/** Unique slice identifier. */
	readonly name: string;

	/** Returns the latest immutable state snapshot. */
	readonly getState: () => SliceState<S, true>;

	/** Subscribes to state changes within React components. Runs with a context-bound `this` containing `root` store, `rootState` and `global` utilities. */
	readonly useSelect: <T>(selector: (this: GlobalUtils, state: SliceState<S, true>, context: GlobalUtils) => T) => T;

	/** Returns fully qualified runtime path of the slice. */
	readonly getPath: () => string;

	/** Collection of derived state functions. */
	// readonly computed: {
	// 	readonly [K in keyof G]: (...args: Tail<Parameters<G[K]>>) => ReturnType<G[K]>;
	// };
} & {
	/** Exposed mutation functions. */
	readonly [K in Exclude<keyof R, ReservedSliceKeys>]: (...args: Tail<Parameters<R[K]>>) => ReturnType<R[K]>;
} & {
	/** Exposed method functions. */
	readonly [K in Exclude<keyof M, ReservedSliceKeys<R>>]: M[K];
} & {
	/** Exposed children. */
	// readonly [K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K];
};

/** Configuration object used to create a slice. */
type sliceOptions<S, R extends Mutations<S>, M, Root = RootStore> = {
	/** Unique slice identifier. */
	name: string;

	/** Initial state object or lazy state initializer. */
	state: S | (() => S);

	/** Collection of synchronous state transition functions. */
	mutations?: R & ThisType<GlobalUtils>;

	/** Collection of slice methods and orchestration logic. */
	methods?: M & ThisType<slice<S, R, M> & { root: Root }>;

	/** Collection of derived state functions. */ // TODO: Including root, and child slices.
	// computed?: G & ThisType<GlobalUtils & Omit<G, "global">>;

	/** Collection of nested child slices. */
	// children?: C;
};

/** Defines the mutations available on a slice. */
type Mutations<S> = Dict<(state: SliceState<S, false>, ...args: any[]) => void>;

/** Derived state shape exposed by a slice, excluding internal framework fields. */
type SliceState<S, isReadOnly> = isReadOnly extends true
	? ReadOnly<S extends Dict ? Omit<S, "computed" | "children"> : S>
	: S extends Dict
		? Omit<S, "computed" | "children">
		: S;

/** Internal slice runtime state. Not intended for public use. */
type SliceData = {
	slice: slice<any, Mutations<any>, any>;
	redux: any;
	children: Dict<slice<any, Mutations<any>, any>>;
	path: string;
	roots: Store<any>[];
};

/** Reserved slice member names that cannot be overridden by user-defined APIs. */
type ReservedSliceKeys<R = {}, M = {}> =
	| ("name" | "computed" | "root" | "global" | "children" | "getState" | "useSelect" | "getPath")
	| (keyof R | keyof M);

export type { slice as Slice, sliceOptions as SliceOptions, SliceState, SliceData, Mutations };
