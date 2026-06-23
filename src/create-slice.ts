import { ReducerType, createSlice as sliceCreator } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getStore } from "./create-store";
import { getUtils } from "./global-utils";
import { createNodeFactory } from "./node-factory";
import { MESSAGES } from "./helpers/messages";
import { defineMethod, defineReadonly } from "./helpers/object-utils";
import { createExposer, normalizeProps } from "./helpers/validators";
import type { AnySlice, AnySliceOptions, CloneArgs, Dict, ExposerFunction, Mutations, Obj, Slice, SliceOptions } from "../types/internal"; // prettier-ignore

type ExtraMeta = { redux: any; reducer: any };

type Instantiate = { props: AnySliceOptions; expose: ExposerFunction };

const sliceFactory = createNodeFactory<AnySlice, AnySliceOptions, ExtraMeta, CloneArgs<any, any>, Instantiate>({
	factoryName: "slice",

	options: {
		adapt(props) {
			const slice = props?.name;
			const mismatch = { initialState: "'state'", reducer: "'mutations'", reducers: "'mutations'", extraReducers: "'subscribe'", selectors: "'computed'", reducerPath: "nested slices throught 'children'" }; // prettier-ignore
			const objects = ["mutations", "computed", "methods", "subscribe", "children"];
			return normalizeProps(props, { method: "createSlice", slice, objects, mismatch, validate: validateNameAndState });
		},

		clone(props, meta, _, stateTransformer) {
			const originState = meta.reducer(undefined, { type: "@@CLONE" });
			const clonedState = stateTransformer ? stateTransformer(originState) : originState;
			return { ...props, state: clonedState === undefined ? originState : clonedState };
		},
	},

	instantiate(props, meta, family) {
		const slice = {} as AnySlice;

		const reservedKeys = ["name", "path", "computed", "root", "parent", "prototype", "utils", "getState", "useSelect"];
		const expose = createExposer("createSlice", props.name, reservedKeys);

		const store = (method?: string) =>
			getStore(undefined, meta, {
				NeverExposed: method ? () => MESSAGES(method).NeverExposed(props.name) : undefined,
				InvalidType: method ? (parent) => MESSAGES(method).ParentNeverExposed(props.name, parent) : undefined,
			});

		// Convert mutations into Redux Toolkit reducers.
		const reducers = expose("mutation", false, props.mutations, (key, item) => {
			if (item?._reducerDefinitionType === ReducerType.asyncThunk)
				return MESSAGES("createSlice", props.name).ReduxThunkReducer();
			if ("reducer" in { ...(item || {}) }) return MESSAGES("createSlice", props.name).ReduxPreparedReducer();
			if (typeof item !== "function") return MESSAGES("createSlice", props.name).InvalidMutation(key, item);
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
		defineReadonly(slice, "name", () => props.name);
		defineReadonly(slice, "path", () => meta.path);

		// Runtime ownership and global context access.
		defineReadonly(slice, "utils", () => getUtils());
		defineReadonly(slice, "root", () => store()?.node as any);
		defineReadonly(slice, "parent", () => instances.get(meta.parents[0])?.node);

		// State access and React subscription APIs.
		defineMethod(slice, "getState", () => {
			let state = store("slice.getState")?.redux.getState();
			meta.path.split(".").forEach((part) => (state = (state || {})[part]));
			return state || {};
		});
		defineMethod(slice, "useSelect", (selector: any) => {
			const context = { utils: getUtils(), root: store("slice.useSelect")?.node };
			return useSelector((state: any) => {
				meta.path.split(".").forEach((part) => (state = (state || {})[part]));
				return selector.apply(context, [state || {}, context]);
			});
		});
		defineReadonly(slice, "computed", () => undefined);

		// Lineage inspection and clone management utilities.
		const prototype = {} as AnySlice["prototype"];
		const getLineage = () => [...(family.siblings.values() || [])];
		defineReadonly(slice, "prototype", () => prototype);
		defineMethod(prototype, "clone", (stateMdofier) => clone(slice, undefined, stateMdofier)!);
		defineMethod(prototype, "getLineage", () => getLineage());
		defineMethod(prototype, "getClones", () => getLineage().filter((it) => it !== slice));
		defineMethod(prototype, "isTypeOf", (other) => family === families.get(instances.get(other)?.familyId!));

		// Redux Toolkit actions mapped to auto-dispatching slice mutations
		Object.entries(meta.redux.actions).map(([key, action]: [string, any]) => {
			(slice as any)[key] = (...args: any[]) => {
				args = args.length ? action(args) : action();
				store("slice mutation")?.redux.dispatch({ ...args, meta: { path: meta.path } });
			};
		});

		// Bind user-defined methods to the slice instance as `this`
		expose("method", false, props.methods, (key, item) => {
			if (typeof item !== "function") return MESSAGES("createSlice", props.name).InvalidMethod(key, item);
			return (slice[key] = (...args: any[]) => item.apply(slice, args));
		});

		return { node: slice, props, expose };
	},

	afterInstantiate(slice, meta, _, cloning, { expose, props }) {
		// Register child slices and collect their reducers for composition
		const children = cloning
			? [...meta.children.entries()].map(([key, child]) => {
					return [key, (((slice as any)[key] = child), instances.get(child)!.reducer)];
				})
			: expose("child", true, (props as any).children, (key, item) => {
					const child = attach(key, item, slice, meta, {
						UnknownNode: () => MESSAGES("createSlice", props.name).InvalidChild(key, item),
						InfiniteOwnership: (key) => MESSAGES("createSlice", props.name).InfiniteOwnership(key),
					});
					if (child) return (((slice as any)[key] = child), instances.get(child)!.reducer);
				});

		// Slice-local reducer wrapper with child reducer propagation.
		meta.reducer = (state: any, action: any) => {
			const actionPath = action?.meta?.path;
			if (typeof actionPath === "string" && !actionPath.startsWith(meta.path)) return state;
			const nextState = { ...meta.redux.reducer(state, action) };
			for (const [key, reducer] of children) nextState[key] = reducer(nextState?.[key], action);
			return nextState;
		};

		return slice;
	},
});

const { families, instances, create, attach, clone } = sliceFactory;

/** Validate the slice name and initial state. */
const validateNameAndState = (props: Dict) => {
	if (!Object.hasOwn(props, "name")) return MESSAGES("createSlice").RequiredName(props);
	if (!props.name || typeof props.name !== "string" || props.name.includes(".") || props.name.includes("/"))
		MESSAGES("createSlice").InvalidName(props.name);

	const init = props.state;
	if (!Object.hasOwn(props, "state")) props.state = (MESSAGES("createSlice", props.name).RequiredState(props), {});
	else if (init && typeof init === "object" && !Array.isArray(init)) return;
	else if (typeof init !== "function") props.state = (MESSAGES("createSlice", props.name).InvalidState(init), {});
	else
		props.state = () => {
			const state = init();
			if (state && typeof state === "object" && !Array.isArray(state)) return state;
			return (MESSAGES("createSlice", props.name).InvalidState(state), {});
		};
};

/** Creates and initializes an OrcheStore slice. */
const createSlice = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => (create as any)(props);

export { instances as slices, createSlice, attach as attachSlice };
