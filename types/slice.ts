import type { AnyStore } from "./store";
import type { DeepReadonly, Dict, Tail } from "./helpers";
import type { GlobalUtils, RootStore } from "./slots";

/** Reserved slice member names that cannot be overridden by user-defined APIs. */
type ReservedKeys<R = {}, M = {}> = "name" | "computed" | "root" | "global" | "getState" | "useSelect" | "getPath" | keyof R | keyof M; // prettier-ignore

/** Defines the mutations available on a slice. */
export type Mutations<S extends Dict> = Dict<(state: Omit<S, "computed" | "children">, ...args: any[]) => void>;

/** Defines the computed functions available on a slice. */
export type Computed<S extends Dict, C extends Dict> = Dict<(state: ExposedState<S, C>, ...args: any[]) => any>;

/** Defines the methods available on a slice with contextual `this` typing. */
export type Methods = Dict<(...args: any[]) => any>;

// TODO: Include nested child slice states in the exposed state shape.
/** Exposes immutable slice state with optional runtime helpers. */
export type ExposedState<S extends Dict, C extends Dict<AnySlice>> = DeepReadonly<Omit<S, "computed" | "children">>;

export type AnySlice = slice<any, any, any, any, any>;

/** Runtime slice API exposed by createSlice(...). */
type slice<
	S extends Dict,
	R extends Mutations<S>,
	M extends Methods,
	C extends Dict<AnySlice>,
	G extends Computed<S, C>,
	N extends string = string,
> = {
	/** Unique slice identifier. */
	readonly name: N;

	/** Application-wide global utilities. */
	readonly global: GlobalUtils;

	/** Collection of derived state functions. */
	readonly computed: {
		readonly [K in keyof G]: (...args: Tail<Parameters<G[K]>>) => ReturnType<G[K]>;
	};

	/** Returns the latest immutable state snapshot. */
	readonly getState: (store?: slice<any, any, any, any, any>) => ExposedState<S, C>;

	/** Subscribes to state changes within React components. Runs with a context-bound `this` containing `root` store, `rootState` and `global` utilities. */
	readonly useSelect: {
		<T, Store extends AnyStore = RootStore>(
			selector: (this: UseSelectContext<Store>, state: ExposedState<S, C>, context: UseSelectContext<any>) => T,
		): T;
	};

	/** Returns fully qualified runtime path of the slice. */
	readonly getPath: (store?: slice<any, any, any, any, any>) => string;
} & {
	/** Exposed mutation functions. */
	readonly [K in Exclude<keyof R, ReservedKeys>]: (...args: Tail<Parameters<R[K]>>) => ReturnType<R[K]>;
} & {
	/** Exposed method functions. */
	readonly [K in Exclude<keyof M, ReservedKeys<R>>]: M[K];
} & {
	/** Exposed child slices. */
	readonly [K in Exclude<keyof C, ReservedKeys<R, M>>]: C[K];
};

/** Configuration object used to create a slice. */
type sliceOptions<
	S extends Dict,
	R extends Mutations<S>,
	M extends Methods,
	C extends Dict<AnySlice>,
	G extends Computed<S, C>,
	N extends string = string,
> = {
	/** Unique slice identifier. */
	name: N;

	/** Initial state object or lazy state initializer. */
	state: S | (() => S);

	/** Collection of synchronous state transition functions. */
	mutations: R;

	// TODO: Add runtime helpers to `this`, including root, computed, and child slices.
	/** Collection of derived state functions. */
	computed?: G & ThisType<G>;

	/** Collection of slice methods and orchestration logic. */
	methods?: M & ThisType<slice<S, R, M, C, G, N> & { root: RootStore }>;

	/** Collection of nested child slices. */
	children?: C;
};

/** Context available inside `useSelect`, providing access to the root store, root state snapshot, and global utilities. */
export type UseSelectContext<Store extends AnyStore> = {
	/** Root store instance. */
	root: Store;

	/** Latest root state snapshot. */
	rootState: ReturnType<Store["getState"]>;

	/** Global utilities shared across slices. */
	global: GlobalUtils;
};

export type SliceData = {
	slice: AnySlice;
	redux: any;
	children: Dict<AnySlice>;
	path: string;
	exposedIn: AnyStore[];
};

export type { slice as Slice, sliceOptions as SliceOptions };
