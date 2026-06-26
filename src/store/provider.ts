import { getStore } from "./creator";
import { ReactElement, RTKProvider } from "../helpers/imports";
import { MESSAGES } from "../helpers/messages";
import type { StoreProviderProps } from "../helpers/types";

/**
 * Provides an OrcheStore instance to the React component tree.
 *
 * The slice hook (`useSelect`) rely on this provider being
 * present in the component tree.
 *
 * @example
 * ```tsx
 * import { StoreProvider, createStore } from "orchestore";
 *
 * const store = createStore(...);
 *
 * export function AppWrapper() {
 *   return (
 *     <StoreProvider store={store}>
 *       <App />
 *     </StoreProvider>
 *   );
 * }
 * ```
 *
 * @internal
 * Uses React-Redux Provider internally to bind the underlying Redux store
 * into React context.
 */
export function StoreProvider<T>(props: StoreProviderProps<T>): React.JSX.Element {
	const { store, ...rest } = { ...(props || {}) };

	const storeData = getStore.get(store as any, () => MESSAGES("StoreProvider").InvalidStore(store));

	return ReactElement(RTKProvider, { ...rest, store: storeData?.redux!, context: storeData?.context! });
}
