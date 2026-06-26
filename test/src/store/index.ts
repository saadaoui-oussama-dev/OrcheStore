import { createStore } from "orchestore";
import { subSubCounter, subSubCounter2, subCounter, subCounter2, counter } from "./counter";

export { StoreProvider } from "orchestore";

export const store = createStore({
	slices: {
		counter: counter,
		counter2: counter.prototype.clone((state) => {
			state.value = 445;
			state.subCounter.subValue = 4445;
		}),
	},
});

export const store2 = createStore({
	slices: {
		counter: counter.prototype.clone((state) => {
			state.value = 800;
			state.subCounter.subValue = 8476;
		}),
	},
});
