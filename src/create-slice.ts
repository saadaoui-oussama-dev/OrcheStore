import { createSlice as create } from "@reduxjs/toolkit";
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
>(options: SliceOptions<S, R, M, C, G, N>): Slice<S, R, M, C, G, N> {
  const slice = options as any;

  const reduxSlice = create({
    name: options.name,
    initialState: options.state,
    reducers: options.mutations as any,
  });

  slices.push({ slice: slice, redux: reduxSlice });
  return slice;
}
