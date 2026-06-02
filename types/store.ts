import { Children, ExposedState, UseSelectContext } from "./slice";
import { RootStore } from "./slots";

/** Reserved store member names that cannot be overridden by user-defined APIs. */
type ReservedKeys<R = {}, M = {}> = "name" | "path" | "computed" | "root" | "global" | "getState" | "useSelect";

type store<C extends Children = Children> = {
  /** Returns the latest immutable state snapshot. */
  readonly getState: () => ExposedState<{}, C>;

  /** Subscribes to state changes within React components. Runs with a context-bound `this` containing `global` utilities. */
  readonly useSelect: <T>(selector: (this: UseSelectContext<RootStore>, state: ExposedState<{}, C>, context: UseSelectContext<any>) => T) => T;
} & {
  /** Exposed slices. */
  readonly [K in Exclude<keyof C, ReservedKeys>]: C[K];
};

export type { store as Store };
