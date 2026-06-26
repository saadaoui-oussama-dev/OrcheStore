import { createStore as _ } from "./store/creator";
import { createSlice as __ } from "./slice/creator";
import { StoreProvider as SP } from "./store/provider";
import { getUtils as GU, setUtils as SU } from "./utils/app-wide";
import { setReporting as SR} from "./helpers/messages";
import { createSlice as CSL, createStore as CST } from "./prerelease";

const defaultExport = {
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
	createStore: CST,

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
	createSlice: CSL,

	/**
	 * Provides an OrcheStore instance to the React component tree.
	 *
	 * The slice hook (`useSelect`) rely on this provider being
	 * present in the component tree.
	 *
	 * @example
	 * ```tsx
	 * import { StoreProvider, createStore } from "orchestore";
	 *
	 * const store = createStore(...);
	 *
	 * export function AppWrapper() {
	 *   return (
	 *     <StoreProvider store={store}>
	 *       <App />
	 *     </StoreProvider>
	 *   );
	 * }
	 * ```
	 *
	 * @internal
	 * Uses React-Redux Provider internally to bind the underlying Redux store
	 * into React context.
	 */
	StoreProvider: SP,

	/**
	 * Returns the global utilities registry.
	 *
	 * The returned object acts as a shared runtime container for application-wide utilities
	 * such as navigation, notifications, API clients, and other injected services.
	 *
	 * Accessing an unregistered utility will trigger a development warning.
	 */
	getUtils: GU,

	/**
	 * Registers or updates application-wide utilities.
	 *
	 * Utilities are merged into the existing runtime registry and become immediately
	 * available across all slices and store instances.
	 *
	 * This is the core mechanism behind OrcheStore’s global runtime utility system shared across all slices.
	 */
	setUtils: SU,

	/**
	 * Configures runtime diagnostic reporting behavior.
	 *
	 * Supports enabling/disabling logs, warnings, and errors globally or individually.
	 */
	setReporting: SR,
};

const { createStore, createSlice, StoreProvider, getUtils, setUtils, setReporting } = defaultExport;

export { defaultExport as default, createStore, createSlice, StoreProvider, getUtils, setUtils, setReporting };

export type * from "./types";
