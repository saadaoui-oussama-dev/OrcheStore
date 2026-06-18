import { ReducerType, createSlice as sliceCreator } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getStore } from "./create-store";
import { getGlobalUtils } from "./global-utils";
import { createNodeFactory } from "./node-factory";
import { devConsole } from "./helpers/console";
import { sliceErrors } from "./helpers/errors";
import { object } from "./helpers/object-utils";
import { createExposer, normalizeProps, validateKey } from "./helpers/validators";
import type { AnySlice, AnySliceOptions, Mutations, Obj, Slice, SliceOptions } from "../types/internal"; // prettier-ignore

const { instances, create, attach } = createNodeFactory<AnySlice, AnySliceOptions, { redux: any; reducers: any }>({
	factoryName: "slice",

	instantiate(props, meta) {
		const slice = {} as AnySlice;

		const store = (type?: string) =>
			getStore(undefined, meta, type ? sliceErrors.InvalidStore(type, props.name) : false);

		const expose = createExposer({
			module: "createSlice",
			slice: props.name,
			reserved: ["name", "path", "computed", "root", "global", "children", "getState", "useSelect"],
		});

		// Convert mutations into Redux Toolkit reducers.
		const reducers = expose("mutation", false, props.mutations, (key, item) => {
			const isRedux = item?._reducerDefinitionType === ReducerType.asyncThunk || "reducer" in { ...(item || {}) };
			if (isRedux) return devConsole.error(sliceErrors.ReduxReducerConflict());
			if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMutation(key));
			return (state: any, action: any) => (action?.meta?.path === meta.path ? item(state, ...action.payload) : state);
		});

		// Create and register the underlying Redux Toolkit slice.
		meta.redux = sliceCreator({
			name: props.name,
			initialState: props.state,
			reducers: reducers,
		});

		object.defineReadonly(slice, "name", () => props.name);
		object.defineReadonly(slice, "path", () => meta.path);
		object.defineReadonly(slice, "global", () => getGlobalUtils());
		object.defineReadonly(slice, "root", () => store().node as any);

		object.defineMethod(slice, "getState", () => {
			let state = store("slice.getState").redux.getState();
			meta.path.split(".").forEach((part) => (state = (state || {})[part]));
			return state;
		});

		object.defineMethod(slice, "useSelect", (selector: any) => {
			const context = { global: getGlobalUtils(), root: store("slice.useSelect").node };
			return useSelector((state: any) => {
				meta.path.split(".").forEach((part) => (state = (state || {})[part]));
				return selector.apply(context, [state, context]);
			});
		});

		// Exposing Redux Toolkit actions as auto-dispatching mutations
		Object.entries(meta.redux.actions).map(([key, action]: [string, any]) => {
			(slice as any)[key] = (...args: any[]) => {
				store("slice mutation").redux.dispatch({ ...action(args), meta: { path: meta.path } });
			};
		});

		// Exposing methods with binding to the slice instance as their `this` context.
		expose("method", false, props.methods, (key, item) => {
			if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMethod(key));
			return (slice[key] = (...args: any[]) => item.apply(slice, args));
		});

		// Exposing children and normalize reducers
		const childReducers = expose("child", true, (props as any).children, (key, item) => {
			const errors = { UnknownNode: (key: string) => devConsole.error(sliceErrors.InvalidChild(key)) };
			const it = attach(key, item, slice, meta, errors);
			if (it) return (((slice as any)[key] = it), instances.get(it)!.reducers);
		});

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
			return normalizeProps(props, {
				method: "createSlice",
				objects: ["mutations", "computed", "methods", "children"],
				unsupported: ["computed", "children"],
				redux: ["reducers", "extraReducers", "reducerPath", "initialState", "selectors"],
				validate(options) {
					validateKey(options.name, sliceErrors.RequiredName(), sliceErrors.InvalidName(options.name));
					const init = options.state;
					if (typeof init !== "function") return void validateState(options.name, init);
					options.state = () => validateState(options.name, init());
				},
			});
		},

		clone(props, meta) {
			const state = meta.redux.getInitialState();
			return { ...props, state };
		},
	},
});

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
