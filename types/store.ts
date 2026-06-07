import type { Dict } from "./helpers";
import type { AnySlice, UseSelectContext } from "./slice";
import type { ProviderProps } from "react-redux";
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { GlobalUtils } from "./slots";

/** Exposes immutable store state. */
type ExposedState<C extends Dict<AnySlice>> = { readonly [K in keyof C]: ReturnType<C[K]["getState"]> };

/** Reserved store member names that cannot be overridden by user-defined APIs. */
type ReservedKeys<R = {}, M = {}> = "name" | "computed" | "global" | "getState" | "useSelect" | keyof R | keyof M; // prettier-ignore

export type AnyStore = store<any>;

/** Runtime store API exposed by createStore(...). */
type store<C extends Dict<AnySlice>> = {
	/** Application-wide global utilities. */
	readonly global: GlobalUtils;

	/** Returns the latest immutable state snapshot. */
	readonly getState: () => ExposedState<C>;

	/** Subscribes to state changes within React components. Runs with a context-bound `this` containing `global` utilities. */
	readonly useSelect: <T>(
		selector: (this: UseSelectContext<store<C>>, state: ExposedState<C>, context: UseSelectContext<store<C>>) => T,
	) => T;
} & {
	/** Exposed slices. */
	readonly [K in Exclude<keyof C, ReservedKeys>]: C[K];
};

/** Configuration object used to create a store. */
type storeOptions<C extends Dict<AnySlice>> = {
	/** Collection of slices. */
	slices?: C;
};

export type StoreData = { store: AnyStore; redux: EnhancedStore; provided: boolean };

export type StoreProviderProps = Omit<ProviderProps, "store" | "serverState" | "context"> & {
	/** The root OrcheStore instance created with `createStore(...)`. */
	store: AnyStore;
};

export type { store as Store, storeOptions as StoreOptions };
