import { getStore } from "../store/creator";
import { RTKReducerType } from "../helpers/imports";
import { validateKey } from "../helpers/internal";
import { MESSAGES } from "../helpers/messages";
import type { SliceMeta } from "../helpers/types";

/**
 * Validates and normalizes a mutation before it is converted into a Redux reducer.
 *
 * Ensures compatibility with Redux Toolkit constraints and wraps valid mutations
 * into a runtime-safe reducer that respects slice ownership boundaries.
 */
const validateMutation = (name: string, meta: SliceMeta, key: string, mutation: any) => {
	if ((mutation as any)?._reducerDefinitionType === RTKReducerType.asyncThunk)
		return MESSAGES("createSlice", name).InvalidThunkReducer(key);

	if ("reducer" in { ...(mutation || {}) }) return MESSAGES("createSlice", name).InvalidPreparedReducer(key);

	if (typeof mutation !== "function") return MESSAGES("createSlice", name).InvalidMutation(key, mutation);

	return (state: any, action: any) => {
		if (action?.meta?.path !== meta.path) return;
		return mutation.apply(meta.node, [state, ...(Array.isArray(action?.payload) ? action.payload : [])]);
	};
};

/**
 * Core translation layer between OrcheStore and Redux Toolkit.
 *
 * This is where OrcheStore "mutations" become actual Redux reducers,
 * allowing slice methods to behave like direct function calls while
 * still executing through Redux.
 * 
 * Mutation names must be unique and must not collide with reserved runtime keys.
 */
export const mutationsToReducers = (name: string, meta: SliceMeta, mutations: any, reserved: string[]) => {
	const reducer: any = {};

	Object.entries(mutations).forEach(([k, item]) => {
		const key = validateKey("createSlice", name, "Slice", "mutation", k, reserved)!;
		const mutation = key ? validateMutation(name, meta, key, item) : undefined;

		if (!mutation) return delete mutations[key];

		reducer[key] = mutation;
		reserved.push(key);
	});

	return reducer;
};

/**
 * Attaches callable mutation methods to the slice instance.
 *
 * This layer converts OrcheStore mutations into runtime functions
 * that dispatch scoped Redux actions with slice metadata, bridging
 * the direct-call API with Redux’s dispatch-based execution model
 * while preserving slice ownership and isolation within the state tree.
 */
export const exposeMutations = (name: string, meta: SliceMeta) => {
	Object.entries(meta.redux.actions).forEach(([key, action]: [string, any]) => {
		(meta.node as any)[key] = (...args: any[]) => {
			const root = getStore.of(name, meta, "slice::mutation");
			const payload = {
				...(args.length ? action(args) : action()),
				meta: { path: meta.path },
			};

			root?.redux.dispatch(payload);
		};
	});
};
