import { configureStore } from "@reduxjs/toolkit";
import { getReduxSlice } from "./create-slice";
import { useSelector } from "react-redux";
import { object } from "./helpers/object-utils";
import { console } from "./helpers/console";
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { Store } from "../types";
import { Children } from "../types/slice";
import { normalizeState } from "./helpers/state";

/** Registered OrcheStore instances and their backing Redux stores. */
const stores: { store: Store; redux: EnhancedStore }[] = [];

/** Returns the Redux store associated with the provided OrcheStore instance. */
export function getReduxStore(store: Store) {
  return stores.find((it) => it.store === store)?.redux;
}

/** Returns the root OrcheStore instance. */
export function getRootStore() {
  return stores[0]?.store;
}

/** Creates and initializes an OrcheStore instance. */
export function createStore<C extends Children = Children>({ slices }: { slices: C }): Store<C> {
  console.inform("prerelease");

  if (stores.length === 1) {
    console.warn(
      "[OrcheStore::createStore] createStore(...) was called more than once.\n" +
        "OrcheStore currently supports only a single global store instance and will return the existing store.\n" +
        "If you are creating a store inside a React component, create it only once, for example:\n" +
        "const [store] = useState(() => createStore(...));\n" +
        "Avoid useState(createStore(...)) because createStore(...) will be executed on every render."
    );
    return stores[0].store as Store<C>;
  }

  const store: any = {};

  object.defineMethod(store, "getState", () => normalizeState(reduxStore.getState(), ""));

  object.defineMethod(store, "useSelect", (selector: any) => useSelector(selector));

  const reducers: any = {};

  const addChild = (name: string, metadata: ReturnType<typeof getReduxSlice>) => {
    if (!metadata) return;
    const { redux: reduxSlice, children } = metadata;
    metadata.path = name;
    reducers[name] = reduxSlice.reducer;
    Object.entries(children).forEach(([key, child]) => {
      addChild(name + "." + key, getReduxSlice(child));
    });
  };

  for (const name in slices) {
    const slice = slices[name];
    if (name in store) continue;
    addChild(name, getReduxSlice(slice)! || {});
  }

  const reduxStore = configureStore({
    reducer: reducers,
  });

  stores.push({ store: store, redux: reduxStore });
  return store;
}
