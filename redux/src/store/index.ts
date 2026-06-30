import React from "react";
import { createSelectorHook } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export { Provider as StoreProvider } from "react-redux";

export const counter = createSlice({
	name: "counter",
	initialState: { value: 0 },
	reducers: {
		increment(state, amount: PayloadAction<number>) {
			console.log("counter 1: increment", JSON.parse(JSON.stringify(state)));
			state.value += amount.payload ?? 1;
		},
		decrement(state, amount: PayloadAction<number>) {
			console.log("counter 1: decrement", JSON.parse(JSON.stringify(state)));
			state.value -= amount.payload ?? 1;
		},
	},
	extraReducers: (builder) => {
		builder.addDefaultCase((state, action) => {
			console.log("counter 1: else", action);
		});
	},
});

export const counter2 = createSlice({
	name: "counter2",
	initialState: { value: 0 },
	reducers: {
		increment(state, amount: PayloadAction<number>) {
			console.log("counter 2: increment", JSON.parse(JSON.stringify(state)));
			state.value += amount.payload ?? 1;
		},
		decrement(state, amount: PayloadAction<number>) {
			console.log("counter 2: decrement", JSON.parse(JSON.stringify(state)));
			state.value -= amount.payload ?? 1;
		},
	},
	extraReducers: (builder) => {
		console.log("jelllo")
		builder.addCase(counter.actions.increment, (state) => {
			console.log("counter 2: extra", JSON.parse(JSON.stringify(state)));
			state.value += 5;
		});
		builder.addDefaultCase((state, action) => {
			console.log("counter 2: else", action);
		});
	},
});

export const store = configureStore({
	reducer: {
		counter2: counter2.reducer,
		counter: counter.reducer,
	},
});

export const StoreContext = React.createContext<any>(null);

export const useSelector = createSelectorHook(StoreContext);
