import React from "react";
import { Provider } from "react-redux";
import { getStore } from "./create-store";
import { MESSAGES } from "./helpers/messages";
import type { StoreProviderProps } from "../types/internal";

/** Provides an OrcheStore instance to the React component tree. */
export function StoreProvider<T>(props: StoreProviderProps<T>): React.JSX.Element {
	const { store, ...rest } = { ...(props || {}) };

	const storeData = getStore(store as any, undefined, {
		InvalidType: () => MESSAGES("StoreProvider").InvalidStore(store),
	});

	return React.createElement(Provider, { ...rest, store: storeData?.redux });
}
