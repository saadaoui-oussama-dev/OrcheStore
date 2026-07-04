import type { RTKSlice, RTKReducer } from "../helpers/imports";
import type { Utils, Obj, OmitNever, ReadOnly, Store, Tail, ListenersBuilder, NodeMeta } from "../helpers/types"; // prettier-ignore

/**
 * Runtime API returned by `createSlice()`.
 */
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
	 * Returns the slice's original initial state.
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

	/**
	 * Runtime cloning utilities.
	 *
	 * Provides APIs for creating and managing cloned slice instances.
	 */
	readonly family: {
		/**
		 * Original name of the slice definition.
		 *
		 * Shared by every runtime instance created from the same definition.
		 */
		readonly name: string;

		/**
		 * Creates a new detached clone of this slice.
		 *
		 * By default, the clone inherits the original configuration and
		 * initial state while maintaining its own independent runtime
		 * lifecycle and mounting location.
		 *
		 * An optional transformer may be provided to customize the clone's
		 * name, mutations, methods, and initial state before initialization.
		 *
		 * The transformer receives:
		 *
		 * - `props` — mutable clone configuration, allowing the runtime
		 *   `name`, `mutations`, and `methods` to be customized.
		 * - `state` — mutable initial state of the cloned instance, which
		 *   follows the same semantics as slice mutations: modify the draft
		 *   directly or return a replacement state.
		 *
		 * ```ts
		 * const categories = crudSlice.family.clone();
		 *
		 * const products = crudSlice.family.clone((props, state) => {
		 *   props.name = "Products";
		 *
		 *   state.endpoint = "/v1/products";
		 *
		 *   props.mutations.setEndpointVersion = (state, version) => {
		 *     state.endpoint = `/v${version}/products`;
		 *   };
		 *
		 *   props.methods.getId = (item) => {
		 *     return item.code;
		 *   };
		 * });
		 * ```
		 */
		readonly clone: (transform?: CloneArgs<S, R, M, C>["transform"]) => slice<S, R, M, C, false>;

		/**
		 * Returns all runtime instances created from the same slice definition.
		 *
		 * Includes the current slice.
		 *
		 * ```ts
		 * const family = slice.family.getAll();
		 * ```
		 *
		 * Useful for:
		 *
		 * - inspecting mounted instances
		 * - debugging clone distribution
		 */
		readonly getAll: () => slice<S, R, M, C, false>[];

		/**
		 * Returns all other runtime instances created from the same slice definition.
		 *
		 * Excludes the current slice.
		 *
		 * ```ts
		 * const clones = slice.family.getClones();
		 * ```
		 *
		 * Useful for:
		 *
		 * - synchronizing sibling clones
		 * - broadcasting updates
		 * - comparing related instances
		 */
		readonly getClones: () => slice<S, R, M, C, false>[];

		/**
		 * Checks whether another slice originates from the same slice definition.
		 *
		 * Returns `true` when both slices belong to the same definition family,
		 * even if they are different runtime instances.
		 *
		 * Useful for creating reusable utilities and React components that
		 * operate on a specific slice definition while accepting any of its
		 * runtime clones.
		 *
		 * ```tsx
		 * function ReactiveDataTable({ slice }: Props) {
		 *   if (!crudSlice.family.isTypeOf(slice)) return null;
		 *
		 *   const list = slice.useSelect((state) => state.list);
		 *
		 *   return <table>...</table>;
		 * }
		 * ```
		 */
		readonly isTypeOf: (other?: any) => other is slice<S, R, M, C, false>;
	};
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

/**
 * Configuration used to create a slice definition.
 */
type sliceOptions<S extends Obj, R extends Mutations<S, M, C>, M, C> = {
	/**
	 * Unique name of the slice.
	 */
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
	 * **Execution**
	 *
	 * Listener callbacks always execute after the observed mutation has
	 * completed. Unlike Redux Toolkit's `extraReducers`, their execution
	 * is not affected by slice mounting order and they always observe the
	 * latest state.
	 */
	listeners?: "Planned" | "Not Yet Supported";
};

/**
 * Collection of state mutation function signatures.
 *
 * Used to infer the public mutation API, runtime reducers,
 * and the mutable draft state available within mutations.
 *
 * Each mutation receives the current draft state as its first
 * parameter and may either mutate it directly or return a
 * replacement state.
 */
type Mutations<S extends Obj, M, C> = Obj<
	(state: DraftState<S, {}, M, C>, ...args: any[]) => void | DraftState<S, {}, M, C>
>;

/**
 * Immutable runtime state exposed by a slice.
 *
 * Derived from {@link DraftState} by recursively applying
 * readonly semantics to the complete state tree.
 */
type SliceState<S extends Obj, R extends Mutations<S, M, C>, M, C, CC = C> = ReadOnly<DraftState<S, R, M, C, CC>>;

/**
 * Mutable state shape used internally by mutations.
 *
 * Starts from the declared slice state, removes any state properties
 * shadowed by child slices, then recursively replaces those child entries
 * with the draft state of the corresponding child slices.
 *
 * This produces the complete writable state tree available
 * while a mutation is executing.
 */
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

/**
 * Configuration object describing how a slice clone should be initialized.
 *
 * Used by the runtime cloning APIs to optionally override the cloned
 * state and customize the clone before it is initialized.
 */
type CloneArgs<S extends Obj = Obj, R extends Mutations<S, M, C> = Mutations<S, any, any>, M = any, C = any> = {
	/**
	 * Optional name associated with the clone.
	 *
	 * Used when reporting validation errors and diagnostics during
	 * clone creation.
	 */
	name?: string;

	/**
	 * Explicit state object assigned to the cloned slice before
	 * initialization.
	 *
	 * When omitted, the clone is initialized from the source slice's
	 * current state.
	 */
	object?: Obj;

	/**
	 * Callback invoked immediately before the cloned slice is initialized.
	 *
	 * Receives the clone's runtime configuration together with the
	 * mutable cloned state, allowing either in-place modifications or
	 * replacement of the state object before initialization continues.
	 */
	transform?: (
		nextProps: Pick<sliceOptions<S, R, M, C>, "name" | "mutations" | "methods">,
		state: DraftState<S, R, M, C>,
	) => void | DraftState<S, R, M, C>;
};

/**
 * Union of property names reserved by the slice runtime.
 *
 * Includes the built-in slice API together with all declared
 * mutation and method names, preventing collisions with child
 * slice properties and ensuring a unique public surface.
 */
type ReservedSliceKeys<R = {}, M = {}> =
	| ("name" | "path" | "computed" | "root" | "parent" | "family" | "utils" | "getState" | "getInitialState" | "useSelect") // prettier-ignore
	| (keyof R | keyof M);

/**
 * Non-generic slice type used by internal helpers and utilities.
 */
type AnySlice = slice<any, Mutations<any, any, any>, any, any>;

/**
 * Non-generic slice configuration type used by internal helpers
 * and utilities.
 */
type AnySliceOptions = sliceOptions<any, Mutations<any, any, any>, any, any>;

/**
 * Metadata associated with a slice definition.
 *
 * Extends the generic node metadata with the Redux Toolkit slice
 * instance and reducer generated for the runtime implementation.
 */
type SliceMeta = NodeMeta<AnySlice, AnySliceOptions, { redux: RTKSlice; reducer: RTKReducer }>;

export type { slice as Slice, sliceOptions as SliceOptions, SliceState, Mutations, CloneArgs, AnySlice, AnySliceOptions, SliceMeta }; // prettier-ignore
