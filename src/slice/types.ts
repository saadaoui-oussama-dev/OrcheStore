import type { RTKSlice, RTKReducer } from "../helpers/imports";
import type { Dict, Utils, Obj, OmitNever, ReadOnly, Store, Tail, ListenersBuilder, NodeMeta, NodePrototype } from "../helpers/types"; // prettier-ignore

/** Runtime API returned by `createSlice()`. */
type slice<S extends Obj, R extends Mutations<S, M, C>, M, C, InsideMutation = false> = Utils & {
	/**
	 * Unique name assigned to the slice during creation or cloning.
	 */
	readonly name: string;

	/**
	 * Dot-separated path of the slice within the mounted store tree.
	 *
	 * The path is automatically assigned when the slice is mounted and
	 * reflects its runtime location in the hierarchy.
	 */
	readonly path: string;

	/**
	 * Root store instance that owns this slice.
	 *
	 * Provides access to global store APIs regardless of the slice's
	 * position in the runtime tree.
	 */
	readonly root: Store<any>;

	/**
	 * Parent slice in the runtime tree.
	 *
	 * Returns `undefined` if this slice is mounted as a root slice.
	 */
	readonly parent: slice<any, Mutations<any, any, any>, any, any> | undefined;

	/**
	 * Runtime cloning utilities.
	 *
	 * Provides APIs for creating and managing cloned slice instances.
	 */
	readonly family: NodePrototype<slice<S, R, M, C>, [CloneArgs<S, R, M, C>["transform"]]>;

	/**
	 * React hook for selecting values from the current slice state.
	 *
	 * The selector receives:
	 * - the current immutable slice state
	 * - the runtime utilities context
	 *
	 * Built on top of React Redux's `useSelector`, with automatic detection
	 * of the correct store instance when multiple `StoreProvider`s are
	 * present in the component tree.
	 *
	 * **Notes:**
	 * - This is a React custom hook and may only be called from the body of
	 *   React function components or other custom hooks.
	 * - Requires the slice to be mounted under a `StoreProvider`.
	 */
	readonly useSelect: <T>(selector: (this: Utils, state: SliceState<S, R, M, C>, context: Utils) => T) => T;

	/**
	 * Returns the current immutable state snapshot of the slice.
	 *
	 * The returned state includes all mounted child slices and reflects
	 * the latest runtime updates.
	 *
	 * This API is not available inside mutation functions. Use the
	 * provided draft state instead to read or update state.
	 */
	readonly getState: () => SliceState<S, R, M, C>;

	/**
	 * Returns the slice's initial state.
	 *
	 * Call the function directly to retrieve only this slice's initial
	 * state, or use `deep()` to include all mounted child slices.
	 */
	readonly getInitialState: {
		/**
		 * Returns this slice's original initial state.
		 *
		 * Does not include child slice state or runtime updates.
		 */
		(): SliceState<S, R, M, C, {}>;

		/**
		 * Returns the complete initial state of the slice subtree.
		 *
		 * Includes the initial state of all mounted child slices.
		 */
		readonly deep: () => SliceState<S, R, M, C>;
	};

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
			? InsideMutation extends true
				? Omit<slice<S, {}, M, C, InsideMutation>, "getState" | "useSelect">
				: slice<S, R, M, C>
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
	 * initialization with access to the global utilities through
	 * both `this.utils` and the `utils` parameter:
	 *
	 * ```ts
	 * const counter = createSlice({
	 *   name: "counter",
	 *
	 *   state: function (utils) {
	 *     utils.log("Initializing counter slice");
	 *
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
	state?: S | ((this: ThisType<Utils>, utils: Utils["utils"]) => S);

	/**
	 * Collection of state mutation functions.
	 *
	 * Mutations define the write operations for the slice. Each mutation
	 * receives an Immer draft of the slice state as its first argument and
	 * may accept arbitrary arguments.
	 *
	 * Each mutation is bound to the slice instance, providing access to
	 * its runtime properties and utilities through `this`, except for
	 * `getState`, `useSelect`, and other mutations.
	 *
	 * **Notes:**
	 * - Use the provided draft state to read and update the current state.
	 * - Mutate the draft state directly or return a replacement state.
	 * - Child slice state can be read and updated from the current slice's draft state.
	 * - State updates in other slices should be coordinated through the `listeners` API.
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
	 *       this.utils.log("Counter updated");
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
	mutations?: R & ThisType<Omit<slice<S, {}, M, C, true>, "getState" | "useSelect">>;

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
	 * await counter.load(true); // async
	 * counter.isEmpty(); // boolean
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

type SliceState<S extends Obj, R extends Mutations<S, M, C>, M, C, CC = C> = ReadOnly<DraftState<S, R, M, C, CC>>;

type DraftState<S extends Obj, R extends Mutations<S, M, C>, M, C, CC = C> = Omit<
	S,
	keyof OmitNever<{
		[K in Exclude<keyof C, ReservedSliceKeys<R, M>>]: C[K] extends slice<infer _, infer __, infer ___, infer ____>
			? true
			: never;
	}>
> &
	OmitNever<{
		[K in Exclude<keyof CC, ReservedSliceKeys<R, M>>]: CC[K] extends slice<infer S, infer R, infer M, infer C>
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
