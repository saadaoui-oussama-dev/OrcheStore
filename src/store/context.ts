import { getUtils } from "../utils/app-wide";
import { defineReadonly, ensureObjects, validateName } from "../helpers/internal";
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
	const source = { ...(props || {}) } as any;

	const name = validateName("createStore", source, false);
	const output = ensureObjects({ name }, source, ['slices']);

	Object.entries(mismatch).forEach(([prop, replace]) => {
		if (source[prop] === undefined) return;
		if (replace) MESSAGES("createStore", output.name, "Store").ReduxMismatchProp(prop, replace);
		else MESSAGES("createStore", output.name, "Store").UnsupportedReduxProp(prop);
	});

	return output;
};
