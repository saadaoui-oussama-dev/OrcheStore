import { ReducerType, createSlice as sliceCreator, type Reducer } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { getStore } from "./create-store";
import { getUtils } from "./global-utils";
import { createNodeFactory } from "./node-factory";
import { MESSAGES } from "./helpers/messages";
import { defineMethod, defineReadonly } from "./helpers/object-utils";
import { createExposer, normalizeProps } from "./helpers/validators";
import type { AnySlice, AnySliceOptions, CloneArgs, Dict, ExposerFunction, Mutations, Obj, Slice, SliceOptions } from "../types/internal"; // prettier-ignore

type ExtraMeta = { redux: ReturnType<typeof sliceCreator>; reducer: Reducer<unknown> };

type Instantiate = { props: AnySliceOptions; expose: ExposerFunction };

const createSliceFactory = createNodeFactory<AnySlice, AnySliceOptions, ExtraMeta, CloneArgs, Instantiate>;

const { families, instances, create, attach, clone } = createSliceFactory({
	options: {
		adapt(props) {
			const slice = props?.name;
			const mismatch = { initialState: "'state'", reducer: "'mutations'", reducers: "'mutations'", extraReducers: "'subscribe'", selectors: "'computed'", reducerPath: "nested slices throught 'children'" }; // prettier-ignore
			const objects = ["mutations", "computed", "methods", "subscribe", "children"];
			return normalizeProps(props, { method: "createSlice", slice, objects, mismatch, validate: validateNameAndState });
		},

		clone(props, meta, _, payload) {
			if (payload?.object) return { ...props, state: payload?.object };
			const originState: any = meta.reducer(undefined, { type: "@@CLONE" });
			const transformedState = payload?.transform ? payload.transform(originState) : undefined;
			const clonedState = transformedState === undefined ? originState : transformedState;
			const state = normalizeSafeState("slice.clone", payload?.name ?? "", clonedState);
			return { ...props, state };
		},

		resolve: (props) => {
			const state = { ...props.state };
			Object.keys(props.children).forEach((c) => delete state[c]);
			return { ...props, state };
		},

		childPayload: (key, props) => {
			return { object: { ...props.state[key] } };
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
		defineMethod(slice, "useSelect", (selector: any) => {
			const context = { utils: getUtils(), root: store("slice.useSelect")?.node };
			return useSelector((state: any) => {
				meta.path.split(".").forEach((part) => (state = (state || {})[part]));
				return selector.apply(context, [state || {}, context]);
			});
		});
		defineReadonly(slice, "computed", () => undefined);

		// State access.
		const getState = (() => {
			let state = store("slice.getState")?.redux.getState();
			meta.path.split(".").forEach((part) => (state = ((state as any) || {})[part]));
			return state || {};
		}) as AnySlice["getState"];
		defineMethod(getState, "initial", () => meta.redux.getInitialState() as any);
		defineMethod(getState, "initialDeep", () => meta.reducer(undefined, { type: "@@INIT" }) as any);
		defineMethod(slice, "getState", getState);

		// Lineage inspection and clone management utilities.
		const prototype = {} as AnySlice["prototype"];
		const getLineage = () => [...(family.siblings.values() || [])];
		defineMethod(prototype, "clone", (transform) => clone(slice, undefined, { name: props.name, transform })!);
		defineMethod(prototype, "getLineage", () => getLineage());
		defineMethod(prototype, "getClones", () => getLineage().filter((it) => it !== slice));
		defineMethod(prototype, "isTypeOf", (other) => family === families.get(instances.get(other)?.familyId!));
		defineReadonly(slice, "prototype", () => prototype);

		// Redux Toolkit actions mapped to auto-dispatching slice mutations
		Object.entries(meta.redux.actions).map(([key, action]: [string, any]) => {
			(slice as any)[key] = (...args: any[]) => {
				args = args.length ? action(args) : action();
				store("slice::mutation")?.redux.dispatch({ ...args, meta: { path: meta.path } } as any);
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
			const nextState = { ...(meta.redux.reducer(state, action) as any) };
			for (const [key, reducer] of children) nextState[key] = reducer(nextState?.[key], action);
			return nextState;
		};

		return slice;
	},
});

/** Validate the slice name and initial state. */
const validateNameAndState = (props: Dict) => {
	if (!Object.hasOwn(props, "name")) return MESSAGES("createSlice").RequiredName(props);
	if (!props.name || typeof props.name !== "string" || props.name.includes(".") || props.name.includes("/"))
		MESSAGES("createSlice").InvalidName(props.name);
	props.state = normalizeSafeState("createSlice", props.name, props.state, true);
};

/** Normalizes a slice state value into a safe plain object and optionally resolves lazy state initializers. */
const normalizeSafeState = (method: string, name: string, state: any, acceptLazy?: boolean) => {
	if (state === undefined || (state && typeof state === "object" && !Array.isArray(state))) return state || {};
	else if (typeof state === "function" && acceptLazy) return () => normalizeSafeState(method, name, state(), false);
	if (acceptLazy === false) return (MESSAGES(method, name).InvalidStateProp(state), {});
	else return (MESSAGES(method, name).InvalidStateClone(state), {});
};

/** Creates and initializes an OrcheStore slice. */
const createSlice = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => (create as any)(props);

export { instances as slices, createSlice, attach as attachSlice };
