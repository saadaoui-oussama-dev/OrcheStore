import { devConsole } from "./console";
import { validatorErrors } from "./errors";
import type { Dict, ErrorMode, ExposeContext, ExposeAdapter, NormalizePropsConfig } from "../../types/internal"; // prettier-ignore

/** Reports a validation message by throwing, logging, or warning. */
const report = (message: string, mode?: ErrorMode) => {
	if (!message) return false;
	else if (mode === "warn") devConsole.warn(message);
	else if (mode === "error") devConsole.error(message);
	else throw new Error(message);
};

/** Validates that a key is a non-empty string without "." or "/". */
export const validateKey = (key: unknown, req = "", spec = "", opt?: [ErrorMode, ErrorMode]): key is string => {
	if (typeof key !== "string" || !key) return !!report(req, opt?.[0]);
	if (key.includes(".") || key.includes("/")) return !!report(spec, opt?.[1]);
	return true;
};

/** Validates a layer key before exposing its member. */
const validateLayerKey = (context: ExposeContext, key: string, reserved: string[][]) => {
	const requiredName = validatorErrors.RequiredName(context);
	const invalidName = validatorErrors.InvalidName(context, key);
	if (!validateKey(key, requiredName, invalidName, ["error", "error"])) return;
	else if (reserved[0].includes(key)) return devConsole.error(validatorErrors.ReservedKey(context, key));
	else if (reserved[1].includes(key)) return devConsole.error(validatorErrors.DuplicateKey(context, key));
	return true;
};

/** Validates, adapts, and exposes layer members. */
export const exposeLayer = (context: ExposeContext, layer: Dict, reserved: string[][], adapter: ExposeAdapter) => {
	Object.entries(layer).forEach(([key, item]) => {
		const newValue = validateLayerKey(context, key, reserved) ? adapter(key, item) : undefined;
		if (newValue === undefined) return delete layer[key];
		(layer as any)[key] = newValue;
		reserved[1].push(key);
	});
	return layer;
};

/** Validates and normalizes definition options. */
export function normalizeProps<T>(props: T, config: NormalizePropsConfig): Required<T> {
	// Create a mutable copy of the provided options.
	const options = { ...(props || {}) } as any;

	// Normalize optional object collections.
	config.objects.forEach((layer) => {
		options[layer] = typeof options[layer] === "object" && options[layer] ? { ...options[layer] } : {};
	});

	// Warn when Redux Toolkit-specific options are provided.
	config.redux.forEach((layer) => {
		if (options[layer] !== undefined) devConsole.warn(config.reduxConflict(layer));
	});

	// Return a fully normalized options object.
	return options as Required<T>;
}
