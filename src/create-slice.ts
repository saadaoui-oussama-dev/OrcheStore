import type { Mutations, Slice, SliceOptions, Store, StoreOptions } from "../types/internal";

const createSlice = <S, R extends Mutations<S>, M>(options: SliceOptions<S, R, M>): Slice<S, R, M> => {
	return {} as Slice<S, R, M>;
};

export { createSlice };
