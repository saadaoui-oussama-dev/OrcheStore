import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const subSubCounter = createSlice({
  name: "subSubCounter",
  initialState: { subSubValue: 0 },
  reducers: {
    increment(state, amount: PayloadAction<number>) {
      state.subSubValue += amount.payload ?? 1;
    },
    decrement(state, amount: PayloadAction<number>) {
      state.subSubValue -= amount.payload ?? 1;
    },
  },
});

export const subSubCounter2 = createSlice({
  name: "subSubCounter2",
  initialState: { subSubValue2: 0 },
  reducers: {
    increment(state, amount: PayloadAction<number>) {
      state.subSubValue2 += amount.payload ?? 1;
    },
    decrement(state, amount: PayloadAction<number>) {
      state.subSubValue2 -= amount.payload ?? 1;
    },
  },
});

export const subCounter = createSlice({
  name: "subCounter",
  initialState: { subValue: 0 },
  reducers: {
    increment(state, amount: PayloadAction<number>) {
      state.subValue += amount.payload ?? 1;
    },
    decrement(state, amount: PayloadAction<number>) {
      state.subValue -= amount.payload ?? 1;
    },
  },
});

export const subCounter2 = createSlice({
  name: "subCounter2",
  initialState: { subValue2: 0 },
  reducers: {
    increment(state, amount: PayloadAction<number>) {
      state.subValue2 += amount.payload ?? 1;
    },
    decrement(state, amount: PayloadAction<number>) {
      state.subValue2 -= amount.payload ?? 1;
    },
  },
});

export const counter = createSlice({
  name: "counter",
  initialState: { value: 0 },
  reducers: {
    increment(state, amount: PayloadAction<number>) {
      state.value += amount.payload ?? 1;
    },
    decrement(state, amount: PayloadAction<number>) {
      state.value -= amount.payload ?? 1;
    },
  },
});

// const counterSlice = createSlice({
//   name: 'counter',
//   initialState: { value: 0 },
//   reducers: {
//     // omitted
//   },
//   selectors: {
//     selectValue: (sliceState) => sliceState.value,
//   },
// })

// console.log(counterSlice.selectSlice({ counter: { value: 2 } })) // { value: 2 }

// const { selectValue } = counterSlice.selectors

// console.log(selectValue({ counter: { value: 2 } })); // 2
