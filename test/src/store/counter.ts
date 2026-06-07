import { createSlice } from "orchestore";

export const subSubCounter = createSlice({
  name: "subSubCounter",
  state: { subSubValue: 0 },
  mutations: {
    increment(state, amount: number = 1) {
      state.subSubValue += amount;
    },
    decrement(state, amount: number = 1) {
      state.subSubValue -= amount;
    },
  },

  // computed: {
  //   double(state) {
  //     return state.subSubValue * 2;
  //   },
  // },

  methods: {
    async incrementAfter(amount: number, delay = 1000) {
      await this.global.sleep(delay);
      this.increment(amount);
    },
  },
});

export const subSubCounter2 = createSlice({
  name: "subSubCounter2",
  state: { subSubValue2: 0 },
  mutations: {
    increment(state, amount: number = 1) {
      state.subSubValue2 += amount;
    },
    decrement(state, amount: number = 1) {
      state.subSubValue2 -= amount;
    },
  },

  // computed: {
  //   double(state) {
  //     return state.subSubValue2 * 2;
  //   },
  // },

  methods: {
    async incrementAfter(amount: number, delay = 1000) {
      await this.global.sleep(delay);
      this.increment(amount);
    },
  },
});

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

  // computed: {
  //   double(state) {
  //     return state.subValue * 2;
  //   },
  // },

  methods: {
    async incrementAfter(amount: number, delay = 1000) {
      await this.global.sleep(delay);
      this.increment(amount);
    },
  },

  // children: {
  //   subSubCounter,
  //   subSubCounter2,
  // }
});

export const subCounter2 = createSlice({
  name: "subCounter2",
  state: { subValue2: 0 },
  mutations: {
    increment(state, amount: number = 1) {
      state.subValue2 += amount;
    },
    decrement(state, amount: number = 1) {
      state.subValue2 -= amount;
    },
  },

  // computed: {
  //   double(state) {
  //     return state.subValue2 * 2;
  //   },
  // },

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

  // computed: {
  //   double(state) {
  //     return state.value * 2;
  //   },
  // },

  methods: {
    async incrementAfter(amount: number, delay = 1000) {
      await this.global.sleep(delay);
      this.increment(amount);
    },
  },

  // children: {
  //   subCounter,
  //   subCounter2
  // },
});
