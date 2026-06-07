import { typeChecker } from "./type-checker";
import type { ExposeContext } from "../../types/internal";

export const storeProviderErrors = {
	InvalidStore: (store: any) => ({
		StoreType: [
			"[OrcheStore::StoreProvider] Expected a store instance created with createStore(...).\n",
			...typeChecker(store),
		],
	}),
};

export const globalUtilsErrors = {
	GetMissingProp: (prop: any) => [
		"[OrcheStore::global-utils] Attempted to access a global utility before it became available. Missing property",
		prop,
		"\nIf this utility is optional, register it as undefined using provideGlobalUtils(...) to suppress future warnings.\n",
	],

	DeleteProp: (prop: any) => [
		"[OrcheStore::global-utils] Avoid deleting properties. Trying to delete property",
		prop,
		"\nUse provideGlobalUtils(...) to set them to undefined instead for type safety.\n",
	],

	InvalidArgs: () => "[OrcheStore::global-utils] Expected provideGlobalUtils(...) to receive a non-null object.\n",
};

export const storeErrors = {
	InvalidChild: (key: string) =>
		`[OrcheStore::createStore] Child slice '${key}' must be a slice created with createSlice(...).`,

	ReduxConflict: (prop: string) =>
		`[OrcheStore::createStore] '${prop}' is a Redux Toolkit configureStore(...) option and is ignored by OrcheStore.`,

	singletoneLimitation: () =>
		"[OrcheStore::createStore] createStore(...) was called more than once.\n" +
		"OrcheStore currently supports only a single global store instance and will return the existing store.\n" +
		"If you are creating a store inside a React component, create it only once, for example:\n" +
		"const [store] = useState(() => createStore(...));\n" +
		"Avoid useState(createStore(...)) because createStore(...) will execute on every render.",
};

export const sliceErrors = {
	InvalidStore: (store: any, type: string, name: string) => ({
		StoreType: [
			`[OrcheStore::${type}] Unable to resolve a valid store instance.\n` +
				`This operation requires a store created with createStore(...).\n`,
			...typeChecker(store),
		],

		NeverExposed: [
			`[OrcheStore::${type}] Slice {${name}} has not been exposed in any store.\n` +
				`Ensure the slice is reachable from a store instance.\n` +
				`This can be done by exposing the slice directly through createStore({ slices: ... }) or indirectly through a parent slice using createSlice({ children: ... }).`,
		],

		NotInTree: [
			`[OrcheStore::${type}] Slice {${name}} is not exposed within the target store.\n` +
				`A slice can only be accessed through stores that expose it.\n`,
			...typeChecker.prefixed("Current store", false, store),
		],
	}),

	RequiredName: () => "[OrcheStore::createSlice] Missing required slice name. Expected a non-empty string.",

	InvalidName: (name: string) => `[OrcheStore::createSlice] Slice names cannot contain '.' or '/'. Received: {${name}}`,

	RequiredState: (name: string) => `[OrcheStore::createSlice] Missing required state for slice {${name}}.`,

	InvalidState: (slice: string, state: any) => [
		`[OrcheStore::createSlice]${validatorErrors.target({ slice })}Slice state must be a non-null object or a function that returns a non-null object.\n`,
		...typeChecker(state),
	],

	InvalidMutation: (key: string) => `[OrcheStore::createSlice] Mutation '${key}' must be a function.`,

	InvalidMethod: (key: string) => `[OrcheStore::createSlice] Method '${key}' must be a function.`,

	InvalidChild: (key: string) =>
		`[OrcheStore::createSlice] Child slice '${key}' must be a slice created with createSlice(...).`,

	ReduxConflict: (prop: string) =>
		`[OrcheStore::createSlice] '${prop}' is a Redux Toolkit createSlice(...) option and is ignored by OrcheStore.`,

	ReduxReducerConflict: () =>
		"[OrcheStore::createSlice] Redux Toolkit asyncThunk reducers are not supported inside mutations. Use methods instead.",
};

export const validatorErrors = {
	target: ({ slice }: { slice?: string }) => (slice ? ` Affected slice '${slice}':\n` : " "),

	RequiredName: (ctx: ExposeContext) =>
		`[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}${ctx.type} keys must be non-empty strings.`,

	InvalidName: (ctx: ExposeContext, key: string) =>
		`[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}${ctx.type} names cannot contain '.' or '/'. Received: ${key}.`,

	ReservedKey: (ctx: ExposeContext, key: string) =>
		`[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}'${key}' is a reserved name and cannot be used as a ${ctx.type} key.`,

	DuplicateKey: (ctx: ExposeContext, key: string) =>
		`[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}${ctx.type} name '${key}' conflicts with another member.`,
};
