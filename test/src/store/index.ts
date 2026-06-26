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

console.log(
	"subSubCounter",
	subSubCounter.prototype.getLineage().map((it) => it.getState()),
);
console.log(
	"subSubCounter2",
	subSubCounter2.prototype.getLineage().map((it) => it.getState()),
);
console.log(
	"subCounter",
	subCounter.prototype.getLineage().map((it) => it.getState()),
);
console.log(
	"subCounter2",
	subCounter2.prototype.getLineage().map((it) => it.getState()),
);
console.log(
	"counter",
	counter.prototype.getLineage().map((it) => it.getState()),
);
