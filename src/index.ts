import { getGlobalUtils, provideGlobalUtils } from "./global-utils";

const OrcheStore = {
  /** Returns the current global utilities object. */
  getGlobalUtils,

  /** Registers or updates application-wide global utilities. */
  provideGlobalUtils,
};

export default OrcheStore;

export { getGlobalUtils, provideGlobalUtils };

export type * from "../types";
