import { MESSAGES } from "./messages";
import { Dict } from "./types";

const defineProp = Object.getOwnPropertyDescriptor(Object, "defineProperty")?.value || Object.defineProperty;

/**
 * Defines a read-only property using a getter.
 *
 * The property is enumerable but not configurable, ensuring
 * it cannot be deleted or redefined at runtime.
 */
export const defineReadonly = <T, K extends keyof T>(object: T, prop: K, getter: () => T[K]): void => {
	defineProp(object, prop, {
		get: getter,
		enumerable: true,
		configurable: false,
	});
};

/**
 * Defines an immutable method on an object.
 *
 * The method is enumerable but non-writable and non-configurable,
 * ensuring it behaves like a stable API surface.
 */
export const defineMethod = <T, K extends keyof T>(object: T, prop: K, method: T[K]): void => {
	defineProp(object, prop, {
		value: method,
		writable: false,
		enumerable: true,
		configurable: false,
	});
};

/**
 * Validates a property key.
 *
 * Keys must be non-empty strings, cannot contain "." or "/",
 * and must not conflict with existing reserved keys.
 *
 * Returns the validated key or reports a development error when invalid.
 */
export const validateKey = (trigger: string, layer: string, key: string, reserved: string[], slice?: string) => {
	if (!key || typeof key !== "string" || key.includes(".") || key.includes("/")) {
		return void MESSAGES(trigger, slice).InvalidKey(layer, key);
	}

	if (reserved.includes(key)) {
		return void MESSAGES(trigger, slice).DuplicateKey(layer, key);
	}

	return key;
};

/**
 * Validates and normalizes a node name.
 *
 * Names are required, must be non-empty strings, and cannot contain
 * "." or "/" since those characters are reserved for path semantics.
 *
 * Returns the validated name or reports a development error when invalid.
 */
export const validateName = (trigger: string, props: Dict, defaultName?: string) => {
	if (defaultName && (props.name === undefined || props.name === null || props.name === "")) {
		return defaultName;
	}

	if (!Object.hasOwn(props, "name")) {
		return void MESSAGES(trigger).RequiredName(props);
	}

	if (!props.name || typeof props.name !== "string" || props.name.includes(".") || props.name.includes("/")) {
		return void MESSAGES(trigger).InvalidName(props.name);
	}

	return props.name;
};
