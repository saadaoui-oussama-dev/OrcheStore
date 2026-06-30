import { normalizeSafeState } from "./state";
import { getStore } from "../store/creator";
import { getUtils } from "../utils/app-wide";
import { defineReadonly, ensureObjects, validateName } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { AnySlice, AnySliceOptions, CloneArgs, Meta } from "../helpers/types";

/**
 * Exposes runtime properties on a slice instance.
 *
 * Provides read-only access to slice identity, location within the runtime tree,
 * and shared application utilities.
 *
 * These values are resolved dynamically at runtime, ensuring each slice reflects
 * its actual position within the store hierarchy.
 *
 * This is the core layer behind OrcheStore’s runtime tree model, enabling parent-child traversal.
 */
export const exposeContext = (name: string, meta: Meta, instances: Map<AnySlice, Meta>) => {
	defineReadonly(meta.node, "name", () => {
		return name;
	});

	defineReadonly(meta.node, "path", () => {
		return meta.path;
	});

	defineReadonly(meta.node, "root", () => {
		return getStore.of(name, meta)?.node!;
	});

	defineReadonly(meta.node, "parent", () => {
		const parentOrRoot = meta.parents[0]?.node;
		return parentOrRoot ? instances.get(parentOrRoot)?.node : undefined;
	});

	defineReadonly(meta.node, "utils", () => {
		return getUtils();
	});
};

/**
 * Validates and normalizes input configuration into a safe runtime format.
 *
 * Ensures slice configuration is properly shaped, applies default normalization,
 * and reports unsupported or misplaced Redux Toolkit options.
 */
export const validateAndNormalizeProps = (props: AnySliceOptions) => {
	const mismatch = { initialState: "'state'", reducer: "'mutations'", reducers: "'mutations'", extraReducers: "'listeners'", selectors: "'computed'", reducerPath: "nested slices throught 'children'" }; // prettier-ignore
	const source = { ...(props || {}) } as any;

	const name = validateName("createSlice", source, true);
	const state = normalizeSafeState("createSlice", name, source.state, true);
	const output = ensureObjects({ name, state }, source, ["mutations", "methods", "children"]); // TODO: add "computed"

	Object.entries(mismatch).forEach(([prop, replace]) => {
		if (source[prop] === undefined) return;
		MESSAGES("createSlice", output.name).ReduxMismatchProp(prop, replace);
	});

	return output;
};

/**
 * Produces the initial state for a cloned node.
 *
 * Reconstructs state by running the full reducer tree with an initialization action.
 * This ensures cloned instances start from a fully composed state snapshot.
 */
export const onCloneProps = (props: AnySliceOptions, meta: Meta, payload?: CloneArgs) => {
	if (payload?.object) return { ...props, state: payload.object };

	let next = ensureObjects({ name: props.name }, props, ["mutations", "methods"]);
	const originState: any = meta.reducer(undefined, { type: "@@CLONE" });
	const transformedState = payload?.transform ? payload.transform(originState, next) : undefined;
	const clonedState = transformedState === undefined ? originState : transformedState;

	next = ensureObjects({ name: next.name }, next, ["mutations", "methods"]);
	const name = validateName("createSlice", next, true);
	const state = normalizeSafeState("slice.clone", payload?.name ?? "", clonedState);

	return { ...props, ...next, name, state };
};
