import { configureStore } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getGlobalUtils } from "./global-utils";
import { devConsole } from "./helpers/console";
import { storeErrors } from "./helpers/errors";
import { normalizeState } from "./helpers/state";
import { object } from "./helpers/object-utils";
import { createExposer, normalizeProps } from "./helpers/validators";
import { exposeSliceToParent, getSlice } from "./create-slice";
import type { Dict, SliceData, Store, StoreData, StoreOptions } from "../types/internal";

/** Registered OrcheStore stores and their corresponding Redux stores. */
const stores: StoreData[] = [];

/** Creates and initializes an OrcheStore instance. */
const createStore = <T>(props: StoreOptions<T>): Store<T> => {
	const storeData = {} satisfies Partial<StoreData> as any as StoreData;
	const store = (storeData.store = {} as any);
	const options = normalizeProps(props, {
		method: "createStore",
		objects: ["slices"],
		redux: ["reducer", "devTools", "duplicateMiddlewareCheck", "enhancers", "middleware", "preloadedState"],
	});

	const expose = createExposer({
		module: "createStore",
		reserved: ["name", "computed", "global", "getState", "useSelect"],
	});

	object.defineReadonly(store, "name", () => "default");

	object.defineReadonly(store, "global", () => getGlobalUtils());

	object.defineMethod(store, "getState", () => {
		return normalizeState(storeData.redux.getState(), "");
	});

	object.defineMethod(store, "useSelect", (selector: any) => {
		return useSelector((state: any) => {
			const context = { global: getGlobalUtils() };
			return selector.call(context, normalizeState(state, ""), context);
		});
	});

	// Combine all slices into one combined reducer.
	const reducers: any = {};
	expose("slice", options.slices, (key, item) => {
		const childData = getSlice(item);
		if (!childData) return devConsole.error(storeErrors.InvalidChild(key));
		return exposeSliceToParent(key, childData, store, store, reducers);
	});

	// Create and register the underlying Redux Toolkit store.
	storeData.redux = configureStore({
		reducer: reducers,
	});

	stores.push(storeData);
	return store;
};

/** Returns the OrcheStore store instance with its associated Redux store. */
export const getStore = (slice?: SliceData, store?: Store<any>, error: Dict<any[]> = {}): StoreData => {
	if ((error as any) === false) return stores[0];
	let message: any[] | undefined = undefined;
	if ((!slice || store !== undefined) && !stores.find((it) => it.store === store)) message = error["StoreType"];
	else if (slice && !slice.roots.length) message = error["NeverExposed"];
	else if (slice && store && !slice.roots.includes(store)) message = error["NotInTree"];
	store = slice && store === undefined ? slice.roots[0] : store;
	if (message) {
		if (message.every((m) => typeof m === "string")) throw new Error(message.join(" "));
		devConsole.error(...message);
		throw new Error();
	}
	return stores.find((it) => it.store === store)!;
};

export { createStore };
