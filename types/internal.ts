export type * from "./helpers";
export type * from "./slice";
export type * from "./store";
export type * from "./slots";

/** Validation reporting behavior. */
export type ErrorMode = "" | "error" | "warn";

/** Context information used for validation and member exposure. */
export type ExposeContext = { module: string; type: string; slice?: string };

/** Transforms a layer member before it is exposed. */
export type ExposeAdapter = <K extends string>(key: K, item: any) => any;
