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
export const validateLayerKey = (context: ExposeContext, type: string, key: string, reserved: string[][]) => {
	const requiredName = validatorErrors.RequiredName(context, type);
	const invalidName = validatorErrors.InvalidName(context, type, key);
	if (!validateKey(key, requiredName, invalidName, ["error", "error"])) return;
	else if (reserved[0].includes(key)) return devConsole.error(validatorErrors.ReservedKey(context, type, key));
	else if (reserved[1].includes(key)) return devConsole.error(validatorErrors.DuplicateKey(context, type, key));
	return true;
};

/** Validates, adapts, and exposes layer members. */
export const createExposer = (context: ExposeContext) => {
	const exposed: string[] = [];
	const reserved = [context.reserved, exposed];
	return (type: string, layer: any, adapter: ExposeAdapter) => {
		const response = {} as any;
		Object.entries(layer as any).forEach(([key, item]) => {
			const newValue = validateLayerKey(context, type, key, reserved) ? adapter(key, item) : undefined;
			if (newValue !== undefined) (((response as any)[key] = newValue), exposed.push(key));
		});
		return response;
	};
};

/** Validates and normalizes definition options. */
export const normalizeProps = <T>(props: T, config: NormalizePropsConfig): Required<T> => {
	const options = { ...(props || {}) } as any;
	config.objects?.forEach((layer) => {
		options[layer] = typeof options[layer] === "object" && options[layer] ? { ...options[layer] } : {};
	});
	config.validate?.(options);
	config.redux?.forEach((layer) => {
		if (options[layer] === undefined) return;
		devConsole.warn(`[OrcheStore::${config.method}] '${layer}' property is a Redux Toolkit option and is ignored by OrcheStore.`); // prettier-ignore
	});
	config.unsupported?.forEach((layer) => {
		if (Object.keys((options as any)[layer]).length < 1) return;
		devConsole.warn(`[OrcheStore::${config.method}] '${layer}' property is not yet supported and will be ignored.`); // prettier-ignore
	});
	return options as Required<T>;
};
