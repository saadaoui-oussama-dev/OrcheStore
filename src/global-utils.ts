import { devConsole } from "./helpers/console";
import { typeChecker } from "./helpers/type-checker";
import { object, array, reflect } from "./helpers/object-utils";
import { globalUtilsErrors } from "./helpers/errors";
import type { GlobalUtils } from "../types";

const globalUtils = new Proxy({} as GlobalUtils["global"], {
	get(target, prop, receiver) {
		if (!(prop in target)) devConsole.error(...globalUtilsErrors.GetMissingProp(prop));
		return reflect.get(target, prop, receiver);
	},

	set(target, prop, value, receiver) {
		return reflect.set(target, prop, value, receiver);
	},

	deleteProperty(target, prop) {
		devConsole.warn(...globalUtilsErrors.DeleteProp(prop));
		return reflect.delete(target, prop);
	},
});

/** Returns the current global utilities object. */
export function getGlobalUtils(): GlobalUtils["global"] {
	return globalUtils;
}

/** Registers or updates application-wide global utilities. */
export function provideGlobalUtils(value: Partial<GlobalUtils["global"]>): GlobalUtils["global"] {
	const typeError = typeChecker(value, (v) => v && typeof v === 'object' && !array.isArray(v)); // prettier-ignore
	if (typeError) devConsole.error(globalUtilsErrors.InvalidArgs(), ...typeError);
	else object.assign(globalUtils, value);
	return globalUtils;
}
