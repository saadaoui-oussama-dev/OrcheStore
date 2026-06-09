import { createSlice as create, ReducerType } from "@reduxjs/toolkit";
import { getGlobalUtils } from "./global-utils";
import { devConsole } from "./helpers/console";
import { sliceErrors } from "./helpers/errors";
import { object } from "./helpers/object-utils";
import { nestingSeparator, normalizeState } from "./helpers/state";
import { createExposer, normalizeProps, validateKey } from "./helpers/validators";
import type { Dict, Mutations, Slice, SliceData, SliceOptions, Store } from "../types/internal"; // prettier-ignore
import { getStore } from "./create-store";
import { useSelector } from "react-redux";

/** Registered OrcheStore slices and their corresponding Redux Toolkit slices. */
const slices: SliceData[] = [];

/** Creates and initializes an OrcheStore slice. */
const createSlice = <S, R extends Mutations<S>, M>(props: SliceOptions<S, R, M>): Slice<S, R, M> => {
	const sliceData = { children: {}, roots: [] } satisfies Partial<SliceData> as any as SliceData;
	const slice = (sliceData.slice = {} as any);
	const options = normalizeProps(props, {
		method: "createSlice",
		objects: ["mutations", "computed", "methods", "children"],
		unsupported: ["computed", "children"],
		redux: ["reducers", "extraReducers", "reducerPath", "initialState", "selectors"],
		validate: validateStateAndName,
	});

	const expose = createExposer({
		module: "createSlice",
		slice: options.name,
		reserved: ["name", "computed", "root", "global", "getState", "useSelect", "getPath"],
	});

	// Convert mutations into Redux Toolkit reducers.
	expose("mutation", options.mutations, (key, item) => {
		const isReduxOnly = item?._reducerDefinitionType === ReducerType.asyncThunk || "reducer" in { ...(item || {}) };
		if (isReduxOnly) return devConsole.error(sliceErrors.ReduxReducerConflict());
		else if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMutation(key));
		return ((state: any, action: any) => item(state, ...action.payload)) as any;
	});

	// Create and register the underlying Redux Toolkit slice.
	sliceData.redux = create({
		name: options.name,
		initialState: options.state,
		reducers: options.mutations as any,
	});

	object.defineReadonly(slice, "name", () => options.name);

	object.defineReadonly(slice, "global", () => getGlobalUtils());

	object.defineMethod(slice, "getPath", () => getPath(slice));

	object.defineMethod(slice, "getState", () => {
		const errors = sliceErrors.InvalidStore(undefined, "slice.getState", options.name);
		const state = getStore(sliceData, undefined, errors).redux.getState();
		return normalizeState(state, getPath(slice));
	});

	object.defineMethod(slice, "useSelect", (selector: any) => {
		const errors = sliceErrors.InvalidStore(undefined, "slice.useSelect", options.name);
		getStore(sliceData, undefined, errors);
		return useSelector((state: any) => {
			const context = { global: getGlobalUtils() };
			return selector.call(context, normalizeState(state, getPath(slice)), context);
		});
	});

	// Exposing Redux Toolkit actions as auto-dispatching mutations
	Object.entries(sliceData.redux.actions).map(([key, action]: [string, any]) => {
		slice[key] = (...args: any[]) => {
			const errors = sliceErrors.InvalidStore(undefined, "slice mutation", options.name);
			const storeData = getStore(sliceData, undefined, errors);
			return storeData.redux.dispatch(action(args));
		};
	});

	// Bind methods to the slice instance as their `this` context.
	expose("method", options.methods, (key, item) => {
		if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMethod(key));
		return (slice[key] = (...args: any[]) => item.apply(slice, args));
	});

	// Exposing children
	// expose("child", options.children, (key, item) => {
	// 	const childData = getSlice(item);
	// 	if (!childData) return devConsole.error(sliceErrors.InvalidChild(key));
	// 	return (childData.children[key] = item);
	// });

	slices.push(sliceData);
	return slice as Slice<S, R, M>;
};

/** Returns the Redux Toolkit slice associated with the provided OrcheStore slice. */
export function getSlice(slice: Slice<any, Mutations<any>, any>): SliceData | undefined {
	return slices.find((it) => it.slice === slice);
}

// prettier-ignore
export const exposeSliceToParent = (name: string, childData: SliceData, parent: any, store: Store<any>, reducers: any) => {
	const { redux: reduxSlice, children } = childData;
	childData.path = name;
	childData.roots.push(store);
	reducers[name] = reduxSlice.reducer;
	Object.entries(children).forEach(([key, child]) => {
		exposeSliceToParent(name + nestingSeparator + key, getSlice(child)!, childData.slice, store, reducers);
	});
	return (parent[name] = childData.slice);
};

// Validate the slice name and the initial state.
const validateStateAndName = (options: Dict) => {
	const validateState = (state: any) => {
		if (typeof state !== "object") {
			const message = sliceErrors.InvalidState(options.name, state);
			if (message.every((m) => typeof m === "string")) throw new Error(message.join(" "));
			devConsole.error(...message);
			throw new Error();
		}
		if (!state) throw new Error(sliceErrors.RequiredState(options.name));
		return state;
	};

	validateKey(options.name, sliceErrors.RequiredName(), sliceErrors.InvalidName(options.name));
	if (typeof options.state === "function") {
		const initFunc = options.state;
		options.state = () => validateState(initFunc());
	} else validateState(options.state);
};

const getPath = (slice: Slice<any, Mutations<any>, any>) => slice.name;

export { createSlice };
