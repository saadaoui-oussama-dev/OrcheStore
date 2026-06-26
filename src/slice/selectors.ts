import { resolveDeepState } from "./state";
import { getStore } from "../store/creator";
import { getUtils } from "../utils/app-wide";
import { defineMethod, defineReadonly } from "../helpers/internal";
import type { Meta } from "../helpers/types";

/**
 * Exposes reactive slice-level selector APIs on a slice node.
 *
 * Provides integration points for subscribing to state changes and consuming
 * derived values within reactive environments.
 */
export const exposeSliceSelectors = (name: string, meta: Meta) => {
	defineMethod(meta.node, "useSelect", (selector: any) => {
		const rootStore = getStore.of(name, meta, "slice.useSelect");
		const context = { utils: getUtils(), root: rootStore?.node };

		return rootStore?.selector((state: any) => {
			const sliceState = resolveDeepState(meta.path, state);
			return selector.apply(context, [sliceState, context]);
		});
	});

	// Reserved for future computed-state APIs.
	defineReadonly(meta.node, "computed", () => {
		return undefined;
	});
};
