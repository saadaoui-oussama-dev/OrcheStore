import React from "react";
import { Provider } from "react-redux";
import { stores } from "./create-store";
import { devConsole } from "./helpers/console";
import { storeProviderErrors } from "./errors";
import type { AnyStore } from "../types/store";
import type { ProviderProps } from "react-redux";

type StoreProviderProps = Omit<ProviderProps, "store" | "serverState" | "context"> & {
  /** The root OrcheStore instance created with `createStore(...)`. */
  store: AnyStore;
};

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider(props: StoreProviderProps): React.JSX.Element {
  const { store, ...rest } = { ...(props || {}) };
  const storeData = store !== undefined ? stores.find((it) => it.store === store) : undefined;

  if (!storeData) {
    const message = storeProviderErrors.InvalidStore(store);
    devConsole.error(message);
    throw new Error(message[0].slice(0, message[0].length - 1));
  }

  if (!storeData.provided) storeData.provided = true;

  return <Provider {...rest} store={storeData.redux} />;
}
