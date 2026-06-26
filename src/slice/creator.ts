import { exposeContext, validateAndNormalizeProps } from "./context";
import { exposeMethods } from "./methods";
import { exposeStateSelectors } from "./selectors";
import { exposeMutations, mutationsToReducers } from "./mutations";
import { createNodeFactory } from "../factory/creator";
import { createAttachHelper } from "../factory/attach";
import { exposeLineage } from "../factory/prototype";
import { createRTKSlice } from "../helpers/imports";
import { getChildState, composeStateReducer, exposeStateAccessors, excludeChildState, cloneState } from "./state"; // prettier-ignore
import type { AnySlice, AnySliceOptions, CloneArgs, Mutations, Meta, Obj, Slice, SliceOptions } from "../helpers/types"; // prettier-ignore

const createSliceFactory = createNodeFactory<AnySlice, AnySliceOptions, Meta, CloneArgs, string[]>;

const { instances, create, attach, clone } = createSliceFactory({
	options: {
		prepare: validateAndNormalizeProps,
		clone: (props, meta, _, payload) => ({ ...props, state: cloneState(meta, payload) }),
		currentCloned: (props) => excludeChildState(props),
		childCloned: (key, props) => ({ object: getChildState(key, props) }),
	},

	/**
	 * Creates and initializes a slice runtime instance.
	 *
	 * Sets up Redux Toolkit integration, state accessors, selectors,
	 * lineage tracking, mutations, methods, and runtime context.
	 */
	instantiate(props, meta, family) {
		// Create the runtime node placeholder before exposing APIs.
		meta.node = {} as any;

		// Property names reserved by the framework and unavailable to users.
		const reserved = ["name", "path", "computed", "root", "parent", "prototype", "utils", "getState", "getInitialState", "useSelect"]; // prettier-ignore

		// Convert mutation functions into Redux reducers.
		const reducer = mutationsToReducers(props.name, meta, props.mutations, reserved);

		// Create the underlying Redux Toolkit slice.
		meta.redux = createRTKSlice(props.name, props.state, reducer);

		// Expose runtime ownership and tree context APIs.
		exposeContext(props.name, meta, instances);

		// Expose React selector hooks.
		exposeStateSelectors(props.name, meta);

		// Expose imperative state access APIs.
		exposeStateAccessors(props.name, meta);

		// Expose cloning and lineage utilities.
		exposeLineage(meta, family, instances, clone, (transform?: CloneArgs["transform"]) => {
			return { name: props.name, transform };
		});

		// Expose directly callable mutation functions.
		exposeMutations(props.name, meta);

		// Expose methods and bind runtime context.
		exposeMethods(props.name, meta, props.methods, reserved);

		// Return reserved property names for validation and collision checks.
		return reserved;
	},

	/**
	 * Finalizes slice initialization after the runtime instance
	 * has been created and after ownership propagation.
	 *
	 * Attaches child slices and composes their reducers into
	 * the parent reducer tree.
	 */
	afterInstantiate(props, meta, _, cloning, reserved) {
		// Clone or reuse children and expose them.
		const reducers = attachSliceChildren(meta.node.name, meta, cloning, props.children, reserved);

		// Merge child reducers into the parent reducer structure.
		meta.reducer = composeStateReducer(meta.node.name, meta, reducers);
	},
});

const attachSliceChildren = createAttachHelper("createSlice", "Slice", "child", { attach, respone: (c) => c.reducer });
const attachStoreChildren = createAttachHelper("createStore", "Store", "slice", { attach, respone: (c) => c.reducer });

/**
 * Creates and initializes a slice runtime instance.
 *
 * This function constructs a fully functional OrcheStore slice,
 * including state, mutations, methods, and nested children.
 */
const createSlice = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => (create as any)(props);

export { createSlice, attachStoreChildren };
