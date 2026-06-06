import { createSlice as create, ReducerType } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { exposeLayer, validateKey } from "./helpers/validators";
import { console } from "./helpers/console";
import { getStore } from "./create-store";
import { object } from "./helpers/object-utils";
import { getGlobalUtils } from "./global-utils";
import { normalizeState, extractSliceState } from "./helpers/state";
import type { Dict } from "../types/helpers";
import type { Computed, Methods, Mutations, AnySlice, Slice, SliceOptions } from "../types/slice";

type SliceMetadata = {
  slice: AnySlice;
  redux: ReturnType<typeof create<any, any, string, any, string>>;
  children: Dict<AnySlice>;
  path: string;
}

/** Registered OrcheStore slices and their corresponding Redux Toolkit slices. */
const slices: SliceMetadata[] = [];

/** Returns the Redux Toolkit slice associated with the provided OrcheStore slice. */
export function getSlice(slice: AnySlice) {
  return slices.find((it) => it.slice === slice);
}

/** Creates and initializes an OrcheStore slice. */
export function createSlice<
  S extends Dict,
  R extends Mutations<S>,
  M extends Methods,
  C extends Dict<AnySlice>,
  G extends Computed<S, C>,
  N extends string = string
>(props: SliceOptions<S, R, M, C, G, N>): Slice<S, R, M, C, G, N> {
  console.inform("prerelease");

  // Initialize slice metadata and runtime containers.
  const slice = {} as AnySlice;
  const options = validateSliceOptions(props);
  const reservedKeys = ["name", "computed", "root", "global", "getState", "useSelect", "getPath"];
  const injectedKeys: string[] = [];

  // Context object factory functions.
  const useSelectorContext = (rootState: any) => ({ root: getStore(undefined, slice).store, rootState, global: getGlobalUtils() });
  const exposeContext = (type: string) => ({ module: "createSlice", type, slice: options.name });
  const getPath = (slice: AnySlice) => slice.name;

  // Convert mutations into Redux Toolkit reducers.
  exposeLayer(exposeContext("mutation"), options.mutations, [reservedKeys, injectedKeys], (key, item) => {
    const isReduxOnly = item?._reducerDefinitionType === ReducerType.asyncThunk || "reducer" in { ...(item || {}) };
    if (isReduxOnly) return console.error(messages.ReduxReducerConflict());
    else if (typeof item !== "function") return console.error(messages.InvalidMutation(key));
    return ((state: any, action: any) => item(state, ...action.payload)) as any;
  });

  // Create and register the underlying Redux Toolkit slice.
  const reduxSlice = create({
    name: options.name,
    initialState: options.state,
    reducers: options.mutations as any,
  });

  const sliceMetadata: SliceMetadata = { path: options.name, slice: slice, redux: reduxSlice, children: {} };

  object.defineReadonly(slice, "name", () => options.name);

  object.defineReadonly(slice, "global", () => getGlobalUtils());

  object.defineMethod(slice, "getPath", () => getPath(slice));

  object.defineMethod(slice, "getState", () => {
    const storeData = getStore();
    const state = storeData.redux.getState();
    return normalizeState(state, getPath(slice));
  });

  object.defineMethod(slice, "useSelect", (selector: any) => useSelector((state: any) => {
    const context = useSelectorContext(normalizeState(state, ""));
    return selector.call(context, extractSliceState(context.rootState, getPath(slice)), context);
  }));

  // Exposing Redux Toolkit actions as auto-dispatching mutations
  Object.entries(reduxSlice.actions).map(([key, action]: [string, any]) => {
    (slice as any)[key] = (...args: any[]) => getStore().redux.dispatch(action(args));
  });

  // Bind methods to the slice instance as their `this` context.
  exposeLayer(exposeContext("method"), options.methods, [reservedKeys, injectedKeys], (key, item) => {
    if (typeof item !== "function") return console.error(messages.InvalidMethod(key));
    return (slice[key] = (...args: any[]) => item.apply(slice, args));
  });

  exposeLayer(exposeContext("children"), options.children, [reservedKeys, injectedKeys], (key, item) => {
    return;
    const sliceData = getSlice(item);
    if (!sliceData) return console.error(messages.InvalidChild(key));
    return (sliceMetadata.children[key] = item);
  });

  slices.push(sliceMetadata);
  return slice as any;
}

