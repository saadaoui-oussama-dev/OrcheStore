import type { Dict, Utils, Obj, OmitNever, ReadOnly, Store, Tail } from "./internal";

/** Runtime slice API exposed by createSlice(...). */
type slice<S extends Obj, R extends Mutations<S, C>, M, C> = Utils & {
	/** Unique slice identifier. */
	readonly name: string;

	/** Fully qualified runtime path of the slice. */
	readonly path: string;

	/** Root store that owns this slice instance. */
	root: Store<any>;

	/** Parent slice in the hierarchy, if mounted under another slice. */
	parent: slice<any, Mutations<any, any>, any, any> | undefined;

	/** Subscribes to state changes within React components. Runs with a context-bound `this` containing `root` store, `rootState` and `utils` utilities. */
	readonly useSelect: <T>(selector: (this: Utils, state: SliceState.State<S, C>, context: Utils) => T) => T;

	/** Returns the latest immutable state snapshot including all nested child slices. */
	readonly getState: {
		/** Returns the latest immutable state snapshot including all nested child slices. */
		(): SliceState.State<S, C>;

		/** Returns the state created during slice initialization. */
		readonly initial: () => SliceState.State<S, {}>;

		/** Returns the initial state including all nested child slices. */
		readonly initialDeep: () => SliceState.State<S, C>;
	};

	/** Runtime lineage and cloning utilities for this slice instance. */
	readonly prototype: {
		/** Creates a new detached clone within the same lineage. */
		readonly clone: (stateTransformer?: CloneArgs<S, C>["transform"]) => slice<S, R, M, C>;

		/** Returns all slice instances in the same lineage, including this one. */
		readonly getLineage: () => slice<S, R, M, C>[];

		/** Returns all sibling instances in the same lineage, excluding this one. */
		readonly getClones: () => slice<S, R, M, C>[];

		/** Returns true if both slices belong to the same lineage. */
		readonly isTypeOf: (other?: any) => boolean;
	};

	/** Collection of derived state functions. */
	readonly computed: undefined;
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
	state?: S | (() => S);

	/** Collection of synchronous state transition functions. */
	mutations?: R & ThisType<Utils>;

	/** Collection of slice methods and orchestration logic. */
	methods?: M & ThisType<slice<S, R, M, C>>;

	/** Collection of derived state functions. */ // TODO: Including root, and child slices.
	// computed?: G & ThisType<Utils & Omit<G, "utils">>;

	/** Collection of nested child slices. */
	children?: C;
};

/** Defines the mutations available on a slice. */
type Mutations<S extends Obj, C> = Dict<
	(state: SliceState.Draft<S, C>, ...args: any[]) => void | SliceState.Draft<S, C>
>;

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
	| ("name" | "path" | "computed" | "root" | "parent" | "prototype" | "utils" | "getState" | "useSelect")
	| (keyof R | keyof M);

type AnySlice = slice<any, Mutations<any, any>, any, any>;

type AnySliceOptions = sliceOptions<any, Mutations<any, any>, any, any>;

type CloneArgs<S extends Obj, C> = {
	/** Identifies the originating slice for validation and tracking issues source. */
	name?: string;

	/** Provides an explicit state object to use instead of deriving state from the origin slice. */
	object?: Obj;

	/** Transforms the source slice state before it is assigned to the cloned slice. */
	transform?: (state: SliceState.Draft<S, C>) => void | SliceState.Draft<S, C>;
};

export type { slice as Slice, sliceOptions as SliceOptions, SliceState, Mutations, AnySlice, AnySliceOptions, CloneArgs }; // prettier-ignore
