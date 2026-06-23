import { MESSAGES } from "./helpers/messages";
import type { Utils } from "../types";

const props = new Set<string | symbol>(["toJSON", "toString"]);

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

/** Returns the current utilities object. */
export function getUtils(): Utils["utils"] {
	return utils;
}

/** Registers or updates application-wide utilities. */
export function provideUtils(value: Partial<Utils["utils"]>): Utils["utils"] {
	if (value && typeof value === "object" && !Array.isArray(value)) Object.assign(utils, value);
	else MESSAGES("provideUtils").InvalidUtilsArgs(value);
	return utils;
}
