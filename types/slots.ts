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

/** Validation rule for the `global` type slot. */
type GlobalUtilsRule = Record<PropertyKey, any>;

/** Validation rule for the `root` type slot. */
type RootStoreRule = Record<PropertyKey, any>;

/** Resolved type for application-wide global utilities. */
type GlobalUtils = Definition<"global", GlobalUtilsRule, any>;

/** Resolved type for the application root store. */
type RootStore = Definition<"root", RootStoreRule, any>;

export type { RootStore, GlobalUtils };
