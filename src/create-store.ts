import type { Slice } from "../types";

/** The singleton root OrcheStore instance. */
let rootStore: Slice;

/** The internal Redux store backing OrcheStore. */
let reduxStore: any;

/** Returns the Redux store associated with the provided OrcheStore instance. */
export function getReduxStore(store: Slice) {
  if (store === rootStore) return reduxStore;
}

/** Returns the current root OrcheStore instance. */
export function getRootStore() {
  return rootStore;
}

/** Creates the root OrcheStore instance. */
export function createStore({ slices }: { slices: Record<string, Slice> }) {
  if (rootStore) return rootStore;

  rootStore = slices as any;
  reduxStore = {} as any;
}
