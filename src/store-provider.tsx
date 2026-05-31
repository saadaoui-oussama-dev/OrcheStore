import React from "react";
import { Provider, useDispatch } from "react-redux";
import { getReduxStore } from "./create-store";
import type { Store } from "../types";
import type { ProviderProps } from "react-redux";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";

type StoreProviderProps = Omit<ProviderProps, "store" | "serverState" | "context"> & {
  /** The root OrcheStore instance created with createStore(...). */
  store: Store;
};

/** Registered Redux dispatch instances keyed by their OrcheStore root store. */
const dispatchers: { store: Store; dispatch: Dispatch<UnknownAction> }[] = [];

/** Returns the Redux dispatch instance associated with the provided OrcheStore root store. */
export function getDispatch(store: Store): Dispatch<UnknownAction> {
  const dispatcher = dispatchers.find((it) => it.store === store);
  if (dispatcher) return dispatcher.dispatch;
  throw new Error("[OrcheStore] Using OrcheStore requires wrapping your application with <StoreProvider>.");
}

/** Registers the Redux dispatch instance for the active OrcheStore provider. */
export function InternalDispatchProvider({ store, children }: StoreProviderProps) {
  const dispatch = useDispatch();
  let dispatcher = dispatchers.find((it) => it.store === store);
  if (!dispatcher) dispatchers.push((dispatcher = { store, dispatch }));
  dispatcher.dispatch = dispatch;

  return <>{children}</>;
}

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider(props: StoreProviderProps): React.JSX.Element {
  const { store, stabilityCheck, identityFunctionCheck } = props;

  const reduxStore = getReduxStore(store);

  if (!reduxStore) {
    throw new Error("[OrcheStore] <StoreProvider> requires a store instance created with createStore(...).");
  }

  return (
    <Provider stabilityCheck={stabilityCheck} identityFunctionCheck={identityFunctionCheck} store={reduxStore}>
      <InternalDispatchProvider {...props} />
    </Provider>
  );
}
