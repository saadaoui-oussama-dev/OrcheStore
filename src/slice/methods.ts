import { validateKey } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { Meta } from "../helpers/types";

/**
 * Wraps a raw function into a safe runtime method bound to a slice instance.
 *
 * If the provided value is not a function, a development error is triggered
 * and the method is not exposed.
 */
const validateMethod = (name: string, meta: Meta, key: string, method: any) => {
	return typeof method !== "function"
		? MESSAGES("createSlice", name).InvalidMethod(key, method)
		: (...args: any[]) => method.apply(meta.node, args);
};

/**
 * Exposes user-defined methods on a slice instance.
 *
 * Each method is validated, bound to the slice runtime context, and attached
 * to the public node API. Invalid entries are removed during initialization.
 *
 * Method names must be unique and must not collide with reserved runtime keys.
 *
 * This is the core mechanism behind OrcheStore’s function-oriented runtime model,
 * enabling methods to behave as context-aware instance members.
 */
export const exposeMethods = (name: string, meta: Meta, methods: any, reserved: string[]) => {
	Object.entries(methods).forEach(([k, item]) => {
		const key = validateKey("createSlice", name, "Slice", "method", k, reserved)!;
		const method = key ? validateMethod(name, meta, key, item) : undefined;

		if (!method) return delete methods[key];

		(meta.node as any)[key] = method;
		reserved.push(key);
	});
};
