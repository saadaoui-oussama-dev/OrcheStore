import { createStore, getStore } from "./create-store";
import { createSlice } from "./create-slice";
import { StoreProvider } from "./store-provider";
import { getGlobalUtils, provideGlobalUtils } from "./global-utils";
import { configureDiagnostics, devConsole } from "./helpers/console";
import { storeErrors } from "./helpers/errors";
import type { Mutations, Obj, Slice, SliceOptions, Store, StoreOptions } from "../types/internal";

/** Creates and initializes an OrcheStore slice. */
const createSliceWrapper = <S extends Obj, R extends Mutations<S, C>, M, C>(props: SliceOptions<S, R, M, C>): Slice<S, R, M, C> => {
	devConsole.inform("prerelease");
	return createSlice(props);
};

/** Creates and initializes an OrcheStore instance. */
const createStoreWrapper = <T>(props: StoreOptions<T>): Store<T> => {
	devConsole.inform("prerelease");
	if (getStore(undefined, undefined, true as any)) {
		devConsole.warn(storeErrors.singletonLimitation());
		return getStore(undefined, undefined, true as any).node as any;
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

	/** Registers or updates application-wide global utilities. */
	provideGlobalUtils,

	/** Returns the current global utilities object. */
	getGlobalUtils,

	/** Configures diagnostics output level ("off" | "errors" | "all"). */
	configureDiagnostics,
};

export {
	defaultExport as default,
	createStoreWrapper as createStore,
	createSliceWrapper as createSlice,
	StoreProvider,
	provideGlobalUtils,
	getGlobalUtils,
	configureDiagnostics,
};

export type * from "../types";
