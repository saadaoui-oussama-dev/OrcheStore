import React from "react";
import { Provider } from "react-redux";
import { getStore } from "./create-store";
import { storeProviderErrors } from "./helpers/errors";
import type { StoreProviderProps } from "../types/internal";

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider(props: StoreProviderProps): React.JSX.Element {
	const { store, ...rest } = { ...(props || {}) };

	const storeData = getStore(undefined, store, storeProviderErrors.InvalidStore(store));

	if (!storeData.provided) storeData.provided = true;

	return <Provider {...rest} store={storeData.redux} />;
}
