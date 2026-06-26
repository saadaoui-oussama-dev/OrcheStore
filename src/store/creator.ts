import { createStoreGetter } from "./getter";
import { exposeStoreSelectors } from "./selectors";
import { createNodeFactory } from "../factory/creator";
import { attachStoreChildren } from "../slice/creator";
import { defineMethod } from "../helpers/internal";
import { configureRTKStore } from "../helpers/imports";
import type { AnyStore, AnyStoreOptions, Store, StoreOptions } from "../helpers/types";
import type { ExtraMeta } from "./types";
import { exposeContext, validateAndNormalizeProps } from "./context";

const createStoreFactory = createNodeFactory<AnyStore, AnyStoreOptions, ExtraMeta, undefined, string[]>;

const { instances, create } = createStoreFactory({
	options: {
		prepare: validateAndNormalizeProps,
	},

	/**
	 * Creates a runtime store instance.
	 *
	 * This function builds the OrcheStore root node, attaches utilities.
	 */
	instantiate(props, meta) {
		meta.node = {} as any;

		const reserved = ["name", "computed", "utils", "getState", "useSelect"];

		exposeContext(props.name!, meta);

		defineMethod(meta.node, "getState", () => meta.redux.getState() as any);

		exposeStoreSelectors(props.name!, meta);

		return reserved;
	},

	/**
	 * Finalizes store creation after initialization.
	 *
	 * Attaches slice trees, composes reducers, and creates the underlying
	 * Redux Toolkit store instance used at runtime.
	 */
	afterInstantiate(props, meta, _family, cloning, reserved) {
		meta.reducer = Object.fromEntries(attachStoreChildren("", meta as any, cloning, props.slices, reserved));

		meta.redux = configureRTKStore({ reducer: meta.reducer, devTools: props.devTools });
	},
});

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
 */
const createStore = <T>(props: StoreOptions<T>): Store<T> => (create as any)(props);

/**
 * Internal store metadata registry accessor.
 *
 * Used to resolve store instances from the internal factory system.
 */
const getStore = createStoreGetter(instances);

export { createStore, getStore };
