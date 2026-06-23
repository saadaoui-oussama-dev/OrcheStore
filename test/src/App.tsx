import "./App.css";
import { store } from "./store";
// import { counter, subCounter, subCounter2, subSubCounter, subSubCounter2 } from "./store/counter";
import { provideUtils } from "orchestore";

declare module "orchestore" {
	export namespace OrcheStore {
		interface Slots {
			utils: {
				sleep: (ms: number) => Promise<void>;
			};
		}
	}
}

provideUtils({
	sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	},
});

function App() {
	const state = store.useSelect((state) => JSON.stringify(state, null, 2));
	// const subCount = subCounter.useSelect((state) => state);
	// const subCount2 = subCounter2.useSelect((state) => state);
	// const subSubCount = subSubCounter.useSelect((state) => state);
	// const subSubCount2 = subSubCounter2.useSelect((state) => state);

	return (
		<>
			<pre style={{ textAlign: "left" }}>state: {state}</pre>
			{/* <pre style={{ textAlign: "left" }}>
        subCount: {JSON.stringify(subCount, null, 2)}
      </pre>
      <pre style={{ textAlign: "left" }}>
        subCount2: {JSON.stringify(subCount2, null, 2)}
      </pre>
      <pre style={{ textAlign: "left" }}>
        subSubCount: {JSON.stringify(subSubCount, null, 2)}
      </pre>
      <pre style={{ textAlign: "left" }}>
        subSubCount2: {JSON.stringify(subSubCount2, null, 2)}
      </pre> */}

			<div>
				<button onClick={() => store.counter.increment()}>Increment</button>
				<button onClick={() => store.counter.decrement()}>Decrement</button>
				<button onClick={() => store.counter.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div>

			{/* <div>
				<button onClick={() => store.counter2.increment()}>Increment</button>
				<button onClick={() => store.counter2.decrement()}>Decrement</button>
				<button onClick={() => store.counter2.incrementAfter(1, 1000)}>Increment After 1s</button>
			</div> */}

			{/* <div>
        <button onClick={() => subCounter.increment()}>Increment</button>
        <button onClick={() => subCounter.decrement()}>Decrement</button>
        <button onClick={() => subCounter.incrementAfter(1, 1000)}>
          Increment After 1s
        </button>
      </div>

      <div>
        <button onClick={() => subCounter2.increment()}>Increment</button>
        <button onClick={() => subCounter2.decrement()}>Decrement</button>
        <button onClick={() => subCounter2.incrementAfter(1, 1000)}>
          Increment After 1s
        </button>
      </div>

      <div>
        <button onClick={() => subSubCounter.increment()}>Increment</button>
        <button onClick={() => subSubCounter.decrement()}>Decrement</button>
        <button onClick={() => subSubCounter.incrementAfter(1, 1000)}>
          Increment After 1s
        </button>
      </div>

      <div>
        <button onClick={() => subSubCounter2.increment()}>Increment</button>
        <button onClick={() => subSubCounter2.decrement()}>Decrement</button>
        <button onClick={() => subSubCounter2.incrementAfter(1, 1000)}>
          Increment After 1s
        </button>
      </div> */}
		</>
	);
}

export default App;
