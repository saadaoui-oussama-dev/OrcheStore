# OrcheStore

> A function-oriented state orchestration architecture built on top of Redux Toolkit.

OrcheStore simplifies and automates common state management patterns in the React, Redux, and TypeScript ecosystem.

Instead of distributing application logic across reducers, actions, thunks, selectors, middleware, hooks, and utility files, OrcheStore brings state and behavior together into directly callable runtime modules.

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

---

# Why OrcheStore?

Redux Toolkit significantly improves the Redux developer experience, but many applications still require developers to coordinate logic across multiple concepts:

- reducers
- action creators
- thunks
- selectors
- middleware
- hooks
- utility functions

As applications grow, state management often becomes less about solving business problems and more about connecting infrastructure together.

OrcheStore reduces that coordination overhead by exposing state management through unified slice modules.

A slice is more than a state container.

It is a runtime module that can encapsulate:

- state
- mutations
- methods
- selectors
- child slices
- shared utilities

This allows state and application logic to evolve together within the same domain boundary.

The result is a simpler architecture with fewer moving parts, less boilerplate, and a more direct development experience.

---

# What OrcheStore Automates

Traditional Redux applications often require developers to manually create and connect multiple layers of infrastructure.

OrcheStore automates many of these patterns by default:

| Traditional Redux Pattern     | OrcheStore                |
| ----------------------------- | ------------------------- |
| Action creators               | Direct callable mutations |
| Thunks                        | Methods                   |
| Dispatch calls                | Direct function calls     |
| PayloadAction wrappers        | Native function arguments |
| Cross-slice imports           | Root store access         |
| Shared service wiring         | Global utilities          |
| Manual state tree composition | Nested slices             |
| Complex type declarations     | Automatic inference       |

This allows developers to focus on application behavior rather than framework plumbing.

---

# Example: OrcheStore vs Redux Toolkit

OrcheStore exposes direct callable mutations and built-in orchestration methods.

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
    // Built-in orchestration layer for async workflows
    async incrementAfter(amount: number, delay: number) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      this.increment(amount);
    },
  },
});

// Direct callable APIs
counter.increment(4);
counter.incrementLimited(1, 50);
counter.incrementAfter(5, 1000);
```

Redux Toolkit separates reducers, actions, dispatching, and async workflows into multiple APIs.

```tsx
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

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

const dispatch = useDispatch();

// Dispatch-based execution
dispatch(counter.actions.increment(4));

dispatch(counter.actions.incrementLimited({ amount: 1, max: 50 }));

dispatch(incrementAfter({ amount: 5, delay: 1000 }));
```

---

# Table of Contents

- [Core Concepts](#core-concepts)
- [Quick Example](#quick-example)
- [Creating Slices](#creating-slices)

  - [name](#name)
  - [state](#state)

- [Slice Runtime API](#slice-runtime-api)

  - [state](#runtime-state)
  - [path](#path)
  - [root](#root)
  - [global](#global)
  - [useSelect](#useSelect)

- [Slice Logic Layers](#slice-logic-layers)

  - [Mutations](#mutations)
  - [Methods](#methods)
  - [Selectors](#selectors)
  - [Nested Slices](#nested-slices)

- [Store Integration](#store-integration)
- [Runtime Type Extensions](#runtime-type-extensions)
- [TypeScript Inference](#typescript-inference)
- [Redux Toolkit Comparison](#redux-toolkit-comparison)
- [Architecture Overview](#architecture-overview)
- [Design Goals](#design-goals)
- [Status](#status)

---

# Core Concepts

A store slice consists of:

| Layer       | Responsibility                    |
| ----------- | --------------------------------- |
| `name`      | Unique slice identifier           |
| `path`      | Hierarchical slice path           |
| `state`     | Reactive slice data storage       |
| `mutations` | Synchronous state transitions     |
| `methods`   | Async orchestration and workflows |
| `selectors` | Derived and computed state        |
| `useSelect` | React subscription hook           |
| `children`  | Nested slice composition          |

---

# Quick Example

## Slice Creation

```ts
import { createSlice } from "orchestore";

export const counter = createSlice({
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
      await this.sleep(delay);
      this.increment(amount);
      return this.state.value;
    },
    async sleep(delay: number) {
      return await new Promise((resolve) => setTimeout(resolve, delay));
    },
  },
});
```

## Store Integration

```ts
import { defineStore } from "orchestore";
import { counter } from "./counterSlice";

