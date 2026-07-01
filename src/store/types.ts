import type { RTKStoreOptions, RTKStore, RTKProviderProps } from "../helpers/imports";
import type { Slice, SliceState, ReadOnly, OmitNever, Utils, Dict, NodeMeta } from "../helpers/types";

export type ExtraMeta = { redux: RTKStore; reducer: Dict; context: any; selector: any };

/**
 * Runtime API returned by `createStore()`.
 *
 * The store represents the root of the OrcheStore runtime tree and provides
 * access to all mounted slices, global state, and shared utilities.
 */
type store<C> = OmitNever<
	Utils & {
		/** Unique name of the store. */
		readonly name: string;

		/**
		 * Returns the current immutable state snapshot of the entire store tree.
		 *
		 * Includes all mounted slices and nested state.
		 */
		readonly getState: () => StoreState<C>;

		/**
		 * Subscribes to store state changes inside React components.
		 *
		 * The selector receives the full store state along with a context
		 * containing shared utilities.
		 *
		 * This hook is bound to the store instance and requires `StoreProvider`
		 * to be mounted in the React tree.
		 */
		readonly useSelect: <T>(selector: (this: Utils, state: StoreState<C>, context: Utils) => T) => T;
	} & {
		/** Root mounted slice instances. */
		readonly [K in Exclude<keyof C, ReservedStoreKeys>]: C[K] extends Slice<infer S, infer R, infer M, infer C>
			? Slice<S, R, M, C>
			: never;
	}
>;

/**
 * Configuration used to create a store instance.
 *
 * A store is composed of multiple slices that are mounted into a single
 * runtime tree. Each slice becomes accessible directly through the store API.
 */
type storeOptions<C> = Omit<
	RTKStoreOptions,
	"reducer" | "middleware" | "duplicateMiddlewareCheck" | "preloadedState" | "enhancers"
> & {
	/** Unique name of the store. */
	readonly name?: string;

	/**
	 * Collection of slices registered in this store.
	 *
	 * Each slice is mounted and becomes available as:
	 * `store.<sliceKey>`
	 *
	 * ```ts
	 * const store = createStore({
	 *   slices: {
	 *     counter,
	 *     user,
	 *   },
	 * });
	 *
	 * // Exposed slices access
	 * store.user.getState();
	 * store.counter.increment();
	 * store.counter.useSelect((state) => state.value);
	 *
	 * // State tree access
	 * store.getState().counter.value;
	 * store.useSelect((state) => state.counter.value);
	 * ```
	 */
	slices: C;
};

/**
 * Derived immutable state shape of the store.
 *
 * Represents the full read-only state tree including all mounted slices.
 */
type StoreState<C> = OmitNever<{
	readonly [K in Exclude<keyof C, ReservedStoreKeys>]: C[K] extends Slice<infer S, infer R, infer M, infer C>
		? SliceState<S, R, M, C>
		: never;
}>;

/**
 * Props for the OrcheStore React provider.
 *
 * Wraps the application and injects the store into React-Redux context.
 */
type StoreProviderProps<T = any> = Omit<RTKProviderProps, "store" | "serverState" | "context"> & {
	/**
	 * Root store instance created with `createStore()`.
	 *
	 * This store will be injected into the React component tree.
	 */
	store: store<T>;
};

/**
 * Property names reserved by the framework.
 *
 * These names cannot be used for child slices.
 */
type ReservedStoreKeys<R = {}, M = {}> =
	| ("name" | "computed" | "utils" | "getState" | "useSelect")
	| (keyof R | keyof M);

type AnyStore = store<any>;

type AnyStoreOptions = storeOptions<any>;

type StoreMeta = NodeMeta<AnyStore, AnyStoreOptions, ExtraMeta>;

export type { store as Store, storeOptions as StoreOptions, StoreProviderProps, AnyStore, AnyStoreOptions, StoreMeta };
