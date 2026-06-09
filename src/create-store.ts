import { storeErrors } from "./helpers/errors";
import { normalizeProps } from "./helpers/validators";
import type { Mutations, Slice, SliceOptions, Store, StoreData, StoreOptions } from "../types/internal";
import { devConsole } from "./helpers/console";
import { object } from "./helpers/object-utils";
import { getGlobalUtils } from "./global-utils";

/** Registered OrcheStore stores and their corresponding Redux stores. */
const stores: StoreData[] = [];

/** Creates and initializes an OrcheStore instance. */
const createStore = <T>(props: StoreOptions<T>): Store<T> => {
	if (stores.length === 1) {
		devConsole.warn(storeErrors.singletoneLimitation());
		return stores[0].store as any as Store<T>;
	}

	devConsole.inform("prerelease");



	// Initialize store metadata and runtime containers.
	const store = {} as Store<T>;

	const options = normalizeProps(props, {
		objects: ["slices"],
		redux: ["reducer", "devTools", "duplicateMiddlewareCheck", "enhancers", "middleware", "preloadedState"],
		reduxConflict: storeErrors.ReduxConflict,
	});

	object.defineReadonly(store as any, "global", () => getGlobalUtils());

	return store;
};;

export { createStore };