export const store = defineStore({
  slices: {
    counter,
  },
});
```

## React Usage

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

```tsx
import { counter } from "./store/counterSlice";

export function CounterComponent() {
  const value = counter.useSelect((state) => state.value);

  return (
    <>
      <div>Counter: {value}</div>

      <button onClick={() => counter.increment(1)}>Increment</button>

      <button onClick={() => counter.incrementAfter(1, 1000)}>Increment Later</button>
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

  mutations: {},

  methods: {},

  selectors: {},

  children: {},
});
```

---

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
console.log(counter.name);
// "counter"
```

It is also accessible inside methods:

```ts
methods: {
  logName() {
    console.log(this.name);
  }
}
```

### Rules

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

### Lazy State Initialization

State may also be initialized lazily.

The initializer runs only once before the first state access.

```ts
const counter = createSlice({
  name: "counter",

  state: () => ({
    value: 0,
  }),
});
```

Useful for:

- expensive initialization
- persisted state restoration
- runtime-dependent values

---

## Runtime state

`slice.state` always returns the latest immutable runtime snapshot.

State can only be updated through mutations.

```ts
counter.state.value;
```

Available:

- outside React
- inside methods
- inside selectors (`slice.useSelect` and `store.useSelect`)

Each access returns the current snapshot at the moment of access.

Previously captured snapshots are not updated after future mutations.

```ts
mutations: {
  changeTo(state, value: string) {
    state.value = value;
  },
},

methods: {
  logValue() {
    this.changeTo("John");
    const snapshot = this.state;
    this.changeTo("Alice");
    console.log(snapshot); // { value: "John" }
    console.log(this.state); // { value: "Alice" }
  }
}
```

---

## Runtime path

Every slice exposes a fully qualified hierarchical path.

```ts
store.counter.name;
// "counter"

store.counter.path;
// "counter"
```

Nested slices automatically inherit hierarchical paths.

```ts
store.admin.users.name;
// "users"

store.admin.users.path;
// "admin.users"
```

---

## root

Every slice has access to the root store instance.

```ts
this.root.auth.state.user;
```

Useful for:

- cross-slice coordination
- avoiding circular imports
- application-wide orchestration

---

## global

Slices have access to injected runtime utilities through `global`.

Utilities are injected using `provideGlobalUtils`.

See the [Global Utilities](#global-utilities) section.

```ts
this.global.notify("success", "Saved!");
```

Useful for:

- frequently used utilities
- runtime values that are otherwise difficult to access from slices
- integrations with React hooks and third-party libraries

---

## Mutations

Mutations are synchronous state transition functions.

### Characteristics

- receive mutable draft state as the first parameter
- support multiple user-defined arguments
- directly callable from the exposed slices or store

### Responsibilities

Mutations should contain:

- synchronous state updates
- deterministic state transitions
- normalization logic

For anything else, use methods instead.

### Example

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

### Characteristics

- receive any number of arguments
- can return synchronous values or Promises
- can access:
  - state, mutations, slibling methods, nested slices (through `this`)
  - Application-wide store (`this.root`) and utilities (`this.global`)

Methods are not serialized, replayable, or represented in Redux DevTools action history.

### Responsibilities

Methods are designed for centralizing any slice-related logic:

- asynchronous workflows
- business logic orchestration
- API communication and network calls
- timers, delayed or scheduled executions, such as `setTimeout` or event listeners
- side effects such as `localStorage`, `sessionStorage` and DOM manipulation
- Slice-related React hooks such as `slice.useSelect`, tanstack `useQuery` and `useMutation`

Methods should NOT:

- include slice-unrelated logic .
- mutate state directly. use mutations instead.

### Example

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
      return this.state.value;
    },
  },
});
```

---

## Selectors

Selectors provide reusable derived state.

```ts
const counter = createSlice({
  name: "counter",

  state: {
    value: 10,
  },

  selectors: {
    doubled(state) {
      return state.value * 2;
    },

    multiplied(state, amount: number) {
      return state.value * amount;
    },
  },
});
```

---

## useSelect

Slices expose a React hook for reactive state selection.

Internally powered by Redux Toolkit's `useSelector`.

```tsx
const value = counter.useSelect((state) => state.value);

