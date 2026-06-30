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
			await this.utils.sleep(delay);
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
			await this.utils.sleep(delay);
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
			await this.utils.sleep(delay);
			this.increment(amount);
		},
	},

	children: {
		subSubCounter,
		subSubCounter2,
	},
});

export const subCounter2 = createSlice({
	name: "subCounter2",
	state: { subValue2: 0, subCounter: 0 },
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
			await this.utils.sleep(delay);
			this.increment(amount);
		},
	},
});

export const counter = createSlice({
	name: "counter",
	state: { value: 0 },
	mutations: {
		increment(state, amount: number = 1) {
			return {
				...state,
				value: state.value + amount,
			};
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
			await this.utils.sleep(delay);
			this.increment(amount);
		},
	},

	children: {
		subCounter,
		subCounter2,
	},

	...({
		listeners(builder: any) {
			// Current selection
			builder.on("refresh", noop);

			// Parent selection
			builder.parent.on("refresh", noop);
			builder.parents.at(2).on("refresh", noop);
			builder.parents.find({ family: "CRUDSlice" }).on("refresh", noop);

			// Absolute selection
			builder.slice("shop.products").on("create", noop);
			builder.slices.at("auth").on("login", noop);
			builder.slices.filter({ family: "CRUDSlice" }).on("refresh", noop);
			builder.slices.deepFilter({ family: "CRUDSlice" }).on("reset", noop);

			// Relative selection
			builder.child("pagination").on("change", noop);
			builder.children.on("refresh", noop);
			builder.children.at("filters.search").on("change", noop);
			builder.children.filter({ family: "CRUDSlice" }).on("refresh", noop);
			builder.children.deepFilter({ family: "CRUDSlice" }).on("reset", noop);

			// Chaining
			builder.parent.children.at("pagination").on("change", noop);
			builder.parents.find({ family: "ShopSlice" }).children.on("refresh", noop);
			builder.slice("shop").children.at("products").on("create", noop);
			builder.slices.at("shop", "stock").children.filter({ family: "CRUDSlice" }).on("refresh", noop);
		},
	} as any),
});

const noop = (state: any) => console.log(state);

// subSubCounter, subSubCounter2, subCounter, subCounter2, counter
