import type { Mutations, Slice, SliceOptions, Store, StoreOptions } from "../types/internal";

const createSlice = <S, R extends Mutations<S>, M>(options: SliceOptions<S, R, M>): Slice<S, R, M> => {
	return {} as Slice<S, R, M>;
};

const createStore = <T>(options: StoreOptions<T>): Store<T> => {
	return {} as Store<T>;
};

const slice1 = createSlice({
	name: "slice1",

	state: {
		hello: 3,
	},

	mutations: {
		hell(state) {
			state.hello = 34;
		},
	},
});

const slice2 = createSlice({
	name: "slice2",

	state: {
		bye: 3,
	},

	mutations: {
		set(state) {
			state.bye = 4;
		},
	},
});

slice2.set();

const store = createStore({
	slices: {
		slice1,
		// slice2,
		// what: 0,
	},
});

console.log(store.slice1);
// console.log(store.slice2);

type A = typeof store;
type A1 = ReturnType<typeof store.getState>;

type B = typeof slice1;
type B1 = typeof store.slice1;
type B2 = ReturnType<typeof slice1.getState>;
type B3 = ReturnType<typeof store.slice1.getState>;

type C = typeof slice2;
// type C1 = typeof store.slice2;
type C2 = ReturnType<typeof slice2.getState>;
// type C3 = ReturnType<typeof store.slice2.getState>;

const invalidSliceNotExposed: "what" extends keyof typeof store ? false : true = true;
const sliceExposed: B extends B1 ? (B1 extends B ? true : false) : false = true;
const sliceStateExposed: B2 extends B3 ? (B3 extends B2 ? true : false) : false = true;

const value = store.useSelect(function (state, context) {
	context.global;
	return state.slice1.hello;
});

store.getState();

const value2 = store.slice1.useSelect(function (state, context) {
	return 0;
});
