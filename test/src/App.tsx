import "./App.css";
import { counter } from "./store/counter";
import { provideGlobalUtils } from "orchestore";

declare module "orchestore" {
  export namespace OrcheStore {
    interface Slots {
      global: {
        sleep: (ms: number) => Promise<void>;
      };
    }
  }
}

provideGlobalUtils({
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
});

function App() {
  const count = counter.getState().value;
  // const state = counter.useSelect((state, context) => context.rootState);

  return (
    <>
      <h1>Counter: {count}</h1>
      <button onClick={() => counter.increment()}>Increment</button>
      <button onClick={() => counter.decrement()}>Decrement</button>
      <button onClick={() => counter.incrementAfter(1, 1000)}>
        Increment After 1s
      </button>

      {/* <pre>{JSON.stringify(state, null, 2)}</pre> */}
    </>
  );
}

export default App;
