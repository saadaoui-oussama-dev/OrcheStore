import { createSlice as create, ReducerType } from "@reduxjs/toolkit";
import { exposeLayer, validateKey } from "./helpers/validators";
import { console } from "./helpers/console";
import { getDispatch } from "./store-provider";
import { getRootStore } from "./create-store";
import { object } from "./helpers/object-utils";
import { getGlobalUtils } from "./global-utils";
import type { Dict } from "../types/helpers";
import type { Children, Computed, Methods, Mutations, Slice, SliceOptions } from "../types/slice";

/** Registered OrcheStore slices and their corresponding Redux Toolkit slices. */
const slices: { slice: Slice; redux: ReturnType<typeof create<any, any, string, any, string>> }[] = [];

/** Returns the Redux Toolkit slice associated with the provided OrcheStore slice. */
export function getReduxSlice(slice: Slice) {
  return slices.find((it) => it.slice === slice)?.redux;
}

/** Creates and initializes an OrcheStore slice. */
export function createSlice<
  S extends Dict = Dict,
  R extends Mutations<S> = Mutations<S>,
  M extends Methods = Methods,
  C extends Children = Children,
  G extends Computed<S, C> = Computed<S, C>,
  N extends string = string
>(props: SliceOptions<S, R, M, C, G, N>): Slice<S, R, M, C, G, N> {
  // Initialize slice metadata and runtime containers.
  const slice = {} as any;
  const options = validateSliceOptions(props);
  const reservedKeys = ["name", "path", "state", "computed", "root", "global", "useSelect"];
  const injectedKeys: string[] = [];
  const exposeContext = (type: string) => ({ module: "createSlice", type, slice: options.name });

  // Convert mutations into Redux Toolkit reducers.
  exposeLayer(exposeContext("mutation"), options.mutations, [reservedKeys, injectedKeys], (_key, item) => {
    const isReduxOnly = item?._reducerDefinitionType === ReducerType.asyncThunk || "reducer" in { ...(item || {}) };
    if (isReduxOnly) return console.error("ERROR");
    else if (typeof item !== "function") return console.error("ERROR");
    return ((state: any, action: any) => item(state, ...action.payload)) as any;
  });

  // Create and register the underlying Redux Toolkit slice.
  const reduxSlice = create({
    name: options.name,
    reducerPath: options.name,
    initialState: options.state,
    reducers: options.mutations as any,
  });

  object.defineReadonly(slice, "name", () => options.name);

  object.defineReadonly(slice, "global", () => getGlobalUtils());

  // Exposing Redux Toolkit actions as auto-dispatching mutations
  Object.entries(reduxSlice.actions).map(([key, action]: [string, any]) => {
    slice[key] = (...args: any[]) => getDispatch(getRootStore())(action(args));
  });

  // Bind methods to the slice instance as their `this` context.
  exposeLayer(exposeContext("method"), options.methods, [reservedKeys, injectedKeys], (key, item) => {
    if (typeof item !== "function") return console.error("ERROR");
    return (slice[key] = (...args: Parameters<typeof item>) => item.call(slice, ...args));
  });

  slices.push({ slice: slice, redux: reduxSlice });
  return slice;
}

/** Validates and normalizes slice definition options. */
const validateSliceOptions = <S extends Dict, O extends SliceOptions<S, any, any, any, any>>(props: O) => {
  // Create a mutable copy of the provided options.
  const options = { ...(props || {}) };

  // Validate the slice name.
  validateKey(options.name, messages.RequiredName, messages.InvalidName(options.name));

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

  // Return a fully normalized options object.
  return options as Required<O>;
};

const messages = {
  RequiredName: "[OrcheStore::createSlice] Missing required slice name.", // prettier-ignore
  InvalidName: (name: string) => `[OrcheStore::createSlice] Slice names cannot contain '.' or '/'. Received: {${name}}`, // prettier-ignore
  RequiredState: (name: string) =>`[OrcheStore::createSlice] Missing required slice state for slice: {${name}}`, // prettier-ignore
  InvalidState: (name: string) => `[OrcheStore::createSlice] Slice state must be a non-null object or a function that returns a non-null object. Slice: {${name}}`, // prettier-ignore
  ReservedKey: (type: string, prop: string) => `[OrcheStore::createSlice] '${prop}' is reserved by OrcheStore and should not be provided as a ${type}.`, // prettier-ignore
  ReduxConflict: (prop: string) => `[OrcheStore::createSlice] '${prop}' is a Redux Toolkit createSlice(...) option and is not applicable to OrcheStore slices. This property will be ignored.`, // prettier-ignore
};
