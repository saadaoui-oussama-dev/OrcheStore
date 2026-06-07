import { AnyStore } from "./store";

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

/** Resolved type for application-wide global utilities. */
type GlobalUtils = Definition<"global", Record<PropertyKey, any>, any>;

/** Resolved type for the application root store. */
type RootStore = Definition<"root", AnyStore, any>;

export type { RootStore, GlobalUtils };
