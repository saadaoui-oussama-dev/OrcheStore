import { console } from "./helpers/console";
import { object, array, reflect } from "./helpers/object-utils";
import type { GlobalUtils } from "../types";

const messages = {
  GetMissingProp: (prop: any) => [
    "OrcheStore[global-utils] Attempted to access a global utility before it became available. Missing property",
    prop,
    "\nIf this utility is optional, register it as undefined using provideGlobalUtils(...) to suppress future warnings.\n",
  ],

  DeleteProp: (prop: any) => [
    "OrcheStore[global-utils] Avoid deleting properties. Trying to delete property",
    prop,
    "\nUse provideGlobalUtils(...) to set them to undefined instead for type safety.\n",
  ],

  InvalidArgs: "OrcheStore[global-utils] Expected provideGlobalUtils(...) to receive a non-null object. Received:",
};

const globalUtils = new Proxy({} as GlobalUtils, {
  get(target: GlobalUtils, prop, receiver) {
    if (!(prop in target)) console.error(...messages.GetMissingProp(prop));
    return reflect.get(target, prop, receiver);
  },

  set(target: GlobalUtils, prop, value, receiver) {
    return reflect.set(target, prop, value, receiver);
  },

  deleteProperty(target, prop) {
    console.warn(...messages.DeleteProp(prop));
    return reflect.delete(target, prop);
  },
});

/** Returns the current global utilities object. */
export function getGlobalUtils(): GlobalUtils {
  return globalUtils;
}

/** Registers or updates application-wide global utilities. */
export function provideGlobalUtils(value: Partial<GlobalUtils>): GlobalUtils {
  if (value === null || value === undefined) {
    console.error(messages.InvalidArgs, value);
  } else if (array.isArray(value)) {
    console.error(messages.InvalidArgs, `(type: array)`, value);
  } else if (typeof value !== "object") {
    console.error(messages.InvalidArgs, `(type: ${typeof value})`, value);
  } else {
    object.assign(globalUtils, value);
  }
  return globalUtils;
}
