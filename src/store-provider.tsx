import React from "react";
import { Provider } from "react-redux";
import { getStore } from "./create-store";
import type { AnyStore } from "../types/store";
import type { ProviderProps } from "react-redux";

type StoreProviderProps = Omit<ProviderProps, "store" | "serverState" | "context"> & {
  /** The root OrcheStore instance created with `createStore(...)`. */
  store: AnyStore;
};

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider(props: StoreProviderProps): React.JSX.Element {
  const { store, stabilityCheck, identityFunctionCheck, children } = { ...(props || {}) };

  const reduxStore = getStore(store, undefined, false).redux;

  if (!reduxStore) {
    throw new Error("[OrcheStore::context] <StoreProvider> requires a store instance created with createStore(...).");
  }

  return (
    <Provider stabilityCheck={stabilityCheck} identityFunctionCheck={identityFunctionCheck} store={reduxStore}>
      {children}
    </Provider>
  );
}
