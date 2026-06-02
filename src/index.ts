import { createStore } from "./create-store";
import { createSlice } from "./create-slice";
import { StoreProvider } from "./store-provider";
import { getGlobalUtils, provideGlobalUtils } from "./global-utils";
import { configureDiagnostics } from "./helpers/console";

const OrcheStore = {
  /** Creates and initializes an OrcheStore instance. */
  createStore,

  /** Creates and initializes an OrcheStore slice. */
  createSlice,

  /** Provides an OrcheStore instance to the React component tree. */
  StoreProvider,

  /** Registers or updates application-wide global utilities. */
  provideGlobalUtils,

  /** Returns the current global utilities object. */
  getGlobalUtils,

  /**
   * Configures OrcheStore diagnostics output.
   *
   * Levels:
   * - "off" - disables all output
   * - "errors" - shows errors only
   * - "all" - shows logs, warnings, and errors
   */
  configureDiagnostics,
};

export default OrcheStore;

export { createStore, createSlice, StoreProvider, provideGlobalUtils, getGlobalUtils, configureDiagnostics };

export type * from "../types";
