import "./App.css";
import { setUtils } from "orchestore";
import { store, store2 } from "./store";

declare module "orchestore" {
	export namespace OrcheStore {
		interface Slots {
			utils: {
				sleep: (ms: number) => Promise<void>;
			};
		}
	}
}

setUtils({
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},
});

function App() {
	const state1 = store.useSelect((state) => JSON.stringify(state, null, 2));
	const state2 = store2.useSelect((state) => JSON.stringify(state, null, 2));

	return (
		<>
			<pre style={{ textAlign: "left" }}>state 1: {state1}</pre>
			<pre style={{ textAlign: "left" }}>state 2: {state2}</pre>

			<div>Counter 1: Store 1</div>
			<div>
				<button onClick={() => store.counter.increment()}>Increment</button>
				<button onClick={() => store.counter.decrement()}>Decrement</button>
				<button onClick={() => store.counter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>
				<button onClick={() => store.counter.subCounter.increment()}>Increment</button>
				<button onClick={() => store.counter.subCounter.decrement()}>Decrement</button>
				<button onClick={() => store.counter.subCounter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>Counter 2: Store 1</div>
			<div>
				<button onClick={() => store.counter2.increment()}>Increment</button>
				<button onClick={() => store.counter2.decrement()}>Decrement</button>
				<button onClick={() => store.counter2.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>
				<button onClick={() => store.counter2.subCounter.increment()}>Increment</button>
				<button onClick={() => store.counter2.subCounter.decrement()}>Decrement</button>
				<button onClick={() => store.counter2.subCounter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>Counter 1: Store 2</div>
			<div>
				<button onClick={() => store2.counter.increment()}>Increment</button>
				<button onClick={() => store2.counter.decrement()}>Decrement</button>
				<button onClick={() => store2.counter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>
				<button onClick={() => store2.counter.subCounter.increment()}>Increment</button>
				<button onClick={() => store2.counter.subCounter.decrement()}>Decrement</button>
				<button onClick={() => store2.counter.subCounter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>Counter 2: Store 2</div>
			<div>
				<button onClick={() => store2.counter2.increment()}>Increment</button>
				<button onClick={() => store2.counter2.decrement()}>Decrement</button>
				<button onClick={() => store2.counter2.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			<div>
				<button onClick={() => store2.counter2.subCounter.increment()}>Increment</button>
				<button onClick={() => store2.counter2.subCounter.decrement()}>Decrement</button>
				<button onClick={() => store2.counter2.subCounter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>
		</>
	);
}

export default App;
