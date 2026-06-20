import { Dict } from "./helpers";

export type * from "./factory";
export type * from "./helpers";
export type * from "./slice";
export type * from "./store";
export type * from "./slots";

/** Validation reporting behavior. */
export type ErrorMode = "" | "error" | "warn";

/** Context information used for validation and member exposure. */
export type ExposeContext = { module: string; slice?: string, reserved: string[] };

/** Transforms a layer member before it is exposed. */
export type ExposeAdapter = <K extends string>(key: K, item: any) => any;

export type NormalizePropsConfig = {
	method: string;
	objects?: string[];
	unsupported?: string[];
	mismatch?: Dict<string>;
	validate?: (options: Dict) => void;
};
