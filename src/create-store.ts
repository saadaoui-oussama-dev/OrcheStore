import { configureStore } from "@reduxjs/toolkit";
import { getSlice } from "./create-slice";
import { useSelector } from "react-redux";
import { object } from "./helpers/object-utils";
import { devConsole } from "./helpers/console";
import { nestingSeparator, normalizeState } from "./helpers/state";
import { getGlobalUtils } from "./global-utils";
import { storeErrors } from "./errors";
import type { Dict, Store, AnyStore, AnySlice, StoreData } from "../types/internal"; // prettier-ignore

/** Registered OrcheStore instances and their backing Redux stores. */
export const stores: StoreData[] = [];

/** Creates and initializes an OrcheStore instance. */
export function createStore<C extends Dict<AnySlice>>({ slices }: { slices: C }): Store<C> {
  devConsole.inform("prerelease");

  if (stores.length === 1) {
    devConsole.warn(storeErrors.singletoneLimitation());
    return stores[0].store as Store<C>;
  }

  const store = {} as AnyStore;

  const useSelectorContext = (rootState: any) => ({ root: store, rootState, global: getGlobalUtils() });
  
  object.defineMethod(store, "getState", () => {
    return normalizeState(reduxStore.getState(), "");
  });

  object.defineMethod(store, "useSelect", (selector: any) => useSelector((state: any) => {
    const context = useSelectorContext(normalizeState(state, ""));
    return selector.call(context, context.rootState, context);
  }));

  const reducers: any = {};

  const addChild = (name: string, slice: AnySlice, parent: any) => {
    const sliceData = getSlice(slice)! || {};
    if (!sliceData) return;
    const { redux: reduxSlice, children } = sliceData;
    sliceData.path = name;
    sliceData.exposedIn.push(store);
    reducers[name] = reduxSlice.reducer;
    parent[name] = slice;
    Object.entries(children).forEach(([key, child]) => {
      addChild(name + nestingSeparator + key, child as any, slice);
    });
  };

  for (const key in slices) {
    const slice = slices[key] as AnySlice;
    if (key in store) {
      devConsole.error(storeErrors.ReservedKey("slice key", key));
      continue;
    }
    const sliceData = getSlice(slice);
    if (!sliceData) {
      devConsole.error(storeErrors.InvalidChild(key));
      continue;
    }
    addChild(key, slice, store);
  }

  const reduxStore = configureStore({
    reducer: reducers,
  });

  stores.push({ provided: false, store: store, redux: reduxStore });
  return store as any;
}
