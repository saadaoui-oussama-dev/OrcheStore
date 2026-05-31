import React from "react";
import { Provider, useDispatch } from "react-redux";
import { getReduxStore } from "./create-store";
import type { Slice } from "../types";
import type { ProviderProps } from "react-redux";
import type { Dispatch, UnknownAction } from "@reduxjs/toolkit";

type StoreProviderProps = Omit<ProviderProps, "store" | "serverState" | "context"> & {
  /** The root OrcheStore instance created with createStore(...). */
  store: Slice;
};

/** Internal Redux dispatch instance used by OrcheStore. */
let dispatch: Dispatch<UnknownAction>;

/** Returns the Redux dispatch instance used internally by OrcheStore. */
export function getDispatch(): Dispatch<UnknownAction> {
  if (dispatch) return dispatch;
  throw new Error("[OrcheStore] Using OrcheStore requires wrapping your application with <StoreProvider>.");
}

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider(props: StoreProviderProps): React.JSX.Element {
  const { store, children, stabilityCheck, identityFunctionCheck } = props;

  const reduxStore = getReduxStore(store);

  if (!reduxStore) {
    throw new Error("[OrcheStore] <StoreProvider> requires a store instance created with createStore(...).");
  }

  return (
    <Provider stabilityCheck={stabilityCheck} identityFunctionCheck={identityFunctionCheck} store={reduxStore}>
      {(() => {
        dispatch = useDispatch();
        return children;
      })()}
    </Provider>
  );
}
