import type { DeepReadonly, Dict, Tail } from "./helpers";
import type { GlobalUtils, RootStore } from "./slots";

/** Reserved slice member names that cannot be overridden by user-defined APIs. */
type ReservedKeys<R = {}, M = {}> = "name" | "path" | "computed" | "root" | "global" | "getState" | "useSelect" | keyof R | keyof M;

/** Defines the mutations available on a slice. */
type Mutations<S extends Dict> = Dict<(state: Omit<S, "root" | "computed">, ...args: any[]) => void>;

/** Defines the computed functions available on a slice. */
type Computed<S extends Dict, C extends Dict> = Dict<(state: ExposedState<S, C>, ...args: any[]) => any>;

/** Defines the methods available on a slice with contextual `this` typing. */
type Methods<Context = any> = Dict<(...args: any[]) => any> & ThisType<Context>;

/** Defines the child slices nested within a slice. */
type Children = Dict<slice<any, Mutations<any>, Methods, Dict, Computed<any, any>, any>>;

/** Exposes immutable slice state with optional runtime helpers. */
// TODO: Include nested child slice states in the exposed state shape.
type ExposedState<S extends Dict, C extends Children = Children, Root = {}> = DeepReadonly<Omit<S, "root"> & Root>;

/** Runtime slice API exposed by createSlice(...). */
type slice<
  S extends Dict = Dict,
  R extends Mutations<S> = Mutations<S>,
  M extends Methods = Methods,
  C extends Children = Children,
  G extends Computed<S, C> = Computed<S, C>,
  N extends string = string
> = {
  /** Unique slice identifier. */
  readonly name: N;

  /** Fully qualified runtime path of the slice. */
  readonly path: string;

  /** Application-wide global utilities. */
  readonly global: GlobalUtils;

  /** Collection of derived state functions. */
  readonly computed: {
    readonly [K in keyof G]: (...args: Tail<Parameters<G[K]>>) => ReturnType<G[K]>;
  };

  /** Returns the latest immutable state snapshot. */
  readonly getState: () => ExposedState<S, C>;

  /** Subscribes to state changes within React components. */
  readonly useSelect: <T>(selector: (state: ExposedState<S, C, true>) => T) => T;
} & {
  /** Exposed mutation functions. */
  readonly [K in Exclude<keyof R, ReservedKeys>]: (...args: Tail<Parameters<R[K]>>) => ReturnType<R[K]>;
} & {
  /** Exposed method functions. */
  readonly [K in Exclude<keyof M, ReservedKeys<R>>]: M[K];
} & {
  /** Exposed child slices. */
  readonly [K in Exclude<keyof C, ReservedKeys<R, M>>]: C[K];
};

/** Configuration object used to create a slice. */
type sliceOptions<
  S extends Dict = Dict,
  R extends Mutations<S> = Mutations<S>,
  M extends Methods = Methods,
  C extends Children = Children,
  G extends Computed<S, C> = Computed<S, C>,
  N extends string = string
> = {
  /** Unique slice identifier. */
  name: N;

  /** Initial state object or lazy state initializer. */
  state: S | (() => S);

  /** Collection of synchronous state transition functions. */
  mutations: R;

  /** Collection of derived state functions. */
  // TODO: Add runtime helpers to `this`, including root, computed, and child slices.
  computed?: G & ThisType<G>;

  /** Collection of slice methods and orchestration logic. */
  methods?: M & ThisType<slice<S, R, M, C, G, N> & { root: RootStore }>;

  /** Collection of nested child slices. */
  children?: C;
};

export type { slice as Slice, sliceOptions as SliceOptions, Mutations, Computed, Methods, Children };
