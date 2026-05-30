import type { GlobalUtils, RootStore } from "./slots";

declare global {
  type OrcheStore = {};

  namespace OrcheStore {}
}

export type { OrcheStore, RootStore, GlobalUtils };
