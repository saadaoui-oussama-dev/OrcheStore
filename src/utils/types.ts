declare global {
	namespace OrcheStore {
		/**
		 * User-defined framework type slots.
		 *
		 * Applications may augment this interface to provide
		 * strongly typed framework-wide definitions.
		 */
		interface Slots {}
	}
}

/**
 * Resolves a framework type slot.
 *
 * Returns the user-provided definition when it exists and satisfies
 * the expected type constraint; otherwise falls back to the supplied
 * default type.
 */
type Definition<T, Rule, Default> = T extends keyof OrcheStore.Slots
	? Exclude<OrcheStore.Slots[T], undefined | null> extends Rule
		? Exclude<OrcheStore.Slots[T], undefined | null>
		: Default
	: Default;

/**
 * Wrapper type exposing the shared runtime utilities API.
 *
 * Exists primarily to preserve the `utils` member documentation when
 * composed into other public runtime types such as `Slice` and `Store`.
 */
type utils = {
	/**
	 * Application-wide runtime utilities.
	 *
	 * Provides access to application-wide services registered through
	 * `setUtils()`, such as navigation, notifications, API clients,
	 * analytics, or any other shared helpers.
	 *
	 * The same utilities object is shared across the entire store tree,
	 * and can be replaced at runtime by calling `setUtils()`.
	 *
	 * Depending on the current context, utilities are available through:
	 * - `this.utils` inside slice mutations, methods, and state factories.
	 * - `store.utils` from the root store instance.
	 * - `getUtils()` outside the store runtime.
	 *
	 * ```ts
	 * // Register utilities
	 * setUtils({
	 *   notify(type, message) {
	 *     console.log(type, message);
	 *   },
	 * });
	 * ```
	 *
	 * Runtime usage:
	 *
	 * ```ts
	 * // Inside a slice
	 * const userSlice = createSlice({
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
	 * // Outside the store
	 * getUtils().notify("success", "Hello");
	 * ```
	 */
	utils: Definition<"utils", Record<string, any>, any>;
};

export type { utils as Utils };
