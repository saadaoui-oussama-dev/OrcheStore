import { getUtils } from "../utils/app-wide";
import { defineReadonly, validateName } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { AnyStore, AnyStoreOptions, ExtraMeta, NodeMeta } from "../helpers/types";

/**
 * Exposes runtime properties on a store instance.
 *
 * Provides read-only access to the store identity and shared utilities.
 */
export const exposeContext = (name: string, meta: NodeMeta<AnyStore, ExtraMeta>) => {
	defineReadonly(meta.node, "name", () => {
		return name;
	});

	defineReadonly(meta.node, "utils", () => {
		return getUtils();
	});
};

/**
 * Validates and normalizes input configuration into a safe runtime format.
 *
 * Ensures store configuration is properly shaped, applies default normalization,
 * and reports unsupported or misplaced Redux Toolkit options.
 */
export const validateAndNormalizeProps = (props: AnyStoreOptions) => {
	const mismatch = { reducer: "'slices'", reducers: "'slices'", devTools: "", duplicateMiddlewareCheck: "", enhancers: "", middleware: "", preloadedState: "" }; // prettier-ignore
	const options = { ...(props || {}) } as any;
	const store = options.name;

	options.name = validateName("createStore", options, "default")!;

	["slices"].forEach((prop) => {
		options[prop] = typeof options[prop] === "object" && options[prop] ? { ...options[prop] } : {};
	});

	Object.entries(mismatch).forEach(([prop, replace]) => {
		if (options[prop] === undefined) return;
		if (replace) MESSAGES("createStore", store, "Store").ReduxMismatchProp(prop, replace);
		else MESSAGES("createStore", store, "Store").UnsupportedReduxProp(prop);
		delete options[prop];
	});

	return options;
};
