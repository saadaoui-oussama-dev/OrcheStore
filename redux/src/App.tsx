import "./App.css";
import { store, useSelector, counter, counter2 } from "./store";

function App() {
	const state = useSelector((state) => JSON.stringify(state, null, 2));

	return (
		<>
			<pre style={{ textAlign: "left" }}>state: {state}</pre>

			<div>
				<button onClick={() => store.dispatch(counter.actions.increment(1))}>Increment</button>
				<button onClick={() => store.dispatch(counter.actions.decrement(1))}>Decrement</button>
			</div>

			<div>
				<button onClick={() => store.dispatch(counter2.actions.increment(1))}>Increment</button>
				<button onClick={() => store.dispatch(counter2.actions.decrement(1))}>Decrement</button>
			</div>
		</>
	);
}

export default App;
