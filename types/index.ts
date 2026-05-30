import type { GlobalUtils, RootStore } from "./slots";

type orchestore = {};

declare global {
  type OrcheStore = orchestore;

  namespace OrcheStore {}
}

export type { orchestore as OrcheStore, RootStore, GlobalUtils };
