import { MESSAGES } from "../helpers/messages";
import type { Utils } from "../helpers/types"; // prettier-ignore

const props = new Set<string | symbol>(["toJSON", "toString"]);

/**
 * Global utilities proxy registry.
 *
 * Acts as the centralized runtime container for application-wide utilities
 * such as navigation, API clients, logging, and other injected services.
 *
 * Access is dynamically tracked at runtime:
 * - Reads are validated against registered utilities
 * - Writes automatically register new utilities into the runtime registry
 *
 * This proxy ensures utilities remain reactive, extensible, and globally consistent
 * across all slices and store instances.
 */
const utils = new Proxy({} as Utils["utils"], {
	get(target, prop, receiver) {
		if (!props.has(prop)) MESSAGES("utils").GetMissingUtil(prop.toString());
		return Reflect.get(target, prop, receiver);
	},

	set(target, prop, value, receiver) {
		props.add(prop);
		return Reflect.set(target, prop, value, receiver);
	},
});

/**
 * Returns the global utilities registry.
 *
 * The returned object acts as a shared runtime container for application-wide utilities
 * such as navigation, notifications, API clients, and other injected services.
 */
export function getUtils(): Utils["utils"] {
	return utils;
}

/**
 * Registers or updates application-wide utilities.
 *
 * Utilities are merged into the existing runtime registry and become immediately
 * available across all slices and store instances.
 */
export function setUtils(value: Partial<Utils["utils"]>): Utils["utils"] {
	if (value && typeof value === "object" && !Array.isArray(value)) {
		Object.assign(utils, value);
	} else {
		MESSAGES("setUtils").InvalidUtilsArgs(value);
	}

	return utils;
}
