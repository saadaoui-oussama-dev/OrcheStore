import { createSlice } from "orchestore";

export const subCounter = createSlice({
  name: "subCounter",
  state: { subValue: 0 },
  mutations: {
    increment(state, amount: number = 1) {
      state.subValue += amount;
    },
    decrement(state, amount: number = 1) {
      state.subValue -= amount;
    },
  },

  computed: {
    double(state) {
      return state.subValue * 2;
    },
  },

  methods: {
    async incrementAfter(amount: number, delay = 1000) {
      await this.global.sleep(delay);
      this.increment(amount);
    },
  },
});

export const counter = createSlice({
  name: "counter",
  state: { value: 0 },
  mutations: {
    increment(state, amount: number = 1) {
      state.value += amount;
    },
    decrement(state, amount: number = 1) {
      state.value -= amount;
    },
  },

  computed: {
    double(state) {
      return state.value * 2;
    },
  },

  methods: {
    async incrementAfter(amount: number, delay = 1000) {
      await this.global.sleep(delay);
      this.increment(amount);
    },
  },

  children: {
    subCounter,
  },
});
