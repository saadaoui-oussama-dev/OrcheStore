# Table of Contents

- [Introduction](#orchestore)
  - [Core Principles](#core-principles)
  - [Why OrcheStore?](#why-orchestore)
  - [Redux Toolkit Comparison](#redux-toolkit-comparison)
  - [Architecture Overview](#architecture-overview)

- [Quick Example](#quick-example)

- [Slice Layers](#slice-layers)
  - [name](#name)
  - [state](#state)
  - [Mutations](#mutations)
  - [Methods](#methods)
  - [Computed State](#computed-state)
  - [Nested Slices](#nested-slices)
    - [Runtime Paths](#runtime-paths)

- [State Access & Subscriptions](#state-access--subscriptions)
  - [State Snapshots](#state-snapshots)
  - [State Subscriptions](#state-subscriptions)
  - [Draft State](#draft-state)

- [Store Integration](#store-integration)
  - [Creating the Store](#creating-the-store)
  - [Store Provider](#store-provider)
  - [Accessing Slices through Store](#accessing-slices-through-store)
  - [Accessing Store from Slices](#accessing-store-from-slices)
  - [Root Store Type Extension](#root-store-type-extension)

- [Global Utilities](#global-utilities)
  - [Accessing Global Utilities](#accessing-global-utilities)
  - [Utilities Type Extension](#utilities-type-extension)
  - [Providing Runtime Utilities](#providing-runtime-utilities)
  - [Using Global Utilities in Slices](#using-global-utilities-in-slices)

- [TypeScript Inference](#typescript-inference)

- [Status](#status)

---

# OrcheStore

> A function-oriented state orchestration architecture built on top of Redux Toolkit.

OrcheStore simplifies and automates common state management patterns in React, Redux Toolkit, and TypeScript applications by unifying state and behavior into directly callable runtime modules.

Instead of distributing logic across reducers, actions, thunks, selectors, hooks, middleware, and utility files, OrcheStore organizes related functionality into cohesive slice modules.

The goal is simple:

> Spend less time wiring state management infrastructure and more time building application features.

## Core Principles

- Simplify state management architecture
- Automate repetitive Redux patterns
- Reduce infrastructure code
- Centralize state and application logic
- Provide direct and intuitive APIs
- Preserve predictable state transitions
- Maintain strong TypeScript inference
- Scale naturally through composition

## Why OrcheStore?

Redux Toolkit significantly improves the Redux developer experience, but many applications still require developers to coordinate logic across multiple concepts:

- reducers
- action creators
- thunks
- selectors
- middleware
- hooks
- utility functions

As applications grow, state management often becomes less about solving business problems and more about connecting infrastructure.

OrcheStore reduces that coordination overhead by exposing state management through unified slice modules.

A slice is more than a state container. It is a runtime module that can encapsulate:

- state
- computed state
- mutations
- methods
- selectors
- child slices
- shared utilities

This allows state and application logic to evolve together within the same domain boundary.

Many common Redux patterns are automated by default:

| Traditional Redux Pattern     | OrcheStore                |
| ----------------------------- | ------------------------- |
| Action creators               | Direct callable mutations |
| Thunks                        | Built-in methods          |
| Dispatch calls                | Direct function calls     |
| `PayloadAction` wrappers      | Native function arguments |
| Cross-slice imports           | Root store access         |
| Shared service wiring         | Global utilities          |
| Manual state tree composition | Nested slices             |
| Complex type declarations     | Automatic inference       |

The result is a simpler architecture with fewer moving parts, less boilerplate, and a more direct development experience.

Developers can focus on application behavior rather than framework plumbing.

## Redux Toolkit Comparison

OrcheStore builds on top of Redux Toolkit while providing a higher-level API for organizing state and behavior.

| Feature                        | OrcheStore | Redux Toolkit |
| ------------------------------ | ---------- | ------------- |
| Direct callable mutations      | ✅          | ❌             |
| Multiple mutation arguments    | ✅          | ❌             |
| Dispatch required              | ❌          | ✅             |
| `PayloadAction` wrappers       | ❌          | ✅             |
| Built-in orchestration methods | ✅          | ❌             |
| Nested slice composition       | ✅          | ⚠️ Manual     |
| Automatic path generation      | ✅          | ⚠️ Manual     |
| Global utilities               | ✅          | ❌             |
| Unified slice API              | ✅          | ❌             |
| Per-slice React hooks          | ✅          | ❌             |
| Deep TypeScript inference      | ✅          | ⚠️ Partial    |

OrcheStore does not replace Redux Toolkit. Instead, it builds on top of it by automating common patterns and providing a more cohesive developer experience.

## Architecture Overview

| Layer       | Responsibility                 |
| ----------- | ------------------------------ |
| `name`      | Unique slice identifier        |
| `path`      | Hierarchical slice path        |
| `state`     | Slice data storage definition  |
| `mutations` | Synchronous state transitions  |
| `methods`   | Orchestration and side effects |
| `computed`  | Derived and computed state     |
| `children`  | Nested slice composition       |
| `getState`  | Imperative state access        |
| `useSelect` | Reactive state subscriptions   |

---

# Quick Example

**Comparing OrcheStore with Redux Toolkit**

## Slice Creation

✔️ OrcheStore centrelize unified options API.

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
});

// Separate APIs for async workflows
export const incrementAfter = createAsyncThunk(
  "counter/incrementAfter",
  async (
    { amount, delay }: { amount: number; delay: number },
    { dispatch }
  ) => {
    await new Promise((resolve) => setTimeout(resolve, delay));

    dispatch(counter.actions.increment(amount));
  }
);
```

## Slice Usage

✔️ OrcheStore exposes direct callable mutations and methods.

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
import { defineStore } from "orchestore";
import { counter } from "./counterSlice";

export const store = defineStore({
  slices: {
    counter,
  },
});
```

```tsx
import { StoreProvider } from "orchestore";

export default function App() {
  return (
    <StoreProvider>
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
// store.counter is equivalent to counter, import only one and use it
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

- Slice names should not contain `"."`, because dots are reserved for nested slice paths
- Two slices cannot share the same name
- Registering the same slice instance multiple times with the same name is not allowed

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
  - Application-wide store (`this.root`) and utilities (`this.global`)

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
- mutate state directly. use mutations instead.

Prefer:

```ts
this.increment(1);
```

Instead of:

```ts
this.getState().value++;
```

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
      this.global.logger.info("Counter incremented");
    },
  },
});
```

---

## ~~Computed State~~

This currently not supported

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

Slices can be composed by registering other slices through the `children` property.

This allows related state and behavior to be organized into a hierarchical structure while preserving full type inference.

```ts
import { counter } from "./counterSlice";
import { users } from "./usersSlice";

export const app = createSlice({
  name: "app",

  state: {},

  children: {
    counter,
    users,
  },
});
```

**Rules:**

- A slice instance can only be registered once within the same state tree
- Existing slice instances cannot be wrapped again with `createSlice`
- Child slices must be registered through the `children` property

**Accessing Child Slices:**

Child slices are exposed directly on their parent slice.

```ts
app.counter.increment(1);

console.log(app.counter.getState());
```

Deeply nested slice hierarchies are fully supported.

```ts
admin.users.permissions.grant(...);

console.log(admin.users.permissions.getState());
```

### Runtime Paths

Every slice exposes a unique runtime path through `path`.

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

Paths are generated automatically from the slice hierarchy.

OrcheStore builds on the same concepts as Redux Toolkit's `reducerPath` and `injectInto`, but automates path generation, reducer registration, and nested slice composition.

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

Selectors can also access root state and computed values.

```tsx
const canEdit = users.useSelect((state) => {
  return (
    state.root.auth.isAuthenticated &&
    state.permissions.list.includes("edit_user")
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

Selectors receive a read-only draft state extended with additional runtime helpers.

```tsx
const displayName = users.useSelect((state) => {
  return state.computed.fullName;
});
```

**Available additions include:**

- `state.root` — root state access

~~- `state.computed` — computed state access~~

---

# Store Integration

## Creating the Store

Create the root store using `defineStore`.

```ts
import { defineStore } from "orchestore";
import { counter } from "./counterSlice";
import { users } from "./usersSlice";

export const store = defineStore({
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

export default function App() {
  return (
    <StoreProvider>
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

Every slice has access to the root store instance through `this.root`.

```ts
this.root.auth.getState().isAuthenticated;
```

**Useful for:**

- cross-slice coordination
- avoiding circular imports
- application-wide orchestration

## Root Store Type Extension

Overriding `OrcheStore.Slots.root` provides full root store typing throughout the application.

> Under active development: this currently causes a circular type inference limitation.

```ts
import { defineStore } from "orchestore";

export const store = defineStore({
  slices: {
    counter,
  },
});

declare global {
  namespace OrcheStore {
    interface Slots {
      root: typeof store;
    }
  }
}
```

```ts
this.root; // Before: any
this.root; // After: fully typed store
```

**Rules:**

- `root` must be a store instance created using `defineStore`
- `null` and `undefined` are excluded automatically
  - `typeof store | null | undefined` is equivalent to `typeof store`
- Invalid types fall back to `any`

---

# Global Utilities

Global utilities allow slices and the root store to access shared runtime services through `global`.

Common use cases include:

- notifications and toasts
- navigation and routing
- analytics and tracking
- API clients and service wrappers
- runtime values that are difficult to access directly from slices
- integrations with React hooks and third-party libraries

Utilities are registered using `provideGlobalUtils` and are accessible from any slice or the root store.

## Accessing Global Utilities

**Available:**

- Through the exposed store or slice instances

```ts
store.global;
slice.global;
```

- Inside slice methods

```ts
this.global.notify("success", "Saved!");
```

## Utilities Type Extension

Overriding `OrcheStore.Slots.global` provides full typing everywhere.

```ts
import type { NavigateFunction } from "react-router";

declare global {
  namespace OrcheStore {
    interface Slots {
      global: {
        navigate: NavigateFunction;

        notify(type: "info" | "error" | "success", message: string): void;
      };
    }
  }
}
```

```ts
this.global; // Before: any
this.global; // After: fully typed
```

**Rules:**

- `global` must be an object
- `null` and `undefined` are excluded automatically
  - `object | null | undefined` is equivalent to `object`
- Invalid types fall back to `any`

## Providing Runtime Utilities

Global utility values can be registered or updated at runtime.

```ts
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { provideGlobalUtils } from "orchestore";
import { feedbacks } from "./ui-feedbacks";

provideGlobalUtils({
  notify(type, message) {
    feedbacks.notify(type, message);
  },
});

export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    provideGlobalUtils({ navigate });
  }, [navigate]);

  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  );
}
```

## Using Global Utilities in Slices

Global utilities can be used anywhere a slice instance is available.

```ts
methods: {
  async insertUser(data: UserInput) {
    try {
      this.setLoading(true);

      const response = await api.users.add(data);

      this.global.notify("success", "User added successfully!");

      this.setLoading(false);

      this.global.navigate("/users/" + response.id);
    } catch (error) {
      this.global.notify("error", "Failed to add user");

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

## Framework Type Extensions

OrcheStore also exposes user-definable type slots through `OrcheStore.Slots`.

These slots allow application-specific types to be injected into the framework and become available everywhere with full type safety.

| Slot                       | Purpose                 |
| -------------------------- | ----------------------- |
| `OrcheStore.Slots.root`   | Root store typing       |
| `OrcheStore.Slots.global` | Global utilities typing |

```ts
declare global {
  namespace OrcheStore {
    interface Slots {
      root: typeof store;

      global: {
        navigate: NavigateFunction;
        notify(type: "info" | "error" | "success", message: string): void;
      };
    }
  }
}
```

This provides full typing for APIs such as:

```ts
state.root;

this.root;
this.global;

store.global;
counter.global;
```

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
