# OrcheStore

> 🧩 A function-oriented state orchestration architecture built on top of Redux Toolkit, inspired by Vuex.

OrcheStore brings a Vuex-inspired developer experience to React and Redux Toolkit applications by unifying state and behavior into directly callable runtime modules.

Instead of distributing logic across reducers, actions, thunks, selectors, hooks, middleware, and utility files, OrcheStore organizes related functionality into cohesive slice modules.

The goal is simple:

> ⚡ Spend less time wiring state management infrastructure and more time building application features.

---

# Core Principles

* Simplify state management architecture
* Automate repetitive Redux patterns
* Reduce infrastructure code
* Centralize state and application logic
* Provide direct and intuitive APIs
* Preserve predictable state transitions
* Maintain strong TypeScript inference
* Scale naturally through composition

---

## Installation

With npm:

```bash
npm install orchestore
```

Or with Yarn:

```bash
yarn add orchestore
```

Or with pnpm:

```bash
pnpm add orchestore
```

**Peer Dependencies**

OrcheStore requires:

* React 16.9+
* React DOM 16.9+

**Included Dependencies**

`@reduxjs/toolkit` and `react-redux` are installed automatically with OrcheStore.

---

# Syntax

```ts
import { createSlice } from "orchestore";

export const counter = createSlice({
	name: "counter",

	state: {
		value: 0,
	},

	mutations: {
		increment(state, amount = 1) {
			state.value += amount;
		},
	},

	methods: {
		async incrementAfter(amount: number, delay = 1000) {
			await new Promise((resolve) => setTimeout(resolve, delay));
			this.increment(amount);
		},
	},
});
```

---

# Why OrcheStore?

Redux Toolkit greatly improves the Redux experience, but applications still often require developers to coordinate reducers, actions, selectors, thunks, hooks, utilities, and state composition.

OrcheStore builds on top of Redux Toolkit and combines these patterns into a unified slice model. A slice can encapsulate state, mutations, methods, computed values, child slices, and shared application utilities within a single module.

The goal is to reduce framework plumbing and allow application behavior to remain close to the state it operates on.

| Concern            | Redux Toolkit                            | OrcheStore                                      |
| ------------------ | ---------------------------------------- | ----------------------------------------------- |
| State updates      | Reducers + Actions + Dispatch            | Directly callable mutations                     |
| Mutation arguments | `PayloadAction` wrappers                 | Native function arguments                       |
| Async logic        | Separate thunks                          | Built-in methods                                |
| State selection    | Global store selector hooks              | Global + slice-scoped selection hooks           |
| Cross-slice access | Imports & wiring                         | Runtime tree access (Root / Parent / Children)  |
| Shared services    | Manual integration                       | Application-wide utilities                      |
| State composition  | Manual reducer composition               | Nested slices                                   |
| Identity model     | Singleton-like slice definition          | Family-based identity system                    |
| Instance reuse     | Function-level reuse of slice reducers   | Reused slices create isolated runtime instances |
| Cloning model      | Factory pattern required for re-creation | Built-in cloning with family tracking           |
| Exposed API        | Reducers, actions and some helpers       | Directly callable slice APIs                    |
| Type inference     | Strong                                   | Deep end-to-end inference                       |
| Developer focus    | Connect infrastructure                   | Implement behavior                              |

OrcheStore does not replace Redux Toolkit. It builds on top of it, providing a higher-level API for organizing state and application behavior with stronger automation of Redux patterns and reduced coordination overhead for developers.

---

# 📚 Full Documentation

The complete documentation, API reference, guides, and advanced topics are currently available in a single document:

**https://github.com/saadaoui-oussama-dev/OrcheStore/blob/main/TEMP_DOCS.md**

> **Note:** The documentation is currently maintained as a single file and will be reorganized into dedicated files under the `/docs` directory in upcoming commits.

---

# Quick Example

**Comparing OrcheStore with Redux Toolkit**

## Slice Creation

✔️ OrcheStore centralizes state, behavior, and configuration into a unified options API.

```tsx
import { createSlice } from "orchestore";

export const counter = createSlice({
	name: "counter",

	state: {
		value: 0,
	},

	mutations: {
		// Direct arguments without PayloadAction wrappers
		increment(state, amount: number) {
			state.value += amount;
		},

		// Multiple typed arguments without payload objects
		incrementLimited(state, amount: number, max = Infinity) {
			state.value = Math.min(state.value + amount, max);
		},
	},

	methods: {
		// Reusable async method inside slice
		sleep(delay: number) {
			return new Promise((resolve) => setTimeout(resolve, delay));
		},

		// Orchestration layer with full slice access via `this`
		async incrementAfter(amount: number, delay: number) {
			await this.sleep(delay);
			this.increment(amount);
		},
	},
});
```

⛔ Redux Toolkit splits logic between reducers, extra reducers, actions, and async workflows.