const canEdit = users.useSelect((state, rootState) => {
  return (
    rootState.auth.isAuthenticated &&
    state.permissions.includes("edit_user")
  );
});
```

---

## Nested Slices

Slices can contain child slices.

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

### Rules

- A slice instance cannot be registered multiple times within the same state tree
- Existing slice instances cannot be wrapped again using `createSlice`
- Child slices must be registered through the `children` field

### Accessing Nested Slices

```ts
app.counter.increment(1);

console.log(app.counter.state);
```

Deeply nested slices are fully supported.

```ts
store.admin.users.permissions.grant(...);

store.admin.users.permissions.state;
```

Preferred state access pattern:

```ts
app.counter.state;
store.admin.users.permissions.state;
```

Avoid deeply traversing nested state objects directly:

```ts
app.state.counter;
store.admin.users.state.permissions;
store.admin.state.users.permissions;
store.state.admin.users.permissions;
```

---

# Store Integration

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

## React Integration

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

## Accessing Slices Through Store

```ts
store.counter.increment(1);

console.log(store.counter.state);
```

The root store behaves similarly to a parent slice.

---

# Runtime Type Extensions

OrcheStore supports TypeScript declaration merging for extending runtime APIs.

---

## Root Store

Overriding `OrcheStore.Define.root` provides full typing everywhere.

Under active development: This still cause a circular type inference problem

```ts
import { defineStore } from "orchestore";

export const store = defineStore({
  slices: {
    counter,
  },
});

declare global {
  namespace OrcheStore {
    interface Define {
      root: typeof store;
    }
  }
}
```

#### Rules

- `root` must be a store instance created using `defineStore`
- `typeof store | null | undefined` resolves to `typeof store`
- any other type resolves to `any`

### Root Store Access

The root store is accessible from methods through `this`.

```ts
this.root.counter.state;
```

---

## Global utilities

Overriding `OrcheStore.Define.global` provides full typing everywhere.

```ts
import type { NavigateFunction } from "react-router";

declare global {
  namespace OrcheStore {
    interface Define {
      global: {
        navigate: NavigateFunction;

        notify(type: "info" | "error" | "success", message: string): void;
      };
    }
  }
}
```

#### Rules

- global utilities must be an object
- `Utils | null | undefined` resolves to `Utils`
- any other type resolves to `undefined`

### Runtime Utility Values

Runtime global utility values can be provided dynamically.

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
    provideGlobalUtils({
      navigate,
    });
  }, [navigate]);

  return (
    <StoreProvider>
      <Routes />
    </StoreProvider>
  );
}
```

### Global Utilities Access

Global utilities are accessible through:

```ts
store.global;
slice.global;
this.global;
```

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
      return this.state.value;
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
counter.state;
// { value: number, subCounter: { value: number } }

counter.subCounter.state;
// { value: number }

counter.increment(amount: number): void;

counter.incrementAfter(amount: number, delay?: number): Promise<number>;
```

No manual typing required.

---

# Redux Toolkit Comparison

| Feature                        | OrcheStore | Redux Toolkit |
| ------------------------------ | ---------- | ------------- |
| Direct callable mutations      | ✅         | ❌            |
| Multiple mutation arguments    | ✅         | ❌            |
| Requires dispatch              | ❌         | ✅            |
| PayloadAction wrapper          | ❌         | ✅            |
| Nested slice composition       | ✅         | ⚠️ Manual     |
| Built-in orchestration methods | ✅         | ❌            |
| Extensible global utilities    | ✅         | ❌            |
| Unified slice API              | ✅         | ❌            |
| Per-slice state hooks          | ✅         | ❌            |

---

# Architecture Overview

| Layer       | Responsibility                    |
| ----------- | --------------------------------- |
| `name`      | Unique slice identifier           |
| `path`      | Hierarchical slice path           |
| `state`     | Reactive slice data storage       |
| `mutations` | Synchronous state transitions     |
| `methods`   | Async orchestration and workflows |
| `selectors` | Derived and computed state        |
| `useSelect` | React subscription hook           |
| `children`  | Nested slice composition          |

---

# Design Goals

- Simplify state management architecture
- Automate repetitive Redux patterns
- Reduce infrastructure code
- Centralize state and behavior
- Provide direct and intuitive APIs
- Preserve Redux predictability
- Encourage scalable composition
- Deliver strong TypeScript inference
- Improve long-term maintainability

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
