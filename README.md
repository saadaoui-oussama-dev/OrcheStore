# OrcheStore

### 🚧 Coming Soon

OrcheStore is currently under active development and is not yet ready for production use.

### 📅 Future Release Plans

**Planned First Stable Release (v1.0.0):** **2026-06-30**

Development is ongoing, and progress is published regularly. New commits are pushed periodically to the public GitHub repository, and pre-release versions (v0.x.x) may be published to npm before the first stable release.

### ⚠️ Pre-release Notice

OrcheStore is currently in a pre-release phase.

* Not recommended for production use
* APIs may change before the first stable release
* Internal architecture and runtime behavior are still evolving
* Documentation and feature coverage are actively being expanded

Stay tuned for updates.

---

## About

> 🧩 A function-oriented state orchestration architecture built on top of Redux Toolkit, inspired by Vuex.

OrcheStore brings a Vuex-inspired developer experience to React and Redux Toolkit applications by unifying state and behavior into directly callable runtime modules.

Instead of distributing logic across reducers, actions, thunks, selectors, hooks, middleware, and utility files, OrcheStore organizes related functionality into cohesive slice modules.

The goal is simple:

> ⚡ Spend less time wiring state management infrastructure and more time building application features.

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

## Table of Contents

* [Introduction](#orchestore)
  * [Installation](#installation)
  * [Core Principles](#core-principles)
  * [Why OrcheStore?](#why-orchestore)
  * [Architecture Overview](#architecture-overview)

* [Quick Example](#quick-example)

* [Slice Layers](#slice-layers)
  * [name](#name)
  * [state](#state)
  * [Mutations](#mutations)
  * [Methods](#methods)
  * [Computed State (Planned)](#computed-state-planned)
  * [Nested Slices](#nested-slices)
    * [Accessing Children through Parent Slice](#accessing-children-through-parent-slice)
    * [Accessing Parent Slice from Children](#accessing-parent-slice-from-children)
    * [Reusing Slices](#reusing-slices)
    * [Runtime Paths](#runtime-paths)

* [State Access & Subscriptions](#state-access--subscriptions)
  * [State Snapshots](#state-snapshots)
  * [State Subscriptions](#state-subscriptions)
  * [Draft State](#draft-state)

* [Store Integration](#store-integration)
  * [Creating the Store](#creating-the-store)
  * [Store Provider](#store-provider)
  * [Accessing Slices through Store](#accessing-slices-through-store)
  * [Accessing Store from Slices](#accessing-store-from-slices)

* [Family & Clones](#family--clones)
  * [Manual Cloning](#manual-cloning)
  * [Automatic Cloning](#automatic-cloning)
  * [Inspecting a Family](#inspecting-a-family)
  * [Definition Type Checking](#definition-type-checking)

* [Utilities](#utilities)
  * [Accessing Utilities](#accessing-utilities)
  * [Utilities Type Extension](#utilities-type-extension)
  * [Providing Runtime Utilities](#providing-runtime-utilities)
  * [Using Utilities in Slices](#using-utilities-in-slices)

* [TypeScript Inference](#typescript-inference)

* [Status](#status)

---

## Core Principles

* Simplify state management architecture
* Automate repetitive Redux patterns
* Reduce infrastructure code
* Centralize state and application logic
* Provide direct and intuitive APIs
* Preserve predictable state transitions
* Maintain strong TypeScript inference
* Scale naturally through composition

## Why OrcheStore?

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

## Architecture Overview

| Layer       | Responsibility                          |
| ----------- | --------------------------------------- |
| `name`      | Unique slice identifier                 |
| `path`      | Hierarchical slice path                 |
| `state`     | Slice data storage definition           |
| `mutations` | Synchronous state transitions           |
| `methods`   | Orchestration and side effects          |
| `computed`  | Derived and computed state              |
| `children`  | Nested slice composition                |
| `getState`  | Imperative state access                 |
| `useSelect` | Reactive state subscriptions            |
| `family`    | Family, cloning, and instance utilities |

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
> 🔄 When a slice is mounted multiple times, each mount receives its own isolated instance. See [Reusing Slices](#reusing-slices) and [Family & Clones](#family--clones) for details.

---

# Slice Layers

Slices are created using `createSlice`.

```ts
import { createSlice } from "orchestore";

const counter = createSlice({
	name: "counter",

	state: {},

	computed: {},

	mutations: {},

	methods: {},

	children: {},

	subscribe: {},
});
```

## name

Every slice requires a unique and stable name.

The name primarily exists to ensure slice uniqueness and path generation.

```ts
const counter = createSlice({
	name: "counter",
});
```

The name is exposed at runtime:

```ts
console.log(counter.name); // "counter"
```

It is also accessible inside methods:

```ts
methods: {
	logName() {
		console.log(this.name);
	}
}
```

**Rules:**

- Names should not contain `"."` or `"/"`, because they are reserved for nested slice paths
- Two slices cannot share the same name

---

## state

The `state` property defines the initial slice state.

```ts
const counter = createSlice({
	name: "counter",

	state: {
		value: 0,
	},
});
```

State can also be initialized lazily by providing a function.

The initializer runs only once before the first state access.

```ts
const counter = createSlice({
	name: "counter",

	state: () => ({
		value: 0,
	}),
});
```

**Useful for:**

- expensive initialization
- persisted state restoration
- runtime-dependent values

---

## Mutations

Mutations are synchronous state transition functions.

**Characteristics:**

- receive mutable draft state as the first parameter
- support multiple user-defined arguments
- directly callable from the exposed slices or store

**Responsibilities:**

Mutations should contain:

- synchronous state updates
- deterministic state transitions
- normalization logic

For anything else, use methods instead.

**Example:**

```ts
const counter = createSlice({
	name: "counter",

	state: {
		value: 0,
	},

	mutations: {
		increment(state, amount = 1, max = Infinity) {
			state.value = Math.min(state.value + amount, max);
		},
	},
});

counter.increment(1, 50);
```

---

## Methods

Methods are the orchestration layer of a slice.

**Characteristics:**

- receive any number of arguments
- can return synchronous values or Promises
- can access:
  - state, mutations, slibling methods, nested slices (through `this`)
  - Root store (`this.root`)
  - Parent slice (`this.parent`)
  - Application-wide utilities (`this.utils`)

Methods are not serialized, replayable, or represented in Redux DevTools action history.

**Responsibilities:**

Methods are designed for centralizing any slice-related logic:

- asynchronous workflows
- business logic orchestration
- API communication and network calls
- timers, delayed or scheduled executions, such as `setTimeout` or event listeners
- side effects such as `localStorage`, `sessionStorage` and DOM manipulation
- Slice-related React hooks such as `slice.useSelect`, tanstack `useQuery` and `useMutation`

**Restrictions:**

Methods should NOT:

- include slice-unrelated logic.
- include UI layer logic.
- mutate state directly. Use mutations instead, because mutations remain the only place where state transitions occur, making updates predictable and keeping methods focused on orchestration.

**Example:**

```ts
const counter = createSlice({
	name: "counter",

	state: {
		value: 0,
	},

	mutations: {
		increment(state, amount: number) {
			state.value += amount;
		},
	},

	methods: {
		async incrementAfter(amount: number, delay = 1000) {
			await new Promise((resolve) => setTimeout(resolve, delay));
			this.increment(amount);
			this.utils.logger.info("Counter incremented");
		},
	},
});
```

---

## Computed State (Planned)

This is currently not supported.

~~The `computed` property provides reusable derived state.~~

```ts
// const counter = createSlice({
//   name: "counter",

//   state: {
//     value: 10,
//   },

//   computed: {
//     doubled(state) {
//       return state.value * 2;
//     },

//     multiplied(state, amount: number) {
//       return state.value * amount;
//     },
//   },
// });
```

---

## Nested Slices

Slices can be composed by registering other slice instances through the `children` property.

This allows related state and behavior to be structured into a hierarchical ownership tree, while preserving full type inference, runtime path resolution, and instance isolation.

```ts
import { products } from "./productsSlice";
import { categories } from "./categoriesSlice";

export const shop = createSlice({
	name: "shop",

	state: {},

	children: {
		products,
		categories,
	},
});
```

### Accessing Children through Parent Slice

Child slices are exposed directly on their parent slice instance.

```ts
shop.products.add(...)
shop.categories.create(...)

console.log(shop.products.getState());
```

Deeply nested slice trees are fully supported, including recursive composition.

```ts
admin.users.permissions.grant(...);

console.log(admin.users.permissions.getState());
```

### Accessing Parent Slice from Children

Every slice instance has a runtime reference to its parent via `slice.parent`.

This allows slices also to interact with sibling slices through the parent ownership scope.

```ts
this.parent.categories.getState().list;
```

### Reusing Slices

A slice can be mounted multiple times within the same tree.

When the same slice definition is reused, OrcheStore automatically creates a separate mounted instance for each location.

```ts
const paginationSlice = createSlice({ ... });

const shopSlice = createSlice({
  name: "shop",

  state: {},

  children: {
    categories: paginationSlice,
    products: paginationSlice,
  },
});

const adminSlice = createSlice({
  name: "admin",

  state: {},

  children: {
    products: paginationSlice,
  },
});
```

Each mounted instance has:

- its own path
- its own ownership context
- its own runtime state

**Runtime identity:**

Although all mounted slices originate from `paginationSlice`, they are not necessarily the same runtime instance.

```ts
paginationSlice === shopSlice.categories; // First mount uses the original instance

paginationSlice !== shopSlice.products;  // Different mount location creates a clone
paginationSlice !== adminSlice.products; // Different mount location creates a clone

shopSlice.products !== adminSlice.products; // Independent mounted clones
```

Every mount location receives its own isolated instance.

For a deeper explanation of how slice reuse works, see [Family & Clones](#family--clones).

### Runtime Paths

Every slice exposes a runtime path through `slice.path`.

```ts
store.counter.name; // "counter"
store.counter.path; // "counter"
```

Nested slices automatically inherit their parent path.

```ts
store.admin.users.name; // "users"
store.admin.users.path; // "admin.users"

store.admin.users.permissions.name; // "permissions"
store.admin.users.permissions.path; // "admin.users.permissions"
```

**Notes:**

Paths are generated automatically from the slice hierarchy.

OrcheStore builds on the same concepts as Redux Toolkit's `reducerPath` and `combineReducers`, but automates path generation, reducer registration, and nested slice composition.

No manual path configuration or reducer injection is required.

---

# State Access & Subscriptions

OrcheStore provides multiple ways to access state depending on the context.

| API                 | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `slice.getState()`  | Read the current state snapshot                          |
| `slice.useSelect()` | Subscribe to state changes inside React                  |
| Draft state         | Temporary state access available during state evaluation |

## State Snapshots

`getState()` returns the latest immutable state snapshot.

Use it whenever you need to read state imperatively outside of React subscriptions.

```ts
counter.getState().value;
```

**Available:**

- outside React
- inside methods

**Notes:**

Each call returns the current state at the moment it is executed.

Previously captured snapshots are not updated after future mutations.

```ts
methods: {
	logValue() {
		this.changeValue("John");

		const snapshot = this.getState();

		this.changeValue("Alice");

		console.log(snapshot.value); // "John"
		console.log(this.getState().value); // "Alice"
	}
}
```

---

## State Subscriptions

`useSelect()` provides reactive state subscriptions for React components.

Internally, it is powered by Redux Toolkit's `useSelector`, while exposing a fully typed, slice-scoped API.

**Available:**

- inside React components
- inside slice methods that serve as custom React hooks

**Notes:**

Components automatically re-render when the selected value changes.

```tsx
const value = counter.useSelect((state) => state.value);
```

Selectors can also be accessed through the store to access multiple slices.

```tsx
const canEdit = store.useSelect((state) => {
	return (
		state.auth.isAuthenticated &&
		state.users.permissions.list.includes("edit_user")
	);
});
```

---

## Draft State

Draft state provides temporary access to slice state during state evaluation.

It is context-dependent and only available within specific APIs:

- Inside Mutations

Mutations receive a mutable draft state that can be updated directly.

```ts
mutations: {
	setName(state, name: string) {
		state.name = name;
	}
}
```

~~- Inside Computed State~~

~~Computed functions receive a read-only draft state extended with additional runtime helpers.~~

```ts
// computed: {
//   fullName(state) {
//     return `${state.firstName} ${state.lastName}`;
//   }
// }
```

- Inside useSelect

Selectors receive a read-only draft state extended ~~with additional runtime helpers~~.

```tsx
const displayName = users.useSelect((state) => {
	return state.user.name;
});
```

**~~Available additions include:~~**

~~- `state.computed` — computed state access~~

---

# Store Integration

## Creating the Store

Create the root store using `createStore`.

```ts
import { createStore } from "orchestore";
import { counter } from "./counterSlice";
import { users } from "./usersSlice";

export const store = createStore({
	slices: {
		counter,
		users,
	},
});
```

## Store Provider

Wrapping the application component inside this provider is required.

```tsx
import { StoreProvider } from "orchestore";
import { store } from "./store";

export default function App() {
	return (
		<StoreProvider store={store}>
			<Routes />
		</StoreProvider>
	);
}
```

## Accessing Slices through Store

The root store behaves similarly to a parent slice and exposes all registered slices.

```ts
store.counter.increment(1);

console.log(store.counter.getState());
```

## Accessing Store from Slices

Every slice has access to the root store instance via `slice.root`.

```ts
this.root.auth.getState().isAuthenticated;
```

**Useful for:**

- cross-slice coordination
- avoiding circular imports
- application-wide orchestration

---

# Family & Clones

OrcheStore uses a family-based model for slice identity.

**Why?**

Slices can be used in multiple places in the store tree.

When this happens, OrcheStore creates a separate runtime instance for each usage. These instances are called **clones**.

A clone is an independent instance of a slice at runtime. It has its own state and runs separately from other clones, while still remaining part of a shared family.

A family is the set of all runtime instances that originate from the same slice definition.

**This means:**

* slices are not singletons
* a slice can appear multiple times in a tree
* each clone is fully isolated
* all instances created from the same definition are linked through family

## Manual Cloning

A new detached clone can be created manually from any slice instance.

### 1. Clone without state transformation

```ts
const clone = slice.family.clone();
```

The new instance:

* belongs to the same family
* starts detached from the tree
* has no mounted path initially
* has its own ownership context
* uses the exact initial state of the source slice

### 2. Clone with state transformation

```ts
const clone = slice.family.clone((state) => newState);
```

The provided function receives the fully resolved initial state (including nested slices) and returns the modified state for the new instance.

The state transformer:

* does not affect other family members
* supports nested slice state updates
* supports immutable updates (returning a new state object)
* supports mutable updates (Immer-style — no return required)

**Example:**

```ts
const crudSlice = createSlice({
	name: "CRUD-Slice",

	state: {
		endpoint: "",
	},

	children: {
		pagination: paginationSlice,
		dropdown: searchDropdownSlice,
	},
});

// Immutable style (returns new state object)
const productsSlice = crudSlice.family.clone((state) => ({
	...state,
	endpoint: "api/v1/products",

	dropdown: {
		...state.dropdown,
		supported: false,
	},
}));

// Immer-style mutation (no return needed)
const categoriesSlice = crudSlice.family.clone((state) => {
	state.endpoint = "api/v1/categories";
	state.pagination.supported = false;
});
```

## Automatic Cloning

OrcheStore creates slice instances automatically in two cases:

### 1. Reuse through `children` / `slices`

When a slice is reused through `children` (or `slices`), OrcheStore creates a new mounted instance for each usage.

```ts
const paginationSlice = createSlice({ ... });

const shopSlice = createSlice({
	name: "shop",

	state: {},

	children: {
		a: paginationSlice,
		b: paginationSlice,
	},
});

const adminSlice = createSlice({
	name: "admin",

	state: {},

	children: {
		a: paginationSlice,
	},
});
```

Each mount becomes a separate runtime node:

```ts
shopSlice.a !== shopSlice.b;
shopSlice.a !== adminSlice.a;
shopSlice.b !== adminSlice.a;
```

Each instance has its own ownership context:

```ts
shopSlice.a.path;  // "shop.a"
shopSlice.b.path;  // "shop.b"
adminSlice.a.path; // "admin.a"
```

### 2. Cloning a parent slice (cascade cloning)

When a parent slice is cloned or reused, all its nested children are automatically cloned as well.

```ts
const crudSlice = createSlice({
	name: "CRUD-Slice",

	state: {
		endpoint: "",
	},

	children: {
		pagination: paginationSlice,
		dropdown: searchDropdownSlice,
	},
});

const productsSlice = crudSlice.family.clone();
const categoriesSlice = crudSlice.family.clone();
```

Each clone receives its own independent subtree:

```ts
productsSlice.pagination !== categoriesSlice.pagination;
```

This ensures that both parent and child slices remain fully isolated across all clone instances.

## Inspecting a Family

**Get All Related Instances:**

Returns every instance in the family, **including** the current instance.

```ts
const family = slice.family.getAll();
```

Useful for:

- debugging slice reuse
- inspecting mounted instances
- understanding tree distribution

**Get Sibling Clones:**

Returns every sibling clone in the family, **except** the current instance.

```ts
const clones = slice.family.getClones();
```

Useful for:

- communicating between clones
- broadcast or synchronization scenarios
- comparing mounted instances

## Definition Type Checking

You can check whether two slices belong to the same family:

```ts
const isSameFamily = slice.family.isTypeOf(otherSlice);
```

Returns `true` when both slices originate from the same slice definition, even if they are different runtime instances.

```ts
const slice1 = createSlice(...);
const slice2 = createSlice(...);

const clone1 = slice1.family.clone();
const clone2 = clone1.family.clone();

slice1.family.isTypeOf(clone1); // true
clone1.family.isTypeOf(clone2); // true
clone2.family.isTypeOf(slice1); // true

slice1.family.isTypeOf(slice2); // false
slice2.family.isTypeOf(clone1); // false
```

## Summary

- `clone()` creates a new detached family member.
- `clone(stateTransformer)` allows per-instance state customization at creation time.
- Reusing a slice automatically creates mounted clones.
- Every clone is isolated at runtime.
- All clones from the same definition belong to a shared family.
- `getAll()` returns all instances in a family.
- `getClones()` returns all related instances except the current instance.
- `isTypeOf()` checks whether two instances belong to the same family.

---

# Utilities

Application-wide utilities allow slices and stores to access shared runtime services through `utils`.

Common use cases include:

- notifications and toasts
- navigation and routing
- analytics and tracking
- API clients and service wrappers
- runtime values that are difficult to access directly from slices
- integrations with React hooks and third-party libraries

Utilities are registered using `setUtils` and are accessible from any slice or the root store.

## Accessing Utilities

**Available:**

- Through exposed store and slice instances

```ts
store.utils;
slice.utils;
this.utils; // Inside slice methods and mutations
```

- Through `getUtils`

```ts
import { getUtils } from "orchestore";

const utils = getUtils();
```

## Utilities Type Extension

OrcheStore exposes user-definable type slots through `OrcheStore.Slots`.

By overriding `OrcheStore.Slots.utils`, application-specific utilities become available throughout the framework with full type safety.

```ts
import type { NavigateFunction } from "react-router";

declare module "orchestore" {
	namespace OrcheStore {
		interface Slots {
			utils: {
				navigate: NavigateFunction;

				notify(type: "info" | "error" | "success", message: string): void;
			};
		}
	}
}
```

**Notes:**

* `OrcheStore.Slots` can be extended using either `declare module "orchestore"` or `declare global`, depending on your project's type organization preferences.
* If your project uses JavaScript without TypeScript, you can still extend these types by creating a separate declaration file (for example, `orchestore.d.ts`). This allows editors and tooling to provide type checking and IntelliSense while keeping your application code in JavaScript.

**Rules**

* `utils` must resolve to an object type; otherwise, it falls back to `any`.
* `null` and `undefined` are automatically excluded. For example, `object | null | undefined` resolves to `object`.

**Type Safety**

Before extending `OrcheStore.Slots.utils`, all utility-related APIs are typed as `any`.

After extending `OrcheStore.Slots.utils`, the inferred type is automatically applied throughout the framework, including:

* `store.utils`
* `slice.utils`
* `this.utils` inside mutations and methods
* `getUtils()`
* `setUtils()`
* `type Utils`

This provides consistent type safety and IntelliSense across all utility access points without requiring additional type declarations.

## Providing Runtime Utilities

Application-wide utility values can be registered or updated at runtime.

```ts
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { setUtils } from "orchestore";
import { feedbacks } from "./ui-feedbacks";
import { store } from "./store";

setUtils({
	notify(type, message) {
		feedbacks.notify(type, message);
	},
});

export default function App() {
	const navigate = useNavigate();

	useEffect(() => {
		setUtils({ navigate });
	}, [navigate]);

	return (
		<StoreProvider store={store}>
			<Routes />
		</StoreProvider>
	);
}
```

## Using Utilities in Slices

Application-wide utilities can be used anywhere a slice instance is available.

```ts
methods: {
	async insertUser(data: UserInput) {
		try {
			this.setLoading(true);

			const response = await api.users.add(data);

			this.utils.notify("success", "User added successfully!");

			this.setLoading(false);

			this.utils.navigate("/users/" + response.id);
		} catch (error) {
			this.utils.notify("error", "Failed to add user");

			console.error(error);
		}
	}
}
```

---

# TypeScript Inference

OrcheStore is designed around deep TypeScript inference.

```ts
const counter = createSlice({
	name: "counter",

	state: {
		value: 0,
	},

	mutations: {
		increment(state, amount: number) {
			state.value += amount;
		},
	},

	methods: {
		async incrementAfter(amount: number, delay = 1000) {
			await new Promise((resolve) => setTimeout(resolve, delay));
			this.increment(amount);
		},
	},

	children: {
		subCounter: createSlice({
			name: "subCounter",

			state: {
				value: 0,
			},
		}),
	},
});
```

Automatically produces:

```ts
counter.getState();
// { value: number, subCounter: { value: number } }

counter.subCounter.getState();
// { value: number }

counter.increment(amount: number): void;

counter.incrementAfter(amount: number, delay?: number): Promise<number>;
```

No manual type declarations required.

---

# Status

OrcheStore is currently experimental and under active development.

Planned features:

- middleware and plugin system
- persistence utilities
- SSR support
- deep readonly enforcement
- lifecycle hooks
- enhanced DevTools integration

---
