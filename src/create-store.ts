import { configureStore } from "@reduxjs/toolkit";
import { exposeSliceToParent, getSlice } from "./create-slice";
import { useSelector } from "react-redux";
import { object } from "./helpers/object-utils";
import { devConsole } from "./helpers/console";
import { normalizeState } from "./helpers/state";
import { getGlobalUtils } from "./global-utils";
import { storeErrors } from "./helpers/errors";
import type { Dict, Store, AnyStore, AnySlice, StoreData, SliceData, StoreOptions } from "../types/internal"; // prettier-ignore
import { exposeLayer } from "./helpers/validators";

/** Registered OrcheStore stores and their corresponding Redux stores. */
const stores: StoreData[] = [];

// Context object factory functions.
const useSelectorContext = (store: any, rootState: any) => ({ root: store, rootState, global: getGlobalUtils() });
const exposeContext = (type: string) => ({ module: "createStore", type, slice: "" });

/** Creates and initializes an OrcheStore instance. */
export function createStore<C extends Dict<AnySlice>>(props: { slices: C }): Store<C> {
	if (stores.length === 1) {
		devConsole.warn(storeErrors.singletoneLimitation());
		return stores[0].store as Store<C>;
	}

	devConsole.inform("prerelease");

	// Initialize store metadata and runtime containers.
	const store = {} as AnyStore;
	const options = validateStoreOptions(props);
	const reservedKeys = ["name", "computed", "global", "getState", "useSelect"];
	const injectedKeys: string[] = [];

	object.defineReadonly(store, "global", () => getGlobalUtils());

	// Exposing slices and adapt slice reducers into one combined reducer.
	const reducers: any = {};
	exposeLayer(exposeContext("slice"), options.slices, [reservedKeys, injectedKeys], (key, item) => {
		const childData = getSlice(item);
		if (!childData) return devConsole.error(storeErrors.InvalidChild(key));
		return exposeSliceToParent(key, childData, store, store, reducers);
	});

	// Create and register the underlying Redux Toolkit store.
	const reduxStore = configureStore({
		reducer: reducers,
	});

	const storeData: StoreData = { provided: false, store: store, redux: reduxStore };

	object.defineMethod(store, "getState", () => {
		return normalizeState(reduxStore.getState(), "");
	});

	object.defineMethod(store, "useSelect", (selector: any) => {
		return useSelector((state: any) => {
			const context = useSelectorContext(store, normalizeState(state, ""));
			return selector.call(context, context.rootState, context);
		});
	});

	stores.push(storeData);
	return store as Store<C>;
}

/** Validates and normalizes store definition options. */
const validateStoreOptions = <C extends Dict<AnySlice>, O extends StoreOptions<C>>(props: O) => {
	// Create a mutable copy of the provided options.
	const options = { ...(props || {}) };

	// Normalize optional object collections.
	options.slices = typeof options.slices === "object" && options.slices ? { ...options.slices } : ({} as any);

	// Warn when Redux Toolkit-specific options are provided.
	const { reducer, devTools, duplicateMiddlewareCheck, enhancers, middleware, preloadedState } = options as any;
	if (reducer !== undefined) devConsole.warn(storeErrors.ReduxConflict("reducer"));
	if (devTools !== undefined) devConsole.warn(storeErrors.ReduxConflict("devTools"));
	if (duplicateMiddlewareCheck !== undefined) devConsole.warn(storeErrors.ReduxConflict("duplicateMiddlewareCheck"));
	if (enhancers !== undefined) devConsole.warn(storeErrors.ReduxConflict("enhancers"));
	if (middleware !== undefined) devConsole.warn(storeErrors.ReduxConflict("middleware"));
	if (preloadedState !== undefined) devConsole.warn(storeErrors.ReduxConflict("preloadedState"));

	// Return a fully normalized options object.
	return options as Required<O>;
};

/** Returns the OrcheStore store instance with its associated Redux store. */
export function getStore(slice?: SliceData, store?: AnyStore, reactContext?: boolean, error: Dict<any[]> = {}) {
	let message: any[] | undefined = undefined;
	if ((!slice || store !== undefined) && !stores.find((it) => it.store === store)) message = error["StoreType"];
	else if (slice && !slice.exposedIn.length) message = error["NeverExposed"];
	else if (slice && store && !slice.exposedIn.includes(store)) message = error["NotInTree"];
	store = slice && store === undefined ? slice.exposedIn[0] : store;
	if (reactContext && !store!.provided) message = error["NotProvided"];
	if (message) {
		devConsole.error(...message);
		throw new Error();
	}
	return stores.find((it) => it.store === store)!;
}
