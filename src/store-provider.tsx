import React from "react";
import { Provider } from "react-redux";
import { getStore } from "./create-store";
import { storeProviderErrors } from "./helpers/errors";
import type { StoreProviderProps } from "../types/internal";

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider<T>(props: StoreProviderProps<T>): React.JSX.Element {
	const { store, ...rest } = { ...(props || {}) };

	const storeData = getStore(store as any, undefined, storeProviderErrors.InvalidStore);

	return <Provider {...rest} store={storeData.redux} />;
}
