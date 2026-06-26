import { counter, subCounter2 } from "./counter";
import { configureStore } from "@reduxjs/toolkit";
import React from "react";
import { Provider, createSelectorHook, createDispatchHook, type ReactReduxContextValue } from "react-redux";

export { Provider as StoreProvider } from "react-redux";

export const store = configureStore({
	reducer: {
		counter: counter.reducer,
	},
});

export const store2 = configureStore({
	reducer: {
		counter: subCounter2.reducer,
	},
});

export const Store1Context = React.createContext<ReactReduxContextValue<any, any> | null>(null);
export const Store2Context = React.createContext<ReactReduxContextValue<any, any> | null>(null);

export const useStore1Selector = createSelectorHook(Store1Context);
export const useStore2Selector = createSelectorHook(Store2Context);
