import type { Dict } from "./internal";

declare global {
	namespace OrcheStore {
		/** User-defined framework type slots. */
		interface Slots {}
	}
}

/** Resolves a type slot with validation and fallback support. */
type Definition<T, Rule, Default> = T extends keyof OrcheStore.Slots
	? Exclude<OrcheStore.Slots[T], undefined | null> extends Rule
		? Exclude<OrcheStore.Slots[T], undefined | null>
		: Default
	: Default;

/** Resolved type for application-wide utilities. */
type Utils = {
	/** Application-wide utilities. */
	utils: Definition<"utils", Dict, any>;
};

export type { Utils };
