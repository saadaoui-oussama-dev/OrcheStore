import { getStore } from "./creator";
import { ReactElement, RTKProvider } from "../helpers/imports";
import { MESSAGES } from "../helpers/messages";
import type { StoreProviderProps } from "../helpers/types"; // prettier-ignore

/**
 * Provides an OrcheStore instance to the React component tree.
 *
 * The slice hook (`useSelect`) rely on this provider being
 * present in the component tree.
 */
export function StoreProvider<T>(props: StoreProviderProps<T>): React.JSX.Element {
	const { store, ...rest } = { ...(props || {}) };

	const storeData = getStore.get(store as any, () => MESSAGES("StoreProvider").InvalidStore(store));

	return ReactElement(RTKProvider, { ...rest, store: storeData?.redux!, context: storeData?.context! });
}
