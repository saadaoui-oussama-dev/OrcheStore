import { createStore, getStore } from "./create-store";
import { createSlice } from "./create-slice";
import { StoreProvider } from "./store-provider";
import { getUtils, setUtils } from "./global-utils";
import { setReporting, devConsole } from "./helpers/messages";
import type { Mutations, Obj, Slice, SliceOptions, Store, StoreOptions } from "../types/internal";

let informed = false;
const prereleasMessage =
	"[OrcheStore] 🚧 Pre-release Notice\n" +
	"Thank you for your interest in OrcheStore.\n" +
	"OrcheStore is currently under active development and is not yet ready for production use.\n" +
	"APIs, behavior, and internal implementation details may change without notice.\n" +
	"The first stable release is currently planned for 2026-06-30.\n" +
	"Stay tuned for updates!\n";

/** Creates and initializes an OrcheStore slice. */
const createSliceWrapper = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => {
	if (!informed) ((informed = true), devConsole.log([prereleasMessage]));
	return createSlice(props);
};

/** Creates and initializes an OrcheStore instance. */
const createStoreWrapper = <T>(props: StoreOptions<T>): Store<T> => {
	if (!informed) ((informed = true), devConsole.log([prereleasMessage]));
	const store = getStore(undefined, undefined, true as any);
	if (store) {
		devConsole.warn(["[OrcheStore::createStore] createStore(...) was called more than once.\nOrcheStore currently supports only one global store and will return the existing instance."]); // prettier-ignore
		return store?.node as any;
	}
	return createStore(props);
};

const defaultExport = {
	/** Creates and initializes an OrcheStore instance. */
	createStore: createStoreWrapper,

	/** Creates and initializes an OrcheStore slice. */
	createSlice: createSliceWrapper,

	/** Provides an OrcheStore instance to the React component tree. */
	StoreProvider,

	/** Registers or updates application-wide utilities. */
	setUtils,

	/** Returns the current utilities object. */
	getUtils,

	/** Enables or disables diagnostic logs, warnings, and errors. */
	setReporting,
};

export {
	defaultExport as default,
	createStoreWrapper as createStore,
	createSliceWrapper as createSlice,
	StoreProvider,
	getUtils,
	setUtils,
	setReporting,
};

export type * from "../types";
