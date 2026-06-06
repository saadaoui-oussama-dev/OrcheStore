import { useDispatch, useSelector } from "react-redux";
import "./App.css";
import {
  counter,
  subCounter,
  subCounter2,
  subSubCounter,
  subSubCounter2,
} from "./store/counter";

function App() {
  const state = useSelector((state) => state);
  // const count = counter.useSelect((state) => state);
  // const subCount = subCounter.useSelect((state) => state);
  // const subCount2 = subCounter2.useSelect((state) => state);
  // const subSubCount = subSubCounter.useSelect((state) => state);
  // const subSubCount2 = subSubCounter2.useSelect((state) => state);

  const dispatch = useDispatch();

  const preparedDispatch = (
    action: (payload: number) => { payload: number; type: string },
  ) => {
    return () => {
      const payload = action(1);
      console.log("payload", payload);
      const response = dispatch(payload);
      console.log("response", response);
    };
  };

  return (
    <>
      <pre style={{ textAlign: "left" }}>
        state: {JSON.stringify(state, null, 2)}
      </pre>

      <div>
        <button onClick={preparedDispatch(counter.actions.increment)}>
          Increment
        </button>
        <button onClick={preparedDispatch(counter.actions.decrement)}>
          Decrement
        </button>
      </div>

      <div>
        <button onClick={preparedDispatch(subCounter.actions.increment)}>
          Increment
        </button>
        <button onClick={preparedDispatch(subCounter.actions.decrement)}>
          Decrement
        </button>
      </div>

      <div>
        <button onClick={preparedDispatch(subCounter2.actions.increment)}>
          Increment
        </button>
        <button onClick={preparedDispatch(subCounter2.actions.decrement)}>
          Decrement
        </button>
      </div>

      <div>
        <button onClick={preparedDispatch(subSubCounter.actions.increment)}>
          Increment
        </button>
        <button onClick={preparedDispatch(subSubCounter.actions.decrement)}>
          Decrement
        </button>
      </div>

      <div>
        <button onClick={preparedDispatch(subSubCounter2.actions.increment)}>
          Increment
        </button>
        <button onClick={preparedDispatch(subSubCounter2.actions.decrement)}>
          Decrement
        </button>
      </div>
    </>
  );
}

export default App;
