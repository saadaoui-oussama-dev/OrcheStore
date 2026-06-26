import { normalizeSafeState } from "./state";
import { getStore } from "../store/creator";
import { getUtils } from "../utils/app-wide";
import { defineReadonly, validateName } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { AnySlice, AnySliceOptions, Dict, Meta } from "../helpers/types";

/**
 * Exposes runtime tree access properties on a slice instance.
 *
 * This layer provides read-only access to the slice’s position within the runtime hierarchy,
 * including its name, full path, root store, parent node, and shared utilities.
 *
 * These values are dynamically resolved from the current runtime context, ensuring each instance
 * always reflects its actual location within the slice tree rather than static definition-time structure.
 *
 * This is the core mechanism behind OrcheStore’s runtime tree model, enabling parent-child traversal.
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
 * Enforces naming rules, sanitizes state, groups optional configuration
 * sections, and reports unsupported or misplaced fields.
 */
export const validateAndNormalizeProps = (props: AnySliceOptions) => {
	const slice = props?.name;
	const mismatch = { initialState: "'state'", reducer: "'mutations'", reducers: "'mutations'", extraReducers: "'subscribe'", selectors: "'computed'", reducerPath: "nested slices throught 'children'" }; // prettier-ignore
	const objects = ["mutations", "computed", "methods", "subscribe", "children"];
	const validate = (props: Dict) => {
		props.name = validateName("createSlice", props)!;
		props.state = normalizeSafeState("createSlice", props.name, props.state, true);
	};

	const options = { ...(props || {}) } as any;

	objects.forEach((prop) => {
		options[prop] = typeof options[prop] === "object" && options[prop] ? { ...options[prop] } : {};
	});

	validate(options);

	Object.entries(mismatch).forEach(([prop, replace]) => {
		if (options[prop] === undefined) return;
		if (replace) MESSAGES("createSlice", slice).ReduxMismatchProp(prop, replace);
		else MESSAGES("createSlice", slice).UnsupportedReduxProp(prop);
	});

	return options;
};
