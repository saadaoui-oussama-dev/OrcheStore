import { ReducerType, createSlice as sliceCreator } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getStore } from "./create-store";
import { getGlobalUtils } from "./global-utils";
import { createNodeFactory } from "./node-factory";
import { devConsole } from "./helpers/console";
import { sliceErrors } from "./helpers/errors";
import { object } from "./helpers/object-utils";
import { createExposer, normalizeProps, validateKey } from "./helpers/validators";
import type { AnySlice, AnySliceOptions, CloneArgs, Mutations, Obj, Slice, SliceOptions } from "../types/internal"; // prettier-ignore

type ExtraMeta = { redux: any; reducers: any };

const sliceFactory = createNodeFactory<AnySlice, AnySliceOptions, ExtraMeta, CloneArgs<any, any>>({
	factoryName: "slice",

	instantiate(props, meta, family) {
		const slice = {} as AnySlice;

		const store = (type?: string) =>
			getStore(undefined, meta, type ? sliceErrors.InvalidStore(type, props.name) : false);

		const expose = createExposer({
			module: "createSlice",
			slice: props.name,
			reserved: ["name", "path", "computed", "root", "parent", "prototype", "global", "getState", "useSelect"],
		});

		// Convert mutations into Redux Toolkit reducers.
		const reducers = expose("mutation", false, props.mutations, (key, item) => {
			const isRedux = item?._reducerDefinitionType === ReducerType.asyncThunk || "reducer" in { ...(item || {}) };
			if (isRedux) return devConsole.error(sliceErrors.ReduxReducerConflict());
			if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMutation(key));
			return (state: any, action: any) => {
				if (action?.meta?.path !== meta.path) return;
				return item(state, ...(Array.isArray(action?.payload) ? action?.payload : []));
			};
		});

		// Create and register the underlying Redux Toolkit slice.
		meta.redux = sliceCreator({
			name: props.name,
			initialState: props.state,
			reducers: reducers,
		});

		// Core slice identity metadata.
		object.defineReadonly(slice, "name", () => props.name);
		object.defineReadonly(slice, "path", () => meta.path);

		// Runtime ownership and global context access.
		object.defineReadonly(slice, "global", () => getGlobalUtils());
		object.defineReadonly(slice, "root", () => store().node as any);
		object.defineReadonly(slice, "parent", () => instances.get(meta.parents[0])?.node);

		// State access and React subscription APIs.
		object.defineMethod(slice, "getState", () => {
			let state = store("slice.getState").redux.getState();
			meta.path.split(".").forEach((part) => (state = (state || {})[part]));
			return state || {};
		});
		object.defineMethod(slice, "useSelect", (selector: any) => {
			const context = { global: getGlobalUtils(), root: store("slice.useSelect").node };
			return useSelector((state: any) => {
				meta.path.split(".").forEach((part) => (state = (state || {})[part]));
				return selector.apply(context, [state || {}, context]);
			});
		});
		object.defineReadonly(slice, "computed", () => undefined);

		// Lineage inspection and clone management utilities.
		const prototype = {} as AnySlice["prototype"];
		const getLineage = () => [...(family.siblings.values() || [])];
		object.defineReadonly(slice, "prototype", () => prototype);
		object.defineMethod(prototype, "clone", (stateMdofier) => clone(slice, undefined, stateMdofier));
		object.defineMethod(prototype, "getLineage", () => getLineage());
		object.defineMethod(prototype, "getClones", () => getLineage().filter((it) => it !== slice));
		object.defineMethod(prototype, "isTypeOf", (other) => family === families.get(instances.get(other)?.familyId!));

		// Redux Toolkit actions mapped to auto-dispatching slice mutations
		Object.entries(meta.redux.actions).map(([key, action]: [string, any]) => {
			(slice as any)[key] = (...args: any[]) => {
				args = args.length ? action(args) : action();
				store("slice mutation").redux.dispatch({ ...args, meta: { path: meta.path } });
			};
		});

		// Bind user-defined methods to the slice instance as `this`
		expose("method", false, props.methods, (key, item) => {
			if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMethod(key));
			return (slice[key] = (...args: any[]) => item.apply(slice, args));
		});

		// Register child slices and collect their reducers for composition
		const childReducers = expose("child", true, (props as any).children, (key, item) => {
			const errors = { UnknownNode: (key: string) => devConsole.error(sliceErrors.InvalidChild(key)) };
			const it = attach(key, item, slice, meta, errors);
			if (it) return (((slice as any)[key] = it), instances.get(it)!.reducers);
		});

		// Slice-local reducer wrapper with child reducer propagation.
		meta.reducers = (state: any, action: any) => {
			const actionPath = action?.meta?.path;
			if (typeof actionPath === "string" && !actionPath.startsWith(meta.path)) return state;
			const nextState = { ...meta.redux.reducer(state, action) };
			for (const [key, reducer] of childReducers) nextState[key] = reducer(nextState?.[key], action);
			return nextState;
		};

		return slice;
	},

	options: {
		adapt(props) {
			props = normalizeProps(props, {
				method: "createSlice",
				objects: ["mutations", "computed", "methods", "subscribe", "children"],
				mismatch: {
					initialState: "'state'",
					reducer: "'mutations'",
					reducers: "'mutations'",
					extraReducers: "'subscribe'",
					selectors: "'computed'",
					reducerPath: "nested slices throught 'children'",
				},
				unsupported: ["computed", "subscribe"],
				validate(options) {
					validateKey(options.name, sliceErrors.RequiredName(), sliceErrors.InvalidName(options.name));
					const init = options.state;
					if (typeof init !== "function") return void validateState(options.name, init);
					options.state = () => validateState(options.name, init());
				},
			});
			return props;
		},

		clone(props, meta, _, stateModifier) {
			const originState = meta.reducers(undefined, { type: "@@CLONE" });
			const clonedState = stateModifier ? stateModifier(originState) : originState;
			return { ...props, state: clonedState === undefined ? originState : clonedState };
		},
	},
});

const { families, instances, create, attach, clone } = sliceFactory;

/** Validate the slice initial state. */
const validateState = (name: string, state: any) => {
	if (typeof state !== "object") {
		const message = sliceErrors.InvalidState(name, state);
		if (message.every((m) => typeof m === "string")) throw new Error(message.join(" "));
		devConsole.error(...message);
		throw new Error();
	}
	if (!state) throw new Error(sliceErrors.RequiredState(name));
	return state;
};

/** Creates and initializes an OrcheStore slice. */
const createSlice = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => (create as any)(props);

export { instances as slices, createSlice, attach as attachSlice };
