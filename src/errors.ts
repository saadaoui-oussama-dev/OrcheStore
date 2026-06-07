import { typeChecker } from "./helpers/functions";
import type { ExposeContext } from "./helpers/validators";

export const storeProviderErrors = {
  InvalidStore: (store: any) => ["[OrcheStore::context] <StoreProvider> requires a store instance created with createStore(...).\n", ...typeChecker(store)], // prettier-ignore
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

  InvalidArgs: "[OrcheStore::global-utils] Expected provideGlobalUtils(...) to receive a non-null object.\n", // prettier-ignore
};


export const storeErrors = {
  ReservedKey: (type: string, prop: string) => `[OrcheStore::createStore] '${prop}' is reserved by OrcheStore and should not be provided as a ${type}.`, // prettier-ignore
  InvalidChild: (key: string) => `[OrcheStore::createStore] Child slice '${key}' must be a slice object created using createSlice(...).`, // prettier-ignore
  singletoneLimitation: () =>
    "[OrcheStore::createStore] createStore(...) was called more than once.\n" +
    "OrcheStore currently supports only a single global store instance and will return the existing store.\n" +
    "If you are creating a store inside a React component, create it only once, for example:\n" +
    "const [store] = useState(() => createStore(...));\n" +
    "Avoid useState(createStore(...)) because createStore(...) will be executed on every render.",
};


export const sliceErrors = {
  InvalidStore: (type: string, name: string, store: any) => ({
    0: [
      `[OrcheStore::${type}] <StoreProvider> requires a store instance created with createStore(...).\n`,
      ...typeChecker(store),
    ],
    neverExposed: [
      `[OrcheStore::${type}] Slice {${name}} is not exposed in any store.\n` +
      `A slice must be exposed within at least one store before it can be accessed.\n` +
      `Create a store using createStore(...) and expose the slice as part of that store tree.`,
    ],
    notInTree: [
      `[OrcheStore::${type}] Slice {${name}} does not belong to the current store tree.\n` +
      `The requested operation was performed against a store that does not expose this slice.\n` +
      `Ensure the slice is exposed within the target store or access it through the correct store instance.\n`,
      ...typeChecker.prefixed("Current store", false, store),
    ],
    notProvided: [
      `[OrcheStore::${type}]`,
      ...typeChecker.prefixed("Current store", false, store),
    ],
  }),
  RequiredName: () => "[OrcheStore::createSlice] Missing required slice name. Expected a non-empty string.", // prettier-ignore
  InvalidName: (name: string) => `[OrcheStore::createSlice] Slice names cannot contain '.' or '/'. Received: {${name}}`, // prettier-ignore
  RequiredState: (name: string) =>`[OrcheStore::createSlice] Missing required slice state for slice: {${name}}`, // prettier-ignore
  InvalidState: (name: string) => `[OrcheStore::createSlice] Slice state must be a non-null object or a function that returns a non-null object. Slice: {${name}}`, // prettier-ignore
  ReservedKey: (type: string, prop: string) => `[OrcheStore::createSlice] '${prop}' is reserved by OrcheStore and should not be provided as a ${type}.`, // prettier-ignore
  InvalidMutation: (key: string) => `[OrcheStore::createSlice] Mutation '${key}' must be a function.`, // prettier-ignore
  InvalidMethod: (key: string) => `[OrcheStore::createSlice] Method '${key}' must be a function.`, // prettier-ignore
  InvalidChild: (key: string) => `[OrcheStore::createSlice] Child slice '${key}' must be a slice object created using createSlice(...).`, // prettier-ignore
  ReduxConflict: (prop: string) => `[OrcheStore::createSlice] '${prop}' is a Redux Toolkit createSlice(...) option and is not applicable to OrcheStore slices. This property will be ignored.`, // prettier-ignore
  ReduxReducerConflict: () => "[OrcheStore::createSlice] Redux Toolkit asyncThunk reducers are not supported in mutations. Use methods instead.", // prettier-ignore
};

export const validatorErrors = {
  target: ({ slice }: ExposeContext) => (slice ? ` Affected slice '${slice}':\n` : " "), // prettier-ignore
  RequiredName: (ctx: ExposeContext) => `[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}${ctx.type} keys must be non-empty strings.`, // prettier-ignore
  InvalidName: (ctx: ExposeContext, key: string) => `[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}${ctx.type} names cannot contain '.' or '/'. Received: ${key}.`, // prettier-ignore
  ReservedKey: (ctx: ExposeContext, key: string) => `[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}'${key}' is a reserved name and cannot be used as a ${ctx.type} key.`, // prettier-ignore
  DuplicateKey: (ctx: ExposeContext, key: string) => `[OrcheStore::${ctx.module}]${validatorErrors.target(ctx)}${ctx.type} name '${key}' conflicts with another member.`, // prettier-ignore
};
