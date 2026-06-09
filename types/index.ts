import type { GlobalUtils, Mutations, RootStore, Slice as slice, SliceOptions as sliceOptions, Store as store, StoreOptions as storeOptions } from "./internal"; // prettier-ignore

declare global {
	namespace OrcheStore {
		/** Runtime store API exposed by createStore(...). */
		type Store<C> = store<C>;

		/** Configuration object used to create a store. */
		type StoreOptions<C> = storeOptions<C>;

		/** Runtime slice API exposed by createSlice(...). */
		type Slice<S, R extends Mutations<S>, M> = slice<S, R, M>;

		/** Configuration object used to create a slice. */
		type SliceOptions<S, R extends Mutations<S>, M> = sliceOptions<S, R, M>;
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
