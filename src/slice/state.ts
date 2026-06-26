import { getStore } from "../store/creator";
import { defineMethod } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { AnySlice, AnySliceOptions, CloneArgs, Meta } from "../helpers/types";

/**
 * Normalizes a state definition into a safe object value.
 *
 * Supports both direct state objects and lazy state initializer functions.
 * Invalid values trigger a development error and fall back to an empty object.
 */
export const normalizeSafeState = (trigger: string, name: string, state: any, acceptLazy?: boolean) => {
	// Preserve lazy state initializers.
	if (typeof state === "function" && acceptLazy) {
		return () => normalizeSafeState(trigger, name, state(), false);
	}

	// Accept plain object state definitions.
	if (state === undefined || state === null) return {};
	if (typeof state === "object" && !Array.isArray(state)) return state;

	// Report errors and fall back to an empty object.
	if (acceptLazy === false) return (MESSAGES(trigger, name).InvalidStateProp(state), {});
	return (MESSAGES(trigger, name).InvalidStateClone(state), {});
};

/**
 * Exposes imperative state access APIs on a node.
 *
 * Provides methods for reading both the current runtime
 * state and the initial state associated with the node.
 */
export const exposeStateAccessors = (name: string, meta: Meta) => {
	defineMethod(meta.node, "getState", () => {
		const state = getStore.of(name, meta, "slice.getState")?.redux.getState();
		return resolveDeepState(meta.path, state);
	});

	defineMethod(meta.node, "getInitialState", (() => {
		return meta.redux.getInitialState();
	}) as AnySlice["getInitialState"]);

	defineMethod(meta.node.getInitialState, "deep", () => {
		return meta.reducer(undefined, { type: "@@INIT" });
	});
};

/**
 * Composes a hierarchical reducer for a slice and all its children.
 *
 * Each child slice reducer is executed after the parent reducer,
 * allowing nested state trees to update in a predictable order.
 *
 * This is the core mechanism behind OrcheStore’s nested slice system.
 */
export const composeStateReducer = (_name: string, meta: Meta, children: any) => {
	return (state: any, action: any) => {
		// Run base reducer first
		const nextState = { ...(meta.redux.reducer(state, action) as any) };

		// Propagate action to all child reducers
		for (const [key, reducer] of children) {
			nextState[key] = reducer(nextState?.[key], action);
		}

		return nextState;
	};
};

/**
 * Produces the initial state for a cloned node.
 *
 * Reconstructs state by running the full reducer tree with an initialization action.
 * This ensures cloned instances start from a fully composed state snapshot.
 */
export const cloneState = (meta: Meta, payload?: CloneArgs) => {
	if (payload?.object) return payload?.object;
	const originState: any = meta.reducer(undefined, { type: "@@CLONE" });
	const transformedState = payload?.transform ? payload.transform(originState) : undefined;
	const clonedState = transformedState === undefined ? originState : transformedState;
	return normalizeSafeState("slice.clone", payload?.name ?? "", clonedState);
};

/**
 * Removes child-owned state from a parent's state definition.
 *
 * This ensures each child node manages its own portion of the state tree
 * independently during instantiation.
 */
export const excludeChildState = (props: AnySliceOptions) => {
	const state = { ...props.state };
	Object.keys(props.children).forEach((c) => delete state[c]);
	return { ...props, state };
};

/**
 * Extracts the state owned by a child node.
 *
 * Returns a shallow copy of the child's state definition for use during
 * child instantiation or cloning.
 */
export const getChildState = (key: string, props: AnySliceOptions) => {
	return { ...props.state[key] };
};

/**
 * Resolves a nested value from an object using a dot-separated path.
 *
 * Safely traverses the input state without throwing if intermediate values are missing.
 */
export const resolveDeepState = (path: string, state: any) => {
	let current = state || {};

	path.split(".").forEach((part) => {
		current = current?.[part] ?? {};
	});

	return current;
};
