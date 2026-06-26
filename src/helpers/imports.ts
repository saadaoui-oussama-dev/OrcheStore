import { createElement as ReactElement, createContext as ReactContext, useContext as useReactContext } from "react";

import {
	Provider as RTKProvider,
	createSelectorHook as createRTKSelector,
	type ProviderProps as RTKProviderProps,
} from "react-redux";

import {
	configureStore as RTKConfigureStore,
	createSlice as RTKcreateSlice,
	ReducerType as RTKReducerType,
	type ConfigureStoreOptions as RTKStoreOptions,
	type Slice as RTKSlice,
	type Store as RTKStore,
	type Reducer as RTKReducer,
} from "@reduxjs/toolkit";

const createRTKSlice = (name: string, initialState: any, reducers: any) => {
	return RTKcreateSlice({ name, initialState, reducers });
};

const configureRTKStore = (options: RTKStoreOptions) => {
	return RTKConfigureStore(options);
};

export {
	createRTKSelector,
	createRTKSlice,
	configureRTKStore,
	ReactContext,
	ReactElement,
	RTKReducerType,
	RTKProvider,
	useReactContext,
};

export type { RTKStoreOptions, RTKSlice, RTKStore, RTKProviderProps, RTKReducer };
