import { createStore } from "orchestore";
import { subSubCounter, subSubCounter2, subCounter, subCounter2, counter } from "./counter";

export { StoreProvider } from "orchestore";

export const store = createStore({
	name: "test",
	slices: {
		counter: counter,
		counter2: counter.family.clone((state) => {
			state.value = 445;
			state.subCounter.subValue = 4445;
		}),
	},
});

export const store2 = createStore({
	name: undefined,
	slices: {
		counter: counter.family.clone((state, next) => {
			next.name = "counter2";
			state.value = 800;
			state.subCounter.subValue = 8476;
		}),
	},
});
