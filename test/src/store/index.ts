import { createStore } from "orchestore";
import { counter } from "./counter";
export { StoreProvider } from "orchestore";

export const store = createStore({
	slices: {
		counter: counter,
	},
});
