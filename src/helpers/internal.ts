import { MESSAGES } from "./messages";
import type { Obj } from "../helpers/types"; // prettier-ignore

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
export const validateKey = (trigger: string, name: string, type: string, layer: string, key: string, reserved: string[]) => {
	if (!key || typeof key !== "string" || key.includes(".") || key.includes("/")) {
		return void MESSAGES(trigger, name, type).InvalidKey(layer, key);
	}

	if (reserved.includes(key)) {
		return void MESSAGES(trigger, name, type).DuplicateKey(layer, key);
	}

	return key;
};

/**
 * Validates and normalizes a node name.
 *
 * Ensures the provided name is a valid string and does not contain
 * reserved characters used for path resolution (such as "." and "/").
 *
 * When validation fails or no usable name is provided, a fallback
 * value "untitled" is returned.
 *
 * Returns the normalized node name.
 */
export const validateName = (trigger: string, props: Obj, required: boolean) => {
	if (!required && (props.name === undefined || props.name === null || props.name === "")) {
		return "untitled";
	}

	if (!props.name || typeof props.name !== "string" || props.name.includes(".") || props.name.includes("/")) {
		MESSAGES(trigger).InvalidName(props.name, required);
		return "untitled";
	}

	return props.name;
};

/**
 * Ensures the specified properties exist as shallow-cloned objects.
 *
 * Copies each requested property from the source when it is a non-null object,
 * otherwise initializes it as an empty object. The resulting object is typed to
 * guarantee the requested properties are present as object values.
 *
 * Used to normalize optional configuration sections before runtime processing,
 * allowing later stages to safely read and mutate these objects without
 * additional existence checks.
 */
export const ensureObjects = <O, T extends object, K extends keyof T>(output: O, source: T, props: readonly K[]) => {
	props.forEach((prop) => {
		(output as any)[prop] = typeof source[prop] === "object" && source[prop] ? { ...source[prop] } : {};
	});

	return output as O & { [P in K]: Obj };
};
