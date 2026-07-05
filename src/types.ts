import type { Mutations, Obj, Slice, SliceOptions as sliceOptions, Store, StoreOptions as storeOptions, Utils } from "./helpers/types"; // prettier-ignore

/** Runtime store API exposed by createStore(...). */
type store<C> = Store<C, false>;

/** Runtime slice API exposed by createSlice(...). */
type slice<S extends Obj, R extends Mutations<S, M, C>, M, C> = Slice<S, R, M, C, false>;

/** Resolved type for application-wide utilities. */
type utils = Utils["utils"];

declare global {
	namespace OrcheStore {
		/** Runtime store API exposed by createStore(...). */
		type Store<C> = store<C>;

		/** Configuration object used to create a store. */
		type StoreOptions<C> = storeOptions<C>;

		/** Runtime slice API exposed by createSlice(...). */
		type Slice<S extends Obj, R extends Mutations<S, M, C>, M, C> = slice<S, R, M, C>;

		/** Configuration object used to create a slice. */
		type SliceOptions<S extends Obj, R extends Mutations<S, M, C>, M, C> = sliceOptions<S, R, M, C>;

		/** Resolved type for application-wide utilities. */
		type Utils = utils;
	}
}

export type { store as Store, storeOptions as StoreOptions, slice as Slice, sliceOptions as SliceOptions, utils as Utils }; // prettier-ignore
