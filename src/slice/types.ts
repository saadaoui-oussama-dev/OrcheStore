import type { RTKSlice, RTKReducer } from "../helpers/imports";
import type { Dict, Utils, Obj, OmitNever, ReadOnly, Store, Tail, ListenersBuilder } from "../helpers/types";
import type { NodeMeta, NodePrototype } from "../helpers/types";

/** Runtime API returned by `createSlice()`. */
type slice<S extends Obj, R extends Mutations<S, C>, M, C> = Utils & {
	/** Unique name of the slice. */
	readonly name: string;

	/** Dot-separated path of this slice within the mounted store tree. */
	readonly path: string;

	/** Root store instance that owns this slice. */
	root: Store<any>;

	/** Parent slice in the runtime tree, or `undefined` if this is a root slice. */
	parent: slice<any, Mutations<any, any>, any, any> | undefined;

	/**
	 * Subscribes to this slice's state changes inside React components.
	 *
	 * The selector receives:
	 * - full store state
	 * - runtime utilities context
	 *
	 * The hook is context-bound to the store instance.
	 *
	 * The hook rely on utilizing StoreProvider being present in the component tree.
	 */
	readonly useSelect: <T>(selector: (this: Utils, state: SliceState.State<S, C>, context: Utils) => T) => T;

	/**
	 * Returns the current immutable state snapshot of the slice.
	 *
	 * Includes all mounted child slices and nested state.
	 */
	readonly getState: () => SliceState.State<S, C>;

	/**
	 * Returns the slice's original initial state.
	 *
	 * Does not include runtime updates or mutations.
	 */
	readonly getInitialState: {
		/**
		 * Returns the slice's original initial state.
		 *
		 * Does not include runtime updates or mutations.
		 */
		(): SliceState.State<S, {}>;

		/**
		 * Returns the complete initial state.
		 *
		 * Includes all mounted child slices and nested state.
		 */
		readonly deep: () => SliceState.State<S, C>;
	};

	/**
	 * Runtime utilities for cloning, family inspection,
	 * and instance identity.
	 */
	readonly family: NodePrototype<slice<S, R, M, C>, [CloneArgs<S, R, M, C>["transform"]]>;

	/** Collection of derived state functions. */
	readonly computed: undefined;
	// readonly computed: {
	// 	readonly [K in keyof G]: (...args: Tail<Parameters<G[K]>>) => ReturnType<G[K]>;
	// };
} & OmitNever<{
		/** Directly callable state mutation functions. */
		readonly [K in Exclude<keyof R, ReservedSliceKeys>]: R[K] extends (...args: any[]) => void
			? (...args: Tail<Parameters<R[K]>>) => void
			: never;
	}> &
	OmitNever<{
		/** User-defined instance methods. */
		readonly [K in Exclude<keyof M, ReservedSliceKeys<R>>]: M[K] extends (...args: any[]) => void ? M[K] : never;
	}> &
	OmitNever<{
		/** Nested child slice instances. */
		readonly [K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends slice<infer S, infer R, infer M, infer C>
			? slice<S, R, M, C>
			: never;
	}>;

/** Configuration used to create a slice definition. */
type sliceOptions<S extends Obj, R extends Mutations<S, C>, M, C> = {
	/** Unique name of the slice. */
	name: string;

	/**
	 * Initial state of the slice.
	 *
	 * May be an object or a lazy initializer returning the initial state.
	 *
	 * ```ts
	 * const counter = createSlice({
	 *   name: "counter",
	 *
	 *   state: {
	 *     value: 0,
	 *     loading: false,
	 *   },
	 * });
	 *
	 * const counter = createSlice({
	 *   name: "counter",
	 *
	 *   state: () => ({
	 *     value: computeInitialValue(),
	 *     loading: false,
	 *   }),
	 * });
	 *
	 * // Runtime usage
	 * counter.getState(); // current reactive snapshot
	 * counter.useSelect((state) => state.value); // React subscription
	 * counter.getInitialState(); // initial state only
	 * counter.getInitialState.deep(); // full tree initial state (including children)
	 * ```
	 */
	state?: S | (() => S);

	/**
	 * Collection of state mutation functions.
	 *
	 * Each mutation receives an Immer draft of the slice state and is exposed
	 * as a directly callable method on the created slice instance.
	 *
	 * ```ts
	 * mutations: {
	 *   increment(state, amount: number) {
	 *     state.value += amount;
	 *   }
	 * }
	 *
	 * // usage: without dispatch
	 * slice.increment(1);
	 * ```
	 */
	mutations?: R & ThisType<Utils>;

	/**
	 * Collection of user-defined instance methods.
	 *
	 * Methods are bound to the slice instance and can access:
	 * state, mutations, children, parent, root, and utils via `this`.
	 *
	 * ```ts
	 * methods: {
	 *   log() {
	 *     console.log(this.getState());
	 *   }
	 * }
	 *
	 * // usage:
	 * slice.log();
	 * ```
	 */
	methods?: M & ThisType<slice<S, R, M, C>>;

	/**
	 * Collection of child slices.
	 *
	 * Each child becomes a mounted runtime node under this slice.
	 *
	 * ```ts
	 * children: {
	 *   products: productsSlice,
	 *   categories: categoriesSlice,
	 * }
	 *
	 * // usage:
	 * shop.products.getState(); // access slice instance
	 * shop.getState().products; // access state subtree
	 * ```
	 */
	children?: C;

	/** Collection of derived state functions. */
	computed?: "Planned" | "Not Yet Supported";

	/**
	 * Registers mutation listeners for other slices.
	 *
	 * **Equivalent to:** `extraReducers` in Redux Toolkit, but uses a
	 * tree-oriented Builder API to first select slices, then register
	 * the mutations to observe.
	 *
	 * ```ts
	 * listeners(builder) {
	 *   builder.parent.on("refresh", (parent) => {
	 *     // ...
	 *   });
	 *
	 *   builder.slice("auth").on("login", (state, authSlice, user: User) => {
	 *     console.log("User logged in:", user);
	 *     state.users.active = user;
	 *   });
	 * }
	 * ```
	 *
	 * **Selection model**
	 *
	 * The `builder` parameter navigates the runtime slice tree in different ways:
	 *
	 * - `parent` / `parents` → observe ancestor slices.
	 * - `slice` / `slices` → observe slices selected by absolute paths.
	 * - `child` / `children` → observe slices relative to the current slice.
	 *
	 * Every selection can be refined through filtering or traversal before
	 * registering one or more mutation listeners with `.on(...)`.
	 *
	 * **Callbacks**
	 *
	 * Listener callbacks receive:
	 *
	 * - the draft state of the current slice
	 * - the slice that emitted the mutation
	 * - the original mutation arguments
	 *
	 * **Lifecycle**
	 *
	 * Listeners are automatically registered when the slice is mounted and
	 * automatically removed when the slice is unmounted.
	 */
	listeners?: (builder: ListenersBuilder<slice<S, R, M, C>>) => void;
};

/**
 * Collection of functions that update slice state.
 *
 * Mutations receive an Immer draft and may either mutate it
 * directly or return a replacement state.
 */
type Mutations<S extends Obj, C> = Dict<
	(state: SliceState.Draft<S, C>, ...args: any[]) => void | SliceState.Draft<S, C>
>;

/** Utilities for deriving the public and mutable state types associated with a slice. */
namespace SliceState {
	type InferState<C> = C extends Obj ? C["getState"] extends () => infer S ? S extends Obj ? S : never : never : never; // prettier-ignore

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

/**
 * Property names reserved by the framework.
 *
 * These names cannot be used for mutations,
 * methods, or child slices.
 */
type ReservedSliceKeys<R = {}, M = {}> =
	| (
			| "name"
			| "path"
			| "computed"
			| "root"
			| "parent"
			| "family"
			| "utils"
			| "getState"
			| "getInitialState"
			| "useSelect"
	  )
	| (keyof R | keyof M);

type AnySlice = slice<any, Mutations<any, any>, any, any>;

type AnySliceOptions = sliceOptions<any, Mutations<any, any>, any, any>;

type CloneArgs<S extends Obj = any, R extends Mutations<S, C> = any, M = any, C = any> = {
	/** Optional name used when reporting clone validation errors. */
	name?: string;

	/** Explicit state to assign to the cloned slice. */
	object?: Obj;

	/** Receives the cloned state before initialization, allowing it to be customized. */
	transform?: (
		nextProps: Pick<sliceOptions<S, R, M, C>, "name" | "mutations" | "methods">,
		state: SliceState.Draft<S, C>,
	) => void | SliceState.Draft<S, C>;
};

export type Meta = NodeMeta<AnySlice, AnySliceOptions, { redux: RTKSlice; reducer: RTKReducer }>;

export type { slice as Slice, sliceOptions as SliceOptions, SliceState, Mutations, AnySlice, AnySliceOptions, CloneArgs }; // prettier-ignore
