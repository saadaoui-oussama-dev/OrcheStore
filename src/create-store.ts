import { configureStore } from "@reduxjs/toolkit";
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

  const store = slices;
  const reduxStore = configureStore({
    reducer: {},
  });

  stores.push({ store: store, redux: reduxStore });
  return store;
}
