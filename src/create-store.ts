import { configureStore } from "@reduxjs/toolkit";
import { getReduxSlice } from "./create-slice";
import { console } from "./helpers/console";
import type { EnhancedStore } from "@reduxjs/toolkit";
import type { Store, Slice } from "../types";

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
export function createStore({ slices }: { slices: Record<string, Slice> }): Store {
  if (stores.length === 1) {
    console.warn(
      "[OrcheStore] createStore(...) was called more than once.\n" +
        "OrcheStore currently supports only a single global store instance and will return the existing store.\n" +
        "If you are creating a store inside a React component, create it only once, for example:\n" +
        "const [store] = useState(() => createStore(...));\n" +
        "Avoid useState(createStore(...)) because createStore(...) will be executed on every render."
    );
    return stores[0].store;
  }

  const store: any = {};

  const reducers: any = {};

  for (const name in slices) {
    const slice = slices[name];
    const reduxSlice = getReduxSlice(slice);
    if (!reduxSlice) continue;
    store[name] = slice;
    reducers[name] = reduxSlice.reducer;
  }

  const reduxStore = configureStore({
    reducer: reducers,
  });

  stores.push({ store: store, redux: reduxStore });
  return store;
}
