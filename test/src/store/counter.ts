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

	methods: {
		async incrementAfter(amount: number, delay = 1000) {
			await this.utils.sleep(delay);
			this.increment(amount);
		},
	},

	children: {
		subCounter,
	},

	// listeners(builder) {
	// 	// Current selection
	// 	builder.on("refresh", noop);

	// 	// Parent selection
	// 	builder.parent.on("refresh", noop);
	// 	builder.parents.at(2).on("refresh", noop);
	// 	builder.parents.find({ family: "CRUDSlice" }).on("refresh", noop);

	// 	// Absolute selection
	// 	builder.slice("shop.products").on("create", noop);
	// 	builder.slices.at("auth").on("login", noop);
	// 	builder.slices.filter({ family: "CRUDSlice" }).on("refresh", noop);
	// 	builder.slices.deepFilter({ family: "CRUDSlice" }).on("reset", noop);

	// 	// Relative selection
	// 	builder.child("pagination").on("change", noop);
	// 	builder.children.on("refresh", noop);
	// 	builder.children.at("filters.search").on("change", noop);
	// 	builder.children.filter({ family: "CRUDSlice" }).on("refresh", noop);
	// 	builder.children.deepFilter({ family: "CRUDSlice" }).on("reset", noop);

	// 	// Chaining
	// 	builder.parent.children.at("pagination").on("change", noop);
	// 	builder.parents.find({ family: "ShopSlice" }).children.on("refresh", noop);
	// 	builder.slice("shop").children.at("products").on("create", noop);
	// 	builder.slices.at("shop", "stock").children.filter({ family: "CRUDSlice" }).on("refresh", noop);
	// },
});

// const noop = (state: any) => console.log(state);
