import type { Dict } from "../helpers/types";

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
	/**
	 * Application-wide utilities shared across all slices and the store.
	 *
	 * Utilities provide a global place to register and access runtime services such as:
	 * navigation, notifications, API clients, analytics, and other shared helpers.
	 *
	 * Once registered, utilities are available everywhere in the application:
	 * - inside slices via `this.utils`
	 * - from the root store via `store.utils`
	 * - directly via `getUtils()`
	 *
	 * Utilities can be updated at runtime using `setUtils`, and all updates are
	 * immediately reflected across the entire store tree.
	 *
	 * @example
	 * ```ts
	 * // Register utilities
	 * setUtils({
	 *   notify(type, message) {
	 *     console.log(type, message);
	 *   },
	 * });
	 *
	 * // Inside a slice
	 * const userSlice = createSlice({
	 *   name: "user",
	 *   state: { loading: false },
	 *
	 *   methods: {
	 *     login() {
	 *       this.utils.notify("success", "Login successful");
	 *     },
	 *   },
	 * });
	 *
	 * // From the store
	 * store.utils.notify("info", "App started");
	 *
	 * // Direct access
	 * const utils = getUtils();
	 * utils.notify("success", "Hello");
	 * ```
	 */
	utils: Definition<"utils", Dict, any>;
};

export type { Utils };
