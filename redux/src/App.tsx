import { useDispatch, useSelector } from "react-redux";
import "./App.css";
import { counter, subCounter, subCounter2, subSubCounter, subSubCounter2 } from "./store/counter";
import { store, store2, useStore1Selector, useStore2Selector } from "./store";

function App() {
	  const counter1 = useStore1Selector((state) => JSON.stringify(state, null, 2));
		const counter2 = useStore2Selector((state) => JSON.stringify(state, null, 2));

	return (
		<>
			<pre style={{ textAlign: "left" }}>state 1: {counter1}</pre>
			<pre style={{ textAlign: "left" }}>state 2: {counter2}</pre>

			<div>
				<button onClick={() => store.dispatch(counter.actions.increment(1))}>Increment</button>
				<button onClick={() => store.dispatch(counter.actions.decrement(1))}>Decrement</button>
			</div>

			<div>
				<button onClick={() => store2.dispatch(subCounter2.actions.increment(1))}>Increment</button>
				<button onClick={() => store2.dispatch(subCounter2.actions.decrement(1))}>Decrement</button>
			</div>

			{/* <div>
				<button onClick={preparedDispatch(subCounter.actions.increment)}>Increment</button>
				<button onClick={preparedDispatch(subCounter.actions.decrement)}>Decrement</button>
			</div> */}

			{/* <div>
				<button onClick={preparedDispatch(subCounter2.actions.increment)}>Increment</button>
				<button onClick={preparedDispatch(subCounter2.actions.decrement)}>Decrement</button>
			</div> */}

			{/* <div>
				<button onClick={preparedDispatch(subSubCounter.actions.increment)}>Increment</button>
				<button onClick={preparedDispatch(subSubCounter.actions.decrement)}>Decrement</button>
			</div> */}

			{/* <div>
				<button onClick={preparedDispatch(subSubCounter2.actions.increment)}>Increment</button>
				<button onClick={preparedDispatch(subSubCounter2.actions.decrement)}>Decrement</button>
			</div> */}
		</>
	);
}

export default App;
