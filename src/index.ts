import { createStore, getRootStore } from "./create-store";
import { StoreProvider } from "./store-provider";
import { getGlobalUtils, provideGlobalUtils } from "./global-utils";

const OrcheStore = {
  /** Creates and initializes an OrcheStore instance. */
  createStore,

  /** Returns the root OrcheStore instance. */
  getRootStore,

  /** Provides an OrcheStore instance to the React component tree. */
  StoreProvider,

  /** Registers or updates application-wide global utilities. */
  provideGlobalUtils,

  /** Returns the current global utilities object. */
  getGlobalUtils,
};

export default OrcheStore;

export { createStore, getRootStore, StoreProvider, provideGlobalUtils, getGlobalUtils };

export type * from "../types";
