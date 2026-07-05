import type { RTKStoreOptions, RTKStore, RTKProviderProps } from "../helpers/imports";
import type { Slice, SliceState, OmitNever, Utils, Obj, NodeMeta } from "../helpers/types"; // prettier-ignore

/**
 * Runtime API returned by `createStore()`.
 */
type store<C, I> = OmitNever<
	Utils & {
		/**
		 * Unique name assigned to the store during creation.
		 */
		readonly name: string;

		/**
		 * Returns the current immutable state snapshot of the entire store.
		 *
		 * The returned state includes every mounted slice and reflects the
		 * latest runtime updates.
		 */
		readonly getState: () => StoreState<C>;

		/**
		 * React hook for selecting values from the current store state.
		 *
		 * The selector receives:
		 * - the current immutable store state
		 * - the shared runtime utilities context
		 *
		 * Built on top of React Redux's `useSelector`, with automatic detection
		 * of the correct store instance when multiple `StoreProvider`s are
		 * present in the component tree.
		 *
		 * **Notes:**
		 * - This is a React custom hook and may only be called from the body of
		 *   React function components or other custom hooks.
		 * - Requires the store to be mounted under a `StoreProvider`.
		 */
		readonly useSelect: <T>(selector: (this: Utils, state: StoreState<C>, context: Utils) => T) => T;
	} & {
		/** Root mounted slice instances. */
		readonly [K in Exclude<keyof C, Reserved>]: C[K] extends Slice<infer S, infer R, infer M, infer C, infer _>
			? I extends true
				? Omit<Slice<S, {}, M, C, true>, "getState" | "useSelect">
				: Slice<S, R, M, C, false>
			: never;
	}
>;

/**
 * Configuration used to create a store definition.
 */
type storeOptions<C> = Omit<
	RTKStoreOptions,
	"reducer" | "middleware" | "duplicateMiddlewareCheck" | "preloadedState" | "enhancers"
> & {
	/**
	 * Optional name assigned to the store.
	 *
	 * Used to identify the store in diagnostics and development tools.
	 *
	 * @default "untitled"
	 */
	readonly name?: string;

	/**
	 * Collection of root slices.
	 *
	 * Each slice is mounted into the store, becoming a root node of the
	 * runtime slice tree.
	 *
	 * Every mounted slice contributes its state to the store state while
	 * exposing its runtime API directly on the store instance.
	 *
	 * ```ts
	 * const store = createStore({
	 *   slices: {
	 *     counter,
	 *     user,
	 *   },
	 * });
	 * ```
	 *
	 * Runtime usage:
	 *
	 * ```ts
	 * // Slice instances
	 * store.user.getState();
	 * store.counter.increment();
	 *
	 * // Store state
	 * store.getState().counter.value;
	 * store.useSelect((state) => state.counter.value);
	 * ```
	 */
	slices: C;
};

/**
 * Immutable state shape exposed by a store.
 *
 * Recursively maps every mounted child slice to its corresponding
 * immutable slice state, producing the complete runtime state tree.
 */
type StoreState<C> = OmitNever<{
	readonly [K in Exclude<keyof C, Reserved>]: C[K] extends Slice<infer S, infer R, infer M, infer C, infer _>
		? SliceState<S, R, M, C>
		: never;
}>;

/**
 * Props accepted by the OrcheStore React provider.
 *
 * Based on the React Redux provider props, excluding options that are
 * either managed internally by the runtime or not currently supported.
 */
type StoreProviderProps<T = any> = Omit<RTKProviderProps, "store" | "serverState" | "context"> & {
	/**
	 * Root store instance to expose to the React component tree.
	 *
	 * Components rendered beneath the provider can access this store
	 * through OrcheStore's React APIs, including `useSelect()`.
	 *
	 * The underlying React-Redux context is managed automatically,
	 * allowing `useSelect()` to resolve the correct store when
	 * multiple `StoreProvider`s are nested in the component tree.
	 */
	store: store<T, boolean>;
};

/**
 * Union of property names reserved by the store runtime.
 *
 * Includes the built-in store API together with all declared
 * method names, preventing collisions with child slice
 * properties and ensuring a unique public surface.
 */
type Reserved = "name" | "computed" | "utils" | "getState" | "useSelect";

/**
 * Non-generic store type used by internal helpers and utilities.
 */
type AnyStore = store<any, boolean>;

/**
 * Non-generic store configuration type used by internal helpers
 * and utilities.
 */
type AnyStoreOptions = storeOptions<any>;

/**
 * Metadata associated with a store definition.
 *
 * Extends the generic node metadata with the Redux Toolkit store,
 * root reducer, React context, and selector implementation used
 * by the runtime.
 */
type StoreMeta = NodeMeta<AnyStore, AnyStoreOptions, { redux: RTKStore; reducer: Obj; context: any; selector: any }>;

export type { store as Store, storeOptions as StoreOptions, StoreProviderProps, AnyStore, AnyStoreOptions, StoreMeta };
