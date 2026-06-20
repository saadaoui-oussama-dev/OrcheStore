import { configureStore } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getGlobalUtils } from "./global-utils";
import { createNodeFactory } from "./node-factory";
import { attachSlice, slices } from "./create-slice";
import { devConsole } from "./helpers/console";
import { storeErrors } from "./helpers/errors";
import { object } from "./helpers/object-utils";
import { createExposer, normalizeProps } from "./helpers/validators";
import type { AnyStore, AnyStoreOptions, Store, StoreOptions } from "../types/internal";

type ExtraMeta = { redux: any; reducers: any };
type Errors = { NeverExposed?: any[]; InvalidType: (store: any) => any[] };

const { instances, create } = createNodeFactory<AnyStore, AnyStoreOptions, ExtraMeta>({
	factoryName: "slice",

	instantiate(props, meta) {
		const store = {} as any;

		const expose = createExposer({
			module: "createStore",
			reserved: ["name", "computed", "global", "getState", "useSelect"],
		});

		object.defineReadonly(store, "name", () => "default");

		object.defineReadonly(store, "global", () => getGlobalUtils());

		object.defineMethod(store, "getState", () => meta.redux.getState());

		object.defineMethod(store, "useSelect", (selector: any) => {
			const context = { global: getGlobalUtils(), root: store };
			return useSelector((state: any) => selector.apply(context, [state, context]));
		});

		// Combine all slices into one combined reducer.
		meta.reducers = expose("slice", false, props.slices, (key, item) => {
			const errors = { UnknownNode: (key: string) => devConsole.error(storeErrors.InvalidChild(key)) };
			const slice = attachSlice(key, item, store, meta, errors);
			if (slice) return (((store as any)[key] = slice), slices.get(slice)!.reducers);
		});

		// Create and register the underlying Redux Toolkit store.
		meta.redux = configureStore({
			reducer: meta.reducers,
		});

		return store;
	},

	options: {
		adapt(props) {
			return normalizeProps(props, {
				method: "createStore",
				objects: ["slices"],
				mismatch: {
					reducer: "'slices'",
					reducers: "'slices'",
					devTools: "",
					duplicateMiddlewareCheck: "",
					enhancers: "",
					middleware: "",
					preloadedState: "",
				},
			});
		},
	},
});

/** Returns the OrcheStore store instance with its associated Redux store. */
export const getStore = (store?: AnyStore, childMeta?: any, errors: Errors | false = false) => {
	if ((errors as any) === true) return [...instances.values()][0];

	store ||= childMeta?.parents?.at?.(-1);

	const meta = store ? instances.get(store) : undefined;

	let error: any[] | undefined = [];

	if (childMeta && !store) {
		error = errors === false ? [] : errors.NeverExposed;
	} else if (!meta) {
		error = errors === false ? [] : errors.InvalidType(store);
	}

	if (error && error.length) {
		if (error.every((m) => typeof m === "string")) throw new Error(error.join(" "));
		devConsole.error(...error);
		throw new Error();
	}

	return meta!;
};

/** Creates and initializes an OrcheStore instance. */
const createStore = <T>(props: StoreOptions<T>): Store<T> => (create as any)(props);

export { createStore };
