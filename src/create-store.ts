import { configureStore, type Action, type Reducer } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getUtils } from "./global-utils";
import { createNodeFactory } from "./node-factory";
import { attachSlice, slices } from "./create-slice";
import { MESSAGES } from "./helpers/messages";
import { defineMethod, defineReadonly } from "./helpers/object-utils";
import { createExposer, normalizeProps } from "./helpers/validators";
import type { AnyStore, AnyStoreOptions, Store, StoreOptions } from "../types/internal";

type ExtraMeta = { redux: ReturnType<typeof configureStore>; reducer: Reducer<unknown, Action, unknown> };

type Errors = { NeverExposed?: () => void; InvalidType?: (parent: any) => void };

const { instances, create } = createNodeFactory<AnyStore, AnyStoreOptions, ExtraMeta>({
	options: {
		adapt(props) {
			const mismatch = { reducer: "'slices'", reducers: "'slices'", devTools: "", duplicateMiddlewareCheck: "", enhancers: "", middleware: "", preloadedState: "" }; // prettier-ignore
			return normalizeProps(props, { method: "createStore", mismatch, objects: ["slices"] });
		},
	},

	instantiate(props, meta) {
		const store = {} as any;

		const reservedKeys = ["name", "computed", "utils", "getState", "useSelect"];
		const expose = createExposer("createStore", undefined, reservedKeys);

		defineReadonly(store, "name", () => "default");

		defineReadonly(store, "utils", () => getUtils());

		defineMethod(store, "getState", () => meta.redux.getState());

		defineMethod(store, "useSelect", (selector: any) => {
			const context = { utils: getUtils(), root: store };
			return useSelector((state: any) => selector.apply(context, [state, context]));
		});

		// Combine all slices into one combined reducer.
		meta.reducer = expose("slice", false, props.slices, (key, item) => {
			const slice = attachSlice(key, item, store, meta, {
				UnknownNode: () => MESSAGES("createStore").InvalidChild(key, item),
			});
			if (slice) return (((store as any)[key] = slice), slices.get(slice)!.reducer);
		});

		// Create and register the underlying Redux Toolkit store.
		meta.redux = configureStore({
			reducer: meta.reducer,
		});

		return { node: store };
	},
});

/** Returns the OrcheStore store instance with its associated Redux store. */
export const getStore = (store?: AnyStore, childMeta?: any, errors?: Errors) => {
	if ((errors as any) === true) return [...instances.values()][0];

	store ||= childMeta?.parents?.at?.(-1);
	const meta = store ? instances.get(store) : undefined;

	if (childMeta && !store) return void errors?.NeverExposed?.();
	else if (!meta) return void errors?.InvalidType?.(store);

	return meta;
};

/** Creates and initializes an OrcheStore instance. */
const createStore = <T>(props: StoreOptions<T>): Store<T> => (create as any)(props);

export { createStore };
