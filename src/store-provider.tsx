import React from "react";
import { Provider } from "react-redux";
import { getReduxStore } from "./create-store";
import type { Store } from "../types";
import type { ProviderProps } from "react-redux";

type StoreProviderProps = Omit<ProviderProps, "store" | "serverState" | "context"> & {
  /** The root OrcheStore instance created with `createStore(...)`. */
  store: Store;
};

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider(props: StoreProviderProps): React.JSX.Element {
  const { store, stabilityCheck, identityFunctionCheck, children } = { ...(props || {}) };

  const reduxStore = getReduxStore(store);

  if (!reduxStore) {
    throw new Error("[OrcheStore::context] <StoreProvider> requires a store instance created with createStore(...).");
  }

  return (
    <Provider stabilityCheck={stabilityCheck} identityFunctionCheck={identityFunctionCheck} store={reduxStore}>
      {children}
    </Provider>
  );
}
