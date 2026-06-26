const rawConsole = globalThis.console;

const log = rawConsole?.log?.bind(rawConsole) ?? rawConsole?.log;
const warn = rawConsole?.warn?.bind(rawConsole) ?? rawConsole?.warn;
const error = rawConsole?.error?.bind(rawConsole) ?? rawConsole?.error;
const clear = rawConsole?.clear?.bind(rawConsole) ?? rawConsole?.clear;

let informed = false;
let reportLevel = { logs: true, warnings: true, errors: true };
const informMessage = `[OrcheStore] Warning and error reporting is enabled.\nConfigure it with setReporting(...) to control console output.\n`;

/**
 * Internal development console wrapper.
 *
 * Controls logging, warnings, and errors based on runtime configuration.
 * Also ensures one-time informational output when warnings/errors are enabled.
 */
export const devConsole = {
	log(message: any[]) {
		if (!message?.length || !reportLevel.logs) return;
		log?.(...message);
	},

	warn(message: any[]) {
		if (!message?.length || !reportLevel.warnings) return;
		if (!informed) ((informed = true), devConsole.log([informMessage]));
		warn?.(...message);
	},

	error(message: any[]) {
		if (!message?.length || !reportLevel.errors) return;
		if (!informed) ((informed = true), devConsole.log([informMessage]));
		error?.(...message);
	},

	throw(message: any[]) {
		if (!message?.length) return;
		if (message.every((m) => typeof m === "string")) throw new Error(message.join(" "));
		error?.(...message);
		throw new Error();
	},
};

/**
 * Configures runtime diagnostic reporting behavior.
 *
 * Supports enabling/disabling logs, warnings, and errors globally or individually.
 */
export function setReporting(enabled: boolean): void;
export function setReporting(config: { all?: boolean; logs?: boolean; warnings?: boolean; errors?: boolean }): void;
export function setReporting(level: "logs" | "warnings" | "errors" | "all", enabled: boolean): void;
export function setReporting(level: any, enabled?: boolean) {
	if (typeof level === "boolean") level = { logs: level, warnings: level, errors: level };
	else if (typeof level === "string") level = { [level]: enabled };
	else if (!level || typeof level !== "object") return;

	level = { ...level };
	reportLevel.logs = !!(level.logs ?? level.all ?? reportLevel.logs);
	reportLevel.warnings = !!(level.warnings ?? level.all ?? reportLevel.warnings);
	reportLevel.errors = !!(level.errors ?? level.all ?? reportLevel.errors);
}

/**
 * Produces a human-readable representation of a value's type and structure.
 *
 * @example
 * ```ts
 * readable(undefined); // ["\nGot: undefined"]
 * readable(12);        // ["\nGot: number (12)"]
 * readable("");        // ["\nGot: empty string"]
 * readable("hello");   // ["\nGot: string (hello)"]
 * readable({ a: 1 });  // ["\nGot: object", { a: 1 }]
 * ```
 */
function readable<T>(value: T, prefix = "Got"): any[] {
	if (value === null || value === undefined) return [`\n${prefix}: ${value}`];
	if (Array.isArray(value)) return [`\n${prefix}: array`, value];
	if (typeof value === "object") return [`\n${prefix}: object`, value];
	if (typeof value === "function") return [`\n${prefix}: function`, value];
	if (value === "") return [`\n${prefix}: empty string`];
	return [`\n${prefix}: ${typeof value} (${value})`];
}

/**
 * Typed message factory for OrcheStore errors, warnings, and exceptions.
 *
 * Produces runtime-safe diagnostic messages with structured formatting
 * and consistent prefixing across the framework.
 */
export const MESSAGES = (trigger: string, slice?: string) => {
	type API = typeof exceptions & typeof errors & typeof warnings;

	const exceptions = {
		RequiredName: (value: any) => [`Missing required "name" property.`, ...readable(value, "In")], // prettier-ignore

		InvalidName: (value: any) => [`"name" must be a non-empty string without '.' or '/'`, ...readable(value)], // prettier-ignore

		InvalidStore: (value: any) => [`Expected a store created with createStore(...).`, ...readable(value)], // prettier-ignore

		NeverExposed: (slice: string) => [`Slice '${slice}' is not reachable from any store. Connect it through createStore({ slices }) or createSlice({ children }).`], // prettier-ignore

		ParentNeverExposed: (slice: string, parent: string) => [`Slice '${slice}' depends on unreachable parent '${parent}'. Connect the parent through createStore({ slices }) or createSlice({ children }).`], // prettier-ignore
	};

	const errors = {
		DuplicateKey: (layer: string, key: string) => [`${layer} '${key}' conflicts with another exposed member.`], // prettier-ignore

		InvalidKey: (layer: string, value: any) => [`${layer} key must be a non-empty string without '.' or '/'`, ...readable(value)], // prettier-ignore

		InvalidStateProp: (value: any) => [`"state" must be a non-null object or a function returning one.`, ...readable(value)], // prettier-ignore

		InvalidStateClone: (value: any) => [`cloned state must be a non-null object.`, ...readable(value)], // prettier-ignore

		InvalidMutation: (key: string, value: any) => [`Mutation '${key}' must be a function.`, ...readable(value)], // prettier-ignore

		InvalidThunkReducer: (key: string) => [`Invalid mutation '${key}', asyncThunk reducers are not supported. Use methods instead.`], // prettier-ignore

		InvalidPreparedReducer: (key: string) => [`Invalid mutation '${key}', prepared reducers are not supported. Use a regular mutation or adapter method.`], // prettier-ignore

		InvalidMethod: (key: string, value: any) => [`Method '${key}' must be a function.`, ...readable(value)], // prettier-ignore

		InvalidChild: (key: string, value: any) => [`Child '${key}' must be a slice created with createSlice(...).`, ...readable(value)], // prettier-ignore

		InfiniteOwnership: (key: string) => [`Infinite ownership recursion detected through child '${key}'.`], // prettier-ignore

		InvalidUtilsArgs: (value: any) => [`Expected a non-null object.`, ...readable(value)], // prettier-ignore
	};

	const warnings = {
		ReduxMismatchProp: (prop: string, replace: string) => [`'${prop}' is a Redux Toolkit option. Use '${replace}' instead.`], // prettier-ignore

		UnsupportedReduxProp: (prop: string) => [`'${prop}' is a Redux Toolkit option that is not yet supported and will be ignored.`], // prettier-ignore

		GetMissingUtil: (key: string) => [`'${key}' was accessed before registration. Use setUtils(...) and/or set it to undefined if optional to suppress this warning.`], // prettier-ignore
	};

	const wrap = (src: (...args: any[]) => any[], printer: (message: any[]) => void) => {
		return (...args: any[]) => {
			printer([`[OrcheStore::${trigger}]${slice ? ` Slice: {${slice}}\n` : ""}`, ...src(...args)]);
		};
	};

	return new Proxy({} as { [k in keyof API]: (...args: Parameters<API[k]>) => void }, {
		get(_, name: string) {
			if (Object.hasOwn(exceptions, name)) return wrap(exceptions[name as keyof typeof exceptions], devConsole.throw);
			if (Object.hasOwn(errors, name)) return wrap(errors[name as keyof typeof errors], devConsole.error);
			if (Object.hasOwn(warnings, name)) return wrap(warnings[name as keyof typeof warnings], devConsole.warn);
		},
	});
};

if (globalThis.console?.clear) {
	globalThis.console.clear = (...args: Parameters<typeof globalThis.console.clear>) => {
		informed = false;
		clear?.(...args);
	};
}
