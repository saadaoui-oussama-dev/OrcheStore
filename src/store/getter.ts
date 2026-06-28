import { MESSAGES } from "../helpers/messages";
import type { AnyStore, NodeMeta, StoreMeta } from "../helpers/types";

/**
 * Creates a scoped lookup utility for resolving store metadata
 * from runtime instance maps.
 */
export const createStoreGetter = (instances: Map<AnyStore, StoreMeta>) => {
	return {
		/**
		 * Resolves metadata for a given store instance.
		 *
		 * If the store is not found, an optional error callback is invoked.
		 * Returns `undefined` when resolution fails.
		 */
		get: (store?: AnyStore, error?: (parent: any) => void) => {
			const meta = store ? instances.get(store) : undefined;
			if (!meta) return void error?.(store);
			return meta;
		},

		/**
		 * Resolves the root store metadata for a given child node.
		 *
		 * Traverses the parent chain from a node metadata object and returns
		 * the owning store metadata entry.
		 *
		 * Used during runtime execution to resolve:
		 * - parent store context
		 * - root store state access
		 * - mutation dispatch routing
		 *
		 * Returns `undefined` and optionally triggers a runtime message
		 * if the store or metadata cannot be resolved.
		 */
		of: (name: string, childMeta: NodeMeta<any, any, any>, trigger?: string) => {
			const store = childMeta.parents?.at?.(-1)?.node as any;
			const meta = store ? instances.get(store) : undefined;

			if (!store) return void (trigger && MESSAGES(trigger).NeverExposed(name));
			else if (!meta) return void (trigger && MESSAGES(trigger).ParentNeverExposed(name, (store as any).name));

			return meta;
		},
	};
};
