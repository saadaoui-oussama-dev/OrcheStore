import type { GlobalUtils, Mutations, Obj, RootStore, Slice as slice, SliceOptions as sliceOptions, Store as store, StoreOptions as storeOptions } from "./internal"; // prettier-ignore

declare global {
	namespace OrcheStore {
		/** Runtime store API exposed by createStore(...). */
		type Store<C> = store<C>;

		/** Configuration object used to create a store. */
		type StoreOptions<C> = storeOptions<C>;

		/** Runtime slice API exposed by createSlice(...). */
		type Slice<S extends Obj, R extends Mutations<S, C>, M, C> = slice<S, R, M, C>;

		/** Configuration object used to create a slice. */
		type SliceOptions<S extends Obj, R extends Mutations<S, C>, M, C> = sliceOptions<S, R, M, C>;
	}
}

export type {
	store as Store,
	storeOptions as StoreOptions,
	slice as Slice,
	sliceOptions as SliceOptions,
	RootStore,
	GlobalUtils,
};
