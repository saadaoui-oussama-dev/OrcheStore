import type { Dict } from "./helpers";
import type { AnySlice, UseSelectContext } from "./slice";

/** Exposes immutable store state. */
type ExposedState<C extends Dict<AnySlice>> = { readonly [K in keyof C]: ReturnType<C[K]["getState"]> };

/** Reserved store member names that cannot be overridden by user-defined APIs. */
type ReservedKeys<R = {}, M = {}> = "name" | "computed" | "root" | "global" | "getState" | "useSelect" | "getPath" | keyof R | keyof M;

type store<C extends Dict<AnySlice>> = {
  /** Returns the latest immutable state snapshot. */
  readonly getState: () => ExposedState<C>;

  /** Subscribes to state changes within React components. Runs with a context-bound `this` containing `global` utilities. */
  readonly useSelect: <T>(selector: (this: UseSelectContext<store<C>>, state: ExposedState<C>, context: UseSelectContext<store<C>>) => T) => T;
} & {
  /** Exposed slices. */
  readonly [K in Exclude<keyof C, ReservedKeys>]: C[K];
};

type AnyStore = store<any>;

export type { store as Store, AnyStore };
