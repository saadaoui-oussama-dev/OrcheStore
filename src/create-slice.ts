import { createSlice as create, ReducerType } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { exposeLayer, validateKey } from "./helpers/validators";
import { devConsole } from "./helpers/console";
import { stores } from "./create-store";
import { object } from "./helpers/object-utils";
import { getGlobalUtils } from "./global-utils";
import { normalizeState, extractSliceState } from "./helpers/state";
import { sliceErrors } from "./errors";
import type { Dict, AnyStore, StoreData, SliceData, Computed, Methods, Mutations, AnySlice, Slice, SliceOptions, UseSelectContext } from "../types/internal"; // prettier-ignore

/** Registered OrcheStore slices and their corresponding Redux Toolkit slices. */
const slices: SliceData[] = [];

/** Returns the Redux Toolkit slice associated with the provided OrcheStore slice. */
export function getSlice(slice: AnySlice) {
  return slices.find((it) => it.slice === slice);
}

/** Returns the OrcheStore store instance with its associated Redux store. */
export function getStore(slice: SliceData, store?: AnyStore, reactContext?: boolean, error: Dict<any[]> = {}) {
  let message: (any[] | undefined) = undefined;
  if (store !== undefined && !stores.find((it) => it.store === store)) message = error['storeType'];
  else if (slice && !slice.exposedIn.length) message = error['neverExposed'];
  else if (slice && store && !slice.exposedIn.includes(store)) message = error['notInTree'];
  store = slice && store === undefined ? slice.exposedIn[0] : store;
  if (reactContext && !store!.provided) message = error["notProvided"];
  if (message) {
    devConsole.error(...message);
    throw new Error();
  }
  return stores.find((it) => it.store === store)!;
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
  devConsole.inform("prerelease");

  // Initialize slice metadata and runtime containers.
  const slice = {} as AnySlice;
  const options = validateSliceOptions(props);
  const reservedKeys = ["name", "computed", "root", "global", "getState", "useSelect", "getPath"];
  const injectedKeys: string[] = [];

  // Context object factory functions.
  const getPath = (slice: AnySlice) => slice.name;
  const exposeContext = (type: string) => ({ module: "createSlice", type, slice: options.name });
  const useSelectorContext = (storeData: StoreData, rootState: any): UseSelectContext<any> => {
    return { root: storeData.store, rootState, global: getGlobalUtils() };
  };

  // Convert mutations into Redux Toolkit reducers.
  exposeLayer(exposeContext("mutation"), options.mutations, [reservedKeys, injectedKeys], (key, item) => {
    const isReduxOnly = item?._reducerDefinitionType === ReducerType.asyncThunk || "reducer" in { ...(item || {}) };
    if (isReduxOnly) return devConsole.error(sliceErrors.ReduxReducerConflict());
    else if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMutation(key));
    return ((state: any, action: any) => item(state, ...action.payload)) as any;
  });

  // Create and register the underlying Redux Toolkit slice.
  const reduxSlice = create({
    name: options.name,
    initialState: options.state,
    reducers: options.mutations as any,
  });

  const sliceData: SliceData = { path: options.name, slice: slice, redux: reduxSlice, children: {}, exposedIn: [] };

  object.defineReadonly(slice, "name", () => options.name);

  object.defineReadonly(slice, "global", () => getGlobalUtils());

  object.defineMethod(slice, "getPath", () => getPath(slice));

  object.defineMethod(slice, "getState", () => {
    const errors = sliceErrors.InvalidStore("slice-method", options.name, undefined);
    const storeData = getStore(sliceData, undefined, false, errors);
    const state = storeData.redux.getState();
    return normalizeState(state, getPath(slice));
  });

  object.defineMethod(slice, "useSelect", (selector: any) => {
    const errors = sliceErrors.InvalidStore("slice-useSelect", options.name, undefined);
    const storeData = getStore(sliceData, undefined, true, errors);
    return useSelector((state: any) => {
      const context = useSelectorContext(storeData, normalizeState(state, ""));
      return selector.call(context, extractSliceState(context.rootState, getPath(slice)), context);
    });
  });

  // Exposing Redux Toolkit actions as auto-dispatching mutations
  Object.entries(reduxSlice.actions).map(([key, action]: [string, any]) => {
    (slice as any)[key] = (...args: any[]) => {
      const errors = sliceErrors.InvalidStore("slice-mutation", options.name, undefined);
      const storeData = getStore(sliceData, undefined, false, errors);
      return storeData.redux.dispatch(action(args));
    };
  });

  // Bind methods to the slice instance as their `this` context.
  exposeLayer(exposeContext("method"), options.methods, [reservedKeys, injectedKeys], (key, item) => {
    if (typeof item !== "function") return devConsole.error(sliceErrors.InvalidMethod(key));
    return (slice[key] = (...args: any[]) => item.apply(slice, args));
  });

  exposeLayer(exposeContext("children"), options.children, [reservedKeys, injectedKeys], (key, item) => {
    if (!!true) return;
    const sliceData = getSlice(item);
    if (!sliceData) return devConsole.error(sliceErrors.InvalidChild(key));
    return (sliceData.children[key] = item);
  });

  slices.push(sliceData);
  return slice as any;
}

/** Validates and normalizes slice definition options. */
const validateSliceOptions = <S extends Dict, O extends SliceOptions<S, any, any, any, any>>(props: O) => {
  // Create a mutable copy of the provided options.
  const options = { ...(props || {}) };

  // Validate the slice name.
  validateKey(options.name, sliceErrors.RequiredName(), sliceErrors.InvalidName(options.name));

  // Validate and normalize the initial state.
  if (typeof options.state === "function") {
    const initFunc = options.state;
    options.state = () => {
      const initState = initFunc();
      if (typeof initState !== "object") throw new Error(sliceErrors.InvalidState(options.name));
      if (!initState) throw new Error(sliceErrors.RequiredState(options.name));
      return initState;
    };
  } else {
    if (typeof options.state !== "object") throw new Error(sliceErrors.InvalidState(options.name));
    if (!options.state) throw new Error(sliceErrors.RequiredState(options.name));
  }

  // Normalize optional object collections.
  options.mutations = typeof options.mutations === "object" && options.mutations ? { ...options.mutations } : {};
  options.computed = typeof options.computed === "object" && options.computed ? { ...options.computed } : {};
  options.methods = typeof options.methods === "object" && options.methods ? { ...options.methods } : {};
  options.children = typeof options.children === "object" && options.children ? { ...options.children } : {};

  // Warn when Redux Toolkit-specific options are provided.
  const { reducers, extraReducers, reducerPath, initialState, selectors } = { ...((options as any) || {}) };
  if (initialState !== undefined) devConsole.warn(sliceErrors.ReduxConflict("initialState"));
  if (reducers !== undefined) devConsole.warn(sliceErrors.ReduxConflict("reducers"));
  if (extraReducers !== undefined) devConsole.warn(sliceErrors.ReduxConflict("extraReducers"));
  if (reducerPath !== undefined) devConsole.warn(sliceErrors.ReduxConflict("reducerPath"));
  if (selectors !== undefined) devConsole.warn(sliceErrors.ReduxConflict("selectors"));

  if (Object.keys(options.computed).length > 0)
    devConsole.warn("[OrcheStore::createSlice] Computed properties are not yet supported and will be ignored.");

  if (Object.keys(options.children).length > 0)
    devConsole.warn("[OrcheStore::createSlice] Children slices are not yet supported and will be ignored.");

  // Return a fully normalized options object.
  return options as Required<O>;
};
