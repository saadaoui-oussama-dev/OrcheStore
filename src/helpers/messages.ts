const log = globalThis.console?.log?.bind?.(globalThis.console) || globalThis.console?.log;
const warn = globalThis.console?.warn?.bind?.(globalThis.console) || globalThis.console?.warn;
const error = globalThis.console?.error?.bind?.(globalThis.console) || globalThis.console?.error;
const clear = globalThis.console?.clear?.bind?.(globalThis.console) || globalThis.console?.clear;

let informed = false;
let reportLevel = { logs: true, warnings: true, errors: true };

export const devConsole = {
	log(message: any[]) {
		if (!message || !message.length || !reportLevel.logs) return;
		log?.(...message);
	},

	warn(message: any[]) {
		if (!message || !message.length || !reportLevel.warnings) return;
		informReporting();
		warn?.(...message);
	},

	error(message: any[]) {
		if (!message || !message.length || !reportLevel.errors) return;
		informReporting();
		error?.(...message);
	},

	throw(message: any[]) {
		if (!message || !message.length) return;
		if (message.every((m) => typeof m === "string")) throw new Error(message.join(" "));
		devConsole.error(message);
		throw new Error();
	},
};

function informReporting() {
	if (informed) return;
	informed = true;
	const DiagnosticsMessage = "[OrcheStore] Warning and error reporting is enabled.\nConfigure it with setReporting(...) to control console output.\n"; // prettier-ignore
	devConsole.log([DiagnosticsMessage]);
}

/** Enables or disables diagnostic logs, warnings, and errors. */
export function setReporting(enabled: boolean): void;
export function setReporting(config: { all?: boolean; logs?: boolean; warnings?: boolean; errors?: boolean }): void;
export function setReporting(level: "logs" | "warnings" | "errors" | "all", enabled: boolean): void;
export function setReporting(level: any, enabled?: boolean) {
	if (typeof level === "boolean") level = { logs: enabled, warnings: enabled, errors: enabled };
	if (typeof level === "string") level = { [level]: enabled };
	if (!level || typeof level !== "object") return;

	level = { ...level };
	reportLevel.logs = !!(level.logs ?? level.all ?? reportLevel.logs);
	reportLevel.warnings = !!(level.warnings ?? level.all ?? reportLevel.warnings);
	reportLevel.errors = !!(level.errors ?? level.all ?? reportLevel.errors);
}

export const MESSAGES = (method: string, slice?: string | undefined) => {
	const exceptions = {
		RequiredName: (any: any) => [`Missing required "name" property.`, ...typed(any, "In")],

		InvalidName: (any: any) => [`"name" must be a non-empty string without '.' or '/'.`, ...typed(any)],

		InvalidStore: (any: any) => [`Expected a store created with createStore(...).`, ...typed(any)],

		NeverExposed: (slice: string) => [`Slice '${slice}' is not reachable from any store. Connect it through createStore({ slices }) or createSlice({ children }).`], // prettier-ignore

		ParentNeverExposed: (slice: string, parent: any) => [`Slice '${slice}' depends on unreachable parent '${parent.name}'. Connect the parent through createStore({ slices }) or createSlice({ children }).`], // prettier-ignore
	};

	const errors = {
		DuplicateKey: (layer: string, key: string) => [`${layer} '${key}' conflicts with another exposed member.`],

		InvalidKey: (layer: string, value: any) => [`${layer} key must be a non-empty string without '.' or '/'.`, ...typed(value)], // prettier-ignore

		InvalidState: (any: any) => [`"state" must be a non-null object or a function returning one.`, ...typed(any)],

		InvalidMutation: (key: string, any: any) => [`Mutation '${key}' must be a function.`, ...typed(any)],

		InvalidMethod: (key: string, any: any) => [`Method '${key}' must be a function.`, ...typed(any)],

		InvalidChild: (key: string, any: any) => [`Child '${key}' must be a slice created with createSlice(...).`, ...typed(any)], // prettier-ignore

		InfiniteOwnership: (key: string) => [`Infinite ownership recursion detected through child '${key}'.`],

		InvalidUtilsArgs: (any: any) => [`Expected a non-null object.`, ...typed(any)],
	};

	const warnings = {
		ReduxThunkReducer: () => [`Redux Toolkit asyncThunk reducers are not supported in mutations. Use methods instead.`],

		ReduxPreparedReducer: () => [`Redux Toolkit prepared reducers are not supported. Use a regular mutation function and/or a method adapter.`], // prettier-ignore

		ReduxMismatchProp: (prop: string, replace: string) => [`'${prop}' is a Redux Toolkit option. Use '${replace}' instead.`], // prettier-ignore

		UnsupportedReduxProp: (prop: string) => [`'${prop}' is a Redux Toolkit option that is not yet supported and will be ignored.`], // prettier-ignore

		GetMissingUtil: (prop: string) => [`'${prop}' was accessed before registration. Register it with setUtils(...) or set it to undefined if optional to suppress this warning.`], // prettier-ignore
	};

	type API = typeof exceptions & typeof errors & typeof warnings;

	return new Proxy({} as { [k in keyof API]: (...args: Parameters<API[k]>) => void }, {
		get(_, name: string) {
			const wrap = (source: (...args: any[]) => any[], printer: (message: any[]) => void) => {
				return (...args: any[]) => {
					const prefix = method ? `[OrcheStore::${method}]` : "[OrcheStore]";
					printer([`${prefix}${slice ? ` Slice: {${slice}}\n` : ""}`, ...source(...args)]);
				};
			};

			if (Object.hasOwn(exceptions, name)) return wrap((exceptions as any)[name], devConsole.throw);
			if (Object.hasOwn(errors, name)) return wrap((errors as any)[name], devConsole.error);
			if (Object.hasOwn(warnings, name)) return wrap((warnings as any)[name], devConsole.warn);
		},
	});
};

function typed<T>(value: T, prefix = "Receive"): any[] {
	if (value === null || value === undefined) return [`\n${prefix}: ${value}`];
	if (Array.isArray(value)) return [`\n${prefix}: array`, value];
	if (typeof value === "object") return [`\n${prefix}: object`, value];
	if (typeof value === "function") return [`\n${prefix}: function`, value];
	return [`\n${prefix}: ${typeof value} (${value})`];
}

if (globalThis.console?.clear) {
	globalThis.console.clear = (...args: Parameters<typeof globalThis.console.clear>) => {
		informed = false;
		clear?.(...args);
	};
}
