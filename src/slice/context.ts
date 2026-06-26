import { normalizeSafeState } from "./state";
import { getStore } from "../store/creator";
import { getUtils } from "../utils/app-wide";
import { defineReadonly, validateName } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { AnySlice, AnySliceOptions, Dict, Meta } from "../helpers/types";

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
		return instances.get(meta.parents[0])?.node;
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
	const mismatch = { initialState: "'state'", reducer: "'mutations'", reducers: "'mutations'", extraReducers: "'subscribe'", selectors: "'computed'", reducerPath: "nested slices throught 'children'" }; // prettier-ignore
	const options = { ...(props || {}) } as any;

	options.name = validateName("createSlice", options, true);
	options.state = normalizeSafeState("createSlice", options.name, options.state, true);

	["mutations", "computed", "methods", "subscribe", "children"].forEach((prop) => {
		options[prop] = typeof options[prop] === "object" && options[prop] ? { ...options[prop] } : {};
	});

	Object.entries(mismatch).forEach(([prop, replace]) => {
		if (options[prop] === undefined) return;
		MESSAGES("createSlice", options.name).ReduxMismatchProp(prop, replace);
		delete options[prop];
	});

	return options;
};
