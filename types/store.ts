import type { ProviderProps } from "react-redux";
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { GlobalUtils, ReadOnly, OmitNever, Slice, SliceState } from "./internal";

/** Runtime store API exposed by createStore(...). */
type store<C> = OmitNever<
	GlobalUtils & {
		/** Returns the latest immutable state snapshot. */
		readonly getState: () => StoreState<C>;

		/** Subscribes to state changes within React components. Runs with a context-bound `this` containing `global` utilities. */
		readonly useSelect: <T>(selector: (this: GlobalUtils, state: StoreState<C>, context: GlobalUtils) => T) => T;
	} & {
		/** Exposed slices. */
		[K in Exclude<keyof C, ReservedStoreKeys>]: C[K] extends Slice<infer S, infer R, infer M> ? Slice<S, R, M> : never;
	}
>;

/** Configuration object used to create a store. */
type storeOptions<C> = {
	/** Collection of slices. */
	slices: C;
};

/** Derived immutable state shape of the store. */
type StoreState<C> = ReadOnly<
	OmitNever<{
		readonly [K in Exclude<keyof C, ReservedStoreKeys>]: C[K] extends Slice<infer S, infer _, infer __> ? SliceState<S, true> : never;
	}>
>;

/** Props accepted by the store provider component. */
type StoreProviderProps<T = any> = Omit<ProviderProps, "store" | "serverState" | "context"> & {
	/** The root store instance created with `createStore(...)`. */
	store: store<T>;
};

/** Internal store runtime state. Not intended for public use. */
type StoreData = {
	store: store<any>;
	redux: EnhancedStore;
	provided: boolean;
};

/** Reserved store member names that cannot be overridden by user-defined APIs. */
type ReservedStoreKeys<R = {}, M = {}> =
	| ("name" | "computed" | "global" | "getState" | "useSelect")
	| (keyof R | keyof M);

export type { store as Store, storeOptions as StoreOptions, StoreProviderProps, StoreData, StoreState };
