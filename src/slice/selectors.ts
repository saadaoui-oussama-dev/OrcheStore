import { resolveDeepState } from "./state";
import { getStore } from "../store/creator";
import { getUtils } from "../utils/app-wide";
import { useRTKSelector } from "../helpers/imports";
import { defineMethod, defineReadonly } from "../helpers/internal";
import type { Meta } from "../helpers/types";

/**
 * Exposes reactive state access APIs on a node.
 *
 * Provides integration points for subscribing to state changes and consuming
 * derived values within reactive environments.
 */
export const exposeStateSelectors = (name: string, meta: Meta) => {
	defineMethod(meta.node, "useSelect", (selector: any) => {
		const context = { utils: getUtils(), root: getStore.of(name, meta, "slice.useSelect")?.node };

		return useRTKSelector((state: any) => {
			const sliceState = resolveDeepState(meta.path, state);
			return selector.apply(context, [sliceState, context]);
		});
	});

	// Reserved for future computed-state APIs.
	defineReadonly(meta.node, "computed", () => {
		return undefined;
	});
};
