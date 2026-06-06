import { configureStore } from "@reduxjs/toolkit";
import { getSlice } from "./create-slice";
import { useSelector } from "react-redux";
import { object } from "./helpers/object-utils";
import { console } from "./helpers/console";
import { nestingSeparator, normalizeState } from "./helpers/state";
import { getGlobalUtils } from "./global-utils";
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { Dict } from "../types/helpers";
import type { AnySlice } from "../types/slice";
import type { Store, AnyStore } from "../types/store";

/** Registered OrcheStore instances and their backing Redux stores. */
const stores: { store: AnyStore; redux: EnhancedStore }[] = [];

/** Returns the OrcheStore store instance with its associated Redux store. */
export function getStore(store?: AnyStore, slice?: AnySlice, throwError = true) {
  store = store === undefined ? stores[0]?.store : store;
  const redux = store ? stores.find((it) => it.store === store)?.redux : undefined;
  if (!redux && throwError) throw new Error(messages.RequiredStore(slice?.name || ""));
  return { store, redux: redux! };
}

/** Creates and initializes an OrcheStore instance. */
export function createStore<C extends Dict<AnySlice>>({ slices }: { slices: C }): Store<C> {
  console.inform("prerelease");

  if (stores.length === 1) {
    console.warn(messages.singletoneLimitation());
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
    reducers[name] = reduxSlice.reducer;
    parent[name] = slice;
    Object.entries(children).forEach(([key, child]) => {
      addChild(name + nestingSeparator + key, child as any, slice);
    });
  };

  for (const key in slices) {
    const slice = slices[key] as AnySlice;
    if (key in store) {
      console.error(messages.ReservedKey("slice key", key));
      continue;
    }
    const sliceData = getSlice(slice);
    if (!sliceData) {
      console.error(messages.InvalidChild(key));
      continue;
    }
    addChild(key, slice, store);
  }

  const reduxStore = configureStore({
    reducer: reducers,
  });

  stores.push({ store: store, redux: reduxStore });
  return store as any;
}

const messages = {
  RequiredStore: (sliceName: string) => `[OrcheStore::runtime] No root store found${sliceName ? (" for slice: {" + sliceName + "}") : ""}. Slices must be created within the context of a store.\nCreate a store using createStore(...) and ensure that slices are accessed after the store is initialized.`, // prettier-ignore
  ReservedKey: (type: string, prop: string) => `[OrcheStore::createStore] '${prop}' is reserved by OrcheStore and should not be provided as a ${type}.`, // prettier-ignore
  InvalidChild: (key: string) => `[OrcheStore::createStore] Child slice '${key}' must be a slice object created using createSlice(...).`, // prettier-ignore
  singletoneLimitation: () =>
    "[OrcheStore::createStore] createStore(...) was called more than once.\n" +
    "OrcheStore currently supports only a single global store instance and will return the existing store.\n" +
    "If you are creating a store inside a React component, create it only once, for example:\n" +
    "const [store] = useState(() => createStore(...));\n" +
    "Avoid useState(createStore(...)) because createStore(...) will be executed on every render.",
};
