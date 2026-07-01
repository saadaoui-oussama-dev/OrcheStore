import type { RTKSlice, RTKReducer } from "../helpers/imports";
import type { Dict, Utils, Obj, OmitNever, ReadOnly, Store, Tail, ListenersBuilder } from "../helpers/types";
import type { NodeMeta, NodePrototype } from "../helpers/types";

/** Runtime API returned by `createSlice()`. */
type slice<S extends Obj, R extends Mutations<S, M, C>, M, C> = Utils & {
	/** Unique name of the slice. */
	readonly name: string;

	/** Dot-separated path of this slice within the mounted store tree. */
	readonly path: string;

	/** Root store instance that owns this slice. */
	root: Store<any>;

	/** Parent slice in the runtime tree, or `undefined` if this is a root slice. */
	parent: slice<any, Mutations<any, any, any>, any, any> | undefined;

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
	readonly useSelect: <T>(selector: (this: Utils, state: SliceState<S, R, M, C>, context: Utils) => T) => T;

	/**
	 * Returns the current immutable state snapshot of the slice.
	 *
	 * Includes all mounted child slices and nested state.
	 */
	readonly getState: () => SliceState<S, R, M, C>;

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
		(): SliceState<S, R, M, {}>;

		/**
		 * Returns the complete initial state.
		 *
		 * Includes all mounted child slices and nested state.
		 */
		readonly deep: () => SliceState<S, R, M, C>;
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
type sliceOptions<S extends Obj, R extends Mutations<S, M, C>, M, C> = {
	/** Unique name of the slice. */
	name: string;

	/**
	 * Initial state of the slice.
	 *
	 * Can be provided as a plain object:
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
	 * ```
	 *
	 * Or as a factory function, which is invoked once during
	 * initialization:
	 *
	 * ```ts
	 * const counter = createSlice({
	 *   name: "counter",
	 *
	 *   state: function () {
	 *     return {
	 *       value: computeInitialValue(),
	 *       loading: false,
	 *     };
	 *   },
	 * });
	 * ```
	 *
	 * Runtime usage:
	 *
	 * ```ts
	 * counter.getState();             // Current state
	 * counter.useSelect((state) => state.value); // React selector
	 * counter.getInitialState();      // Initial slice state
	 * counter.getInitialState.deep(); // Initial subtree state
	 * ```
	 */
	state?: S | (() => S);

	/**
	 * Collection of state mutation functions.
	 *
	 * Mutations define the write operations for the slice. Each mutation
	 * receives an Immer draft of the slice state and may optionally accept
	 * additional arguments.
	 *
	 * Every mutation is automatically exposed as a method on the created
	 * slice instance, so no explicit dispatching is required.
	 *
	 * ```ts
	 * const counter = createSlice({
	 *   name: "counter",
	 *
	 *   state: { value: 0 },
	 *
	 *   mutations: {
	 *     increment(state, amount: number = 1) {
	 *       state.value += amount;
	 *     },
	 *   },
	 * });
	 * ```
	 *
	 * Runtime usage:
	 *
	 * ```ts
	 * counter.increment();
	 * counter.increment(5);
	 * ```
	 */
	mutations?: R;

	/**
	 * Collection of user-defined instance methods.
	 *
	 * Methods are regular functions attached to the slice instance.
	 * They can accept arbitrary arguments, encapsulate reusable logic,
	 * return any value, perform asynchronous work, or even expose
	 * React hooks.
	 *
	 * Each method is bound to the slice instance, providing access to
	 * its runtime properties and utilities through `this`.
	 *
	 * ```ts
	 * const counter = createSlice({
	 *   name: "counter",
	 *
	 *   methods: {
	 *     isEmpty() {
	 *       return this.getState().value === 0;
	 *     },
	 *
	 *     async load(force: boolean = false) {
	 *       if (force || this.isEmpty()) {
	 *         const value = await fetchCounter();
	 *         this.set(value);
	 *       }
	 *     },
	 *
	 *     useValue() {
	 *       return this.useSelect((state) => state.value);
	 *     },
	 *   },
	 * });
	 * ```
	 *
	 * Runtime usage:
	 *
	 * ```ts
	 * counter.isEmpty(); // boolean
	 * await counter.load(true); // async
	 * counter.useValue(); // React hook
	 * ```
	 */
	methods?: M & ThisType<slice<S, R, M, C>>;

	/**
	 * Collection of child slices.
	 *
	 * Child slices are automatically mounted beneath the current slice,
	 * forming a hierarchical runtime tree.
	 *
	 * Each child exposes its own state, mutations, methods, listeners,
	 * and descendants while contributing its state to the parent's state
	 * object.
	 *
	 * ```ts
	 * const shop = createSlice({
	 *   children: {
	 *     products: productsSlice,
	 *     cart: cartSlice,
	 *   },
	 * });
	 * ```
	 *
	 * Runtime usage:
	 *
	 * ```ts
	 * // Child slice instance
	 * shop.products.increment();
	 *
	 * // Child state
	 * shop.getState().products;
	 *
	 * // Entire initial state tree
	 * shop.getInitialState.deep();
	 * ```
	 */
	children?: C;

	/**
	 * Collection of derived state functions.
	 *
	 * Computed values are lazily evaluated from the current slice state and
	 * automatically cached until their dependencies change.
	 *
	 * > **Status:** Planned for a future release.
	 */
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
	listeners?: "Planned" | "Not Yet Supported";
};

/**
 * Collection of functions that update slice state.
 *
 * Mutations receive an Immer draft and may either mutate it
 * directly or return a replacement state.
 */
type Mutations<S extends Obj, M, C> = Dict<
	(state: DraftState<S, {}, M, C>, ...args: any[]) => void | DraftState<S, {}, M, C>
>;

type SliceState<S extends Obj, R extends Mutations<S, M, C>, M, C> = ReadOnly<
	Omit<S, keyof OmitNever<{ [K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends AnySlice ? true : never }>> &
		OmitNever<{
			[K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends slice<infer S, infer R, infer M, infer C>
				? SliceState<S, R, M, C>
				: never;
		}>
>;

type DraftState<S extends Obj, R extends Mutations<S, M, C>, M, C> = Omit<
	S,
	keyof OmitNever<{ [K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends AnySlice ? true : never }>
> &
	OmitNever<{
		[K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends slice<infer S, infer R, infer M, infer C>
			? DraftState<S, R, M, C>
			: never;
	}>;

type CloneArgs<S extends Obj = Obj, R extends Mutations<S, M, C> = Mutations<S, any, any>, M = any, C = any> = {
	/** Optional name used when reporting clone validation errors. */
	name?: string;

	/** Explicit state to assign to the cloned slice. */
	object?: Obj;

	/** Receives the cloned state before initialization, allowing it to be customized. */
	transform?: (
		nextProps: Pick<sliceOptions<S, R, M, C>, "name" | "mutations" | "methods">,
		state: DraftState<S, R, M, C>,
	) => void | DraftState<S, R, M, C>;
};

/**
 * Property names reserved by the framework.
 *
 * These names cannot be used for mutations,
 * methods, or child slices.
 */
type ReservedSliceKeys<R = {}, M = {}> =
	| ("name" | "path" | "computed" | "root" | "parent" | "family" | "utils" | "getState" | "getInitialState" | "useSelect") // prettier-ignore
	| (keyof R | keyof M);

type AnySlice = slice<any, Mutations<any, any, any>, any, any>;

type AnySliceOptions = sliceOptions<any, Mutations<any, any, any>, any, any>;

type SliceMeta = NodeMeta<AnySlice, AnySliceOptions, { redux: RTKSlice; reducer: RTKReducer }>;

export type { slice as Slice, sliceOptions as SliceOptions, SliceState, Mutations, CloneArgs, AnySlice, AnySliceOptions, SliceMeta }; // prettier-ignore
