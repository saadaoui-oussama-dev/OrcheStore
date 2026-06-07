import type { Dict } from "./helpers";
import type { GlobalUtils, RootStore } from "./slots";
import type { Store as store, StoreOptions as storeOptions } from "./store";
import type { AnySlice, Computed, Methods, Mutations, Slice as slice, SliceOptions as sliceOptions } from "./slice";

type orchestore = {};

declare global {
	type OrcheStore = orchestore;

	namespace OrcheStore {
		/** Runtime store API exposed by createStore(...). */
		type Store<C extends Dict<AnySlice>> = store<C>;

		/** Configuration object used to create a store. */
		type StoreOptions<C extends Dict<AnySlice>> = storeOptions<C>;

		/** Runtime slice API exposed by createSlice(...). */
		type Slice<
			S extends Dict,
			R extends Mutations<S>,
			M extends Methods,
			C extends Dict<AnySlice>,
			G extends Computed<S, C>,
			N extends string = string,
		> = slice<S, R, M, C, G, N>;

		/** Configuration object used to create a slice. */
		type SliceOptions<
			S extends Dict,
			R extends Mutations<S>,
			M extends Methods,
			C extends Dict<AnySlice>,
			G extends Computed<S, C>,
			N extends string = string,
		> = sliceOptions<S, R, M, C, G, N>;
	}
}

export type {
	orchestore as OrcheStore,
	store as Store,
	storeOptions as StoreOptions,
	slice as Slice,
	sliceOptions as SliceOptions,
	RootStore,
	GlobalUtils,
};
