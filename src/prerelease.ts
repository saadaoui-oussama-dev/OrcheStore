import { createStore, getStore } from "./store/creator";
import { createSlice } from "./slice/creator";
import { devConsole } from "./helpers/messages";
import type { Mutations, Obj, Slice, SliceOptions, Store, StoreOptions } from "./helpers/types";

let informed = false;

const prereleasMessage =
	"[OrcheStore] 🚧 Pre-release Notice\n" +
	"Thank you for your interest in OrcheStore.\n" +
	"OrcheStore is currently under active development and is not yet ready for production use.\n" +
	"APIs, behavior, and internal implementation details may change without notice.\n" +
	"The first stable release is currently planned for 2026-06-30.\n" +
	"Stay tuned for updates!\n";

/**
 * Creates and initializes a slice runtime instance.
 *
 * This function constructs a fully functional OrcheStore slice,
 * including state, mutations, methods, and nested children.
 *
 * @example
 * ```tsx
 * import { createStore, createSlice } from "orchestore";
 *
 * const counterSlice = createSlice({
 *   name: "counter",
 *
 *   state: { value: 0 },
 *
 *   mutations: {
 *     increment(state, amount: number = 1) {
 *       state.value += amount;
 *     },
 *   },
 *
 *   methods: {
 *     async incrementAfter(amount: number, delay: number) {
 *       await new Promise((resolve) => setTimeout(resolve, delay));
 *       this.increment(amount);
 *     },
 *   },
 * });
 *
 * // Create store tree
 * const store = createStore({
 *   slices: {
 *     counter: counterSlice,
 *   },
 * });
 *
 * // Direct usage
 * counterSlice.increment(12);
 * store.counter.increment(1);
 * store.counter.getState(); // { value: 13 }
 *
 * // React usage
 * function App() {
 *   const count = store.counter.useSelect((state) => state.value);
 *
 *   return (
 *     <>
 *       <div>Counter {count}</div>
 *
 *       <button onClick={() => store.counter.increment(1)}>
 *         Increment
 *       </button>
 *
 *       <button onClick={() => store.counter.incrementAfter(1, 1000)}>
 *         Increment after 1 second
 *       </button>
 *     </>
 *   );
 * }
 * ```
 *
 * @internal
 * Integrates Redux Toolkit, builds reducers, and wires runtime context.
 *
 * @prerelease
 * Calling this function will print a pre-release message in the console.
 * This behavior will be removed in the first stable release.
 */
const createSliceWrapper = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => {
	if (!informed) ((informed = true), devConsole.log([prereleasMessage]));
	return createSlice(props);
};

/**
 * Creates and initializes an OrcheStore root instance.
 *
 * This function sets up the application-wide store tree,
 * mounts all slices, and connects the runtime to Redux Toolkit.
 *
 * The resulting store becomes the central access point for:
 * - slice instances and their mutations
 * - global state inspection
 * - React subscriptions via `useSelect`
 * - runtime utilities via `utils`
 *
 * @example
 * ```tsx
 * import { createStore, createSlice } from "orchestore";
 *
 * const counterSlice = createSlice({
 *   name: "counter",
 *
 *   state: { value: 0 },
 *
 *   mutations: {
 *     increment(state, amount: number = 1) {
 *       state.value += amount;
 *     },
 *   },
 *
 *   methods: {
 *     async incrementAfter(amount: number, delay: number) {
 *       await new Promise((r) => setTimeout(r, delay));
 *       this.increment(amount);
 *     },
 *   },
 * });
 *
 * const store = createStore({
 *   slices: {
 *     counter: counterSlice,
 *   },
 * });
 *
 * // Direct access
 * counterSlice.increment(12);
 * store.counter.increment(1);
 * store.counter.getState(); // { value: 13 }
 *
 * // React usage
 * function App() {
 *   const value = store.counter.useSelect((state) => state.value);
 *
 *   return (
 *     <>
 *       <div>{value}</div>
 *
 *       <button onClick={() => store.counter.increment(1)}>
 *         Increment
 *       </button>
 *
 *       <button onClick={() => store.counter.incrementAfter(1, 1000)}>
 *         Increment later
 *       </button>
 *     </>
 *   );
 * }
 * ```
 *
 * @internal
 * Bootstraps Redux Toolkit, mounts slice tree, and initializes runtime store graph.
 *
 * @prerelease
 * Calling this function will print a pre-release message in the console.
 * This behavior will be removed in the first stable release.
 */
const createStoreWrapper = <T>(props: StoreOptions<T>): Store<T> => {
	if (!informed) ((informed = true), devConsole.log([prereleasMessage]));
	const store = getStore.one();
	if (store) {
		devConsole.warn(["[OrcheStore::createStore] createStore(...) was called more than once.\nOrcheStore currently supports only one global store and will return the existing instance."]); // prettier-ignore
		return store?.node as any;
	}
	return createStore(props);
};

export { createSliceWrapper as createSlice, createStoreWrapper as createStore };