```tsx
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

// Separate APIs for async workflows
export const incrementAfter = createAsyncThunk(
	"counter/incrementAfter",
	async ({ amount, delay }: { amount: number; delay: number }) => {
		await new Promise((resolve) => setTimeout(resolve, delay));
		return amount;
	},
);

export const counter = createSlice({
	name: "counter",

	initialState: {
		value: 0,
	},

	reducers: {
		// PayloadAction wrapper required
		increment(state, action: PayloadAction<number>) {
			state.value += action.payload;
		},

		// Multiple arguments must be wrapped into a payload object
		incrementLimited(state, action: PayloadAction<{ amount: number; max?: number }>) {
			state.value = Math.min(
				state.value + action.payload.amount,
				action.payload.max ?? Infinity
			);
		},
	},

	extraReducers: (builder) => {
		// Handles fulfilled async thunk result
		builder.addCase(incrementAfter.fulfilled, (state, action) => {
			state.value += action.payload;
		});
	},
});
```

## Slice Usage

✔️ OrcheStore exposes directly callable mutations and methods.

```ts
counter.increment(4);
counter.incrementLimited(1, 50);
counter.incrementAfter(5, 1000);
```

⛔ Redux Toolkit follows dispatch-based execution

```ts
import { useDispatch } from "react-redux";

const dispatch = useDispatch();

dispatch(counter.actions.increment(4));
dispatch(counter.actions.incrementLimited({ amount: 1, max: 50 }));
dispatch(incrementAfter({ amount: 5, delay: 1000 }));
```

## Store Integration & Context Providing

✔️ OrcheStore exposes fully typed slice APIs directly.

```ts
import { createStore } from "orchestore";
import { counter } from "./counterSlice";

export const store = createStore({
	slices: {
		counter,
	},
});
```

```tsx
import { StoreProvider } from "orchestore";
import { store } from "./store";

export default function App() {
	return (
		<StoreProvider store={store}>
			<CounterComponent />
		</StoreProvider>
	);
}
```

⛔ Redux Toolkit requires manual store configuration and type wiring.

```ts
import { configureStore } from "@reduxjs/toolkit";
import { counter } from "./counterSlice";
import { useDispatch, useSelector } from "react-redux";

export const store = configureStore({
	reducer: {
		counter: counter.reducer,
	},
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

```tsx
import { Provider } from "react-redux";
import { store } from "./store/index";

export default function App() {
	return (
		<Provider store={store}>
			<CounterComponent />
		</Provider>
	);
}
```

## React Usage

OrcheStore exposes direct usable child slices through a unified store instance.

```tsx
import { store } from "./store/index";
import { counter } from "./store/counterSlice";

export function CounterComponent() {
	const value = counter.useSelect((state) => state.value);
	const alias = store.counter.useSelect((state) => state.value);

	return (
		<>
			<div>Counter: {value}</div>

			<button onClick={() => counter.increment(1)}>Increment</button>

			<button onClick={() => store.counter.incrementAfter(1, 1000)}>Increment Later</button>
		</>
	);
}
```

> 📌 If the slice is mounted only once, `store.counter` and `counter` refer to the same runtime instance and can be used interchangeably.
>
> 🔄 When a slice is mounted multiple times, each mount receives its own isolated instance. See [Reusing Slices](https://github.com/saadaoui-oussama-dev/OrcheStore/blob/main/TEMP_DOCS.md#reusing-slices) and [Family & Clones](https://github.com/saadaoui-oussama-dev/OrcheStore/blob/main/TEMP_DOCS.md#family--clones) for details.

---

# Status

OrcheStore is currently **experimental** and under active development.

The 1.0.0 MVP focuses on a fully typed, tree-oriented state management core built on Redux Toolkit, with runtime cloning, hierarchical slices, and React integration.

## 🚀 Current MVP (1.0.0)

| Area | Features |
|------|----------|
| **Store Core** | `createStore()` fully typed, Redux Toolkit based |
| **Slices** | `createSlice()` with `name`, `state`, `mutations`, `methods`, `children` |
| **Hierarchy** | Nested slice trees with automatic parent/child wiring |
| **Runtime Cloning** | Reusable slice definitions with automatic instance cloning |
| **Family APIs** | `clone`, `getAll`, `getClones`, `isTypeOf` |
| **State Mutations** | Direct mutation calls without dispatch |
| **Methods System** | Strongly typed slice methods with runtime context |
| **Utils System** | `this.utils`, `slice.utils`, `setUtils()`, `getUtils()` |
| **React Integration** | `slice.useSelect()` and `store.useSelect()` hooks |
| **Initialization** | Lazy state initialization support |
| **State Model** | Fully recursive typing across nested slices |
| **Navigation** | Runtime tree traversal (`root`, `parent`, `path`) |
| **Ownership Model** | Automatic child state ownership + reducer composition |
| **Diagnostics** | Configurable runtime validation & debugging |
| **TypeScript DX** | Strong inference + full public TSDoc coverage |

---

## ⚙️ Supported APIs

### createSlice(options)

| Option | Status |
|--------|--------|
| name | ✅ |
| state | ✅ |
| mutations | ✅ |
| methods | ✅ |
| children | ✅ |
| computed / selectors | ⏳ Planned |
| listeners / extraReducers | ⏳ Planned |

### createStore(options)

| Option | Status |
|--------|--------|
| name | ✅ |
| slices | ✅ |
| devTools | ✅ |
| middleware | ⏳ Planned |
| plugins | ⏳ Planned |

---
