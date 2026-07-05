import { createStoreGetter } from "./getter";
import { exposeStateSelectors } from "./selectors";
import { exposeContext, validateAndNormalizeProps } from "./context";
import { createNodeFactory } from "../factory/creator";
import { attachStoreChildren } from "../slice/creator";
import { defineMethod } from "../helpers/internal";
import { configureRTKStore } from "../helpers/imports";
import type { AnyStore, AnyStoreOptions, Store, StoreOptions, StoreMeta } from "../helpers/types"; // prettier-ignore

const createStoreFactory = createNodeFactory<AnyStore, AnyStoreOptions, StoreMeta, undefined, string[]>;

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

		exposeStateSelectors(props.name!, meta);

		return reserved;
	},

	/**
	 * Finalizes store creation after initialization.
	 *
	 * Attaches slice trees, composes reducers, and creates the underlying
	 * Redux Toolkit store instance used at runtime.
	 */
	afterInstantiate(props, meta, cloning, reserved) {
		// Clone or reuse children and expose them.
		meta.reducer = Object.fromEntries(attachStoreChildren(props.name!, meta as any, cloning, props.slices, reserved));

		// Create the underlying Redux Toolkit store.
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
 */
const createStore = <T>(props: StoreOptions<T>): Store<T, false> => (create as any)(props);

/**
 * Internal store metadata registry accessor.
 *
 * Used to resolve store instances from the internal factory system.
 */
const getStore = createStoreGetter(instances);

export { createStore, getStore };
