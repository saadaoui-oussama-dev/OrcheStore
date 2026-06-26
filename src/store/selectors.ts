import { getUtils } from "../utils/app-wide";
import { defineMethod } from "../helpers/internal";
import { createRTKSelector, ReactContext, useReactContext } from "../helpers/imports";
import { MESSAGES } from "../helpers/messages";
import type { AnyStore, ExtraMeta, NodeMeta } from "../helpers/types";

/**
 * Exposes reactive store-level selector APIs on a store node.
 *
 * This layer wires the store instance into React via a dedicated context,
 * enabling `useSelect` to subscribe to state updates scoped to this store.
 *
 * It also provides a safe runtime guard to ensure the component is rendered
 * within the correct StoreProvider tree, preventing cross-store context usage.
 *
 * The selector is executed through a React Redux–based selector hook
 * bound to the store’s internal context, while `useSelect` exposes a
 * user-friendly API that automatically injects OrcheStore runtime context.
 */
export const exposeStateSelectors = (name: string, meta: NodeMeta<AnyStore, ExtraMeta>) => {
	const context = ReactContext(null);
	const useSelector = createRTKSelector(context as any);

	meta.context = context;

	meta.selector = (childType: string, childName: string, selector: any) => {
		const context = useReactContext(meta.context);
		if (context) return useSelector(selector);
		if (childType) MESSAGES("useSelect", childName, childType).StoreNotProvided(name);
		else MESSAGES("useSelect", name, "Store").StoreNotProvided("");
	};

	defineMethod(meta.node, "useSelect", (selector: any) => {
		const context = { utils: getUtils(), root: meta.node };
		return meta.selector("", "", (state: any) => selector.apply(context, [state, context]));
	});
};