/** Validates and normalizes slice definition options. */
const validateSliceOptions = <S extends Dict, O extends SliceOptions<S, any, any, any, any>>(props: O) => {
  // Create a mutable copy of the provided options.
  const options = { ...(props || {}) };

  // Validate the slice name.
  validateKey(options.name, messages.RequiredName(), messages.InvalidName(options.name));

  // Validate and normalize the initial state.
  if (typeof options.state === "function") {
    const initFunc = options.state;
    options.state = () => {
      const initState = initFunc();
      if (typeof initState !== "object") throw new Error(messages.InvalidState(options.name));
      if (!initState) throw new Error(messages.RequiredState(options.name));
      return initState;
    };
  } else {
    if (typeof options.state !== "object") throw new Error(messages.InvalidState(options.name));
    if (!options.state) throw new Error(messages.RequiredState(options.name));
  }

  // Normalize optional object collections.
  options.mutations = typeof options.mutations === "object" && options.mutations ? { ...options.mutations } : {};
  options.computed = typeof options.computed === "object" && options.computed ? { ...options.computed } : {};
  options.methods = typeof options.methods === "object" && options.methods ? { ...options.methods } : {};
  options.children = typeof options.children === "object" && options.children ? { ...options.children } : {};

  // Warn when Redux Toolkit-specific options are provided.
  const { reducers, extraReducers, reducerPath, initialState, selectors } = { ...((options as any) || {}) };
  if (initialState !== undefined) console.warn(messages.ReduxConflict("initialState"));
  if (reducers !== undefined) console.warn(messages.ReduxConflict("reducers"));
  if (extraReducers !== undefined) console.warn(messages.ReduxConflict("extraReducers"));
  if (reducerPath !== undefined) console.warn(messages.ReduxConflict("reducerPath"));
  if (selectors !== undefined) console.warn(messages.ReduxConflict("selectors"));

  if (Object.keys(options.computed).length > 0)
    console.warn("[OrcheStore::createSlice] Computed properties are not yet supported and will be ignored.");

  if (Object.keys(options.children).length > 0)
    console.warn("[OrcheStore::createSlice] Children slices are not yet supported and will be ignored.");

  // Return a fully normalized options object.
  return options as Required<O>;
};

const messages = {
  RequiredName: () => "[OrcheStore::createSlice] Missing required slice name. Expected a non-empty string.", // prettier-ignore
  InvalidName: (name: string) => `[OrcheStore::createSlice] Slice names cannot contain '.' or '/'. Received: {${name}}`, // prettier-ignore
  RequiredState: (name: string) =>`[OrcheStore::createSlice] Missing required slice state for slice: {${name}}`, // prettier-ignore
  InvalidState: (name: string) => `[OrcheStore::createSlice] Slice state must be a non-null object or a function that returns a non-null object. Slice: {${name}}`, // prettier-ignore
  ReservedKey: (type: string, prop: string) => `[OrcheStore::createSlice] '${prop}' is reserved by OrcheStore and should not be provided as a ${type}.`, // prettier-ignore
  InvalidMutation: (key: string) => `[OrcheStore::createSlice] Mutation '${key}' must be a function.`, // prettier-ignore
  InvalidMethod: (key: string) => `[OrcheStore::createSlice] Method '${key}' must be a function.`, // prettier-ignore
  InvalidChild: (key: string) => `[OrcheStore::createSlice] Child slice '${key}' must be a slice object created using createSlice(...).`, // prettier-ignore
  ReduxConflict: (prop: string) => `[OrcheStore::createSlice] '${prop}' is a Redux Toolkit createSlice(...) option and is not applicable to OrcheStore slices. This property will be ignored.`, // prettier-ignore
  ReduxReducerConflict: () => "[OrcheStore::createSlice] Redux Toolkit asyncThunk reducers are not supported in mutations. Use methods instead.", // prettier-ignore
};
