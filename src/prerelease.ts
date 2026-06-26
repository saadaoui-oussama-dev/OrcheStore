import { createStore, getStore } from "./store/creator";
import { createSlice } from "./slice/creator";
import { devConsole } from "./helpers/messages";
import type { Mutations, Obj, Slice, SliceOptions, Store, StoreOptions } from "./helpers/types";

let informed = false;

const prereleasMessage =
	"[OrcheStore] 🚧 Pre-release Notice\n" +
	"Thank you for your interest in OrcheStore.\n" +
	"OrcheStore is currently under active development and is not yet ready for production use.\n" +
	"APIs, behavior, and internal implementation details may change without notice.\n" +
	"The first stable release is currently planned for 2026-06-30.\n" +
	"Stay tuned for updates!\n";

/**
 * Creates and initializes a slice runtime instance.
 *
 * This function constructs a fully functional OrcheStore slice,
 * including state, mutations, methods, and nested children.
 *
 * @prerelease
 * Calling this function will print a pre-release message in the console.
 * This behavior will be removed in the first stable release.
 */
const createSliceWrapper = <S extends Obj, R extends Mutations<S, C>, M, C>(
	props: SliceOptions<S, R, M, C>,
): Slice<S, R, M, C> => {
	if (!informed) ((informed = true), devConsole.log([prereleasMessage]));
	return createSlice(props);
};

/**
 * Creates and initializes an OrcheStore root instance.
 *
 * This function sets up the application-wide store tree,
 * mounts all slices, and connects the runtime to Redux Toolkit.
 *
 * The resulting store becomes the central access point for:
 * - slice instances and their mutations
 * - global state inspection
 * - React subscriptions via `useSelect`
 * - runtime utilities via `utils`
 */
const createStoreWrapper = <T>(props: StoreOptions<T>): Store<T> => {
	if (!informed) ((informed = true), devConsole.log([prereleasMessage]));
	return createStore(props);
};

export { createSliceWrapper as createSlice, createStoreWrapper as createStore };
