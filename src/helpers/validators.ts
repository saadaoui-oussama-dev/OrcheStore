import { MESSAGES } from "./messages";
import type { Dict } from "../../types/internal";

/** Function that validates, adapts, and exposes structured layer members. */
export type ExposerFunction = (
	type: string,
	entries: boolean,
	layer: any,
	adapter: <K extends string>(key: K, item: any) => any,
) => any;

/** Configuration for normalizing API input properties and structure. */
export type NormalizePropsConfig = {
	method: string;
	slice?: string | undefined;
	objects?: string[];
	mismatch?: Dict<string>;
	validate?: (options: Dict) => void;
};

/** Validates and normalizes definition options. */
export const normalizeProps = <T>(props: T, { method, slice, ...config }: NormalizePropsConfig): Required<T> => {
	const options = { ...(props || {}) } as any;

	config.objects?.forEach((prop) => {
		options[prop] = typeof options[prop] === "object" && options[prop] ? { ...options[prop] } : {};
	});

	config.validate?.(options);

	Object.entries(((config.mismatch || {}) as NormalizePropsConfig["mismatch"])!).forEach(([prop, replace]) => {
		if (options[prop] === undefined) return;
		if (replace) MESSAGES(method, slice).ReduxMismatchProp(prop, replace);
		else MESSAGES(method, slice).UnsupportedReduxProp(prop);
	});

	return options as Required<T>;
};

/** Validates, adapts, and exposes layer members. */
export const createExposer = (method: string, slice: string | undefined, reserved: string[]): ExposerFunction => {
	return (prop, entries, layer, adapter) => {
		const response: any = entries ? [] : {};

		Object.entries(layer as any).forEach(([key, item]) => {
			// Validates a layer key before exposing its member
			if (!key || typeof key !== "string" || key.includes(".") || key.includes("/"))
				return MESSAGES(method, slice).InvalidKey(prop, key);
			if (reserved.includes(key)) return MESSAGES(method, slice).DuplicateKey(prop, key);

			// Exposing a layer member
			const value = adapter(key, item);
			if (value === undefined) return;
			entries ? response.push([key, value]) : ((response as any)[key] = value);
			reserved.push(key);
		});

		return response;
	};
};
