import { MESSAGES } from "../helpers/messages";
import type { AnyStore, ExtraMeta, NodeMeta } from "../helpers/types";

/**
 * Creates a scoped lookup utility for resolving store metadata
 * from runtime instance maps.
 */
export const createStoreGetter = (instances: Map<AnyStore, NodeMeta<AnyStore, ExtraMeta>>) => {
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
		 * - lineage root access
		 * - mutation dispatch routing
		 *
		 * Returns `undefined` and optionally triggers a runtime message
		 * if the store or metadata cannot be resolved.
		 */
		of: (name: string, childMeta: NodeMeta<any, {}>, trigger?: string) => {
			const store = childMeta.parents?.at?.(-1);
			const meta = store ? instances.get(store as any) : undefined;

			if (!store) return void (trigger && MESSAGES(trigger).NeverExposed(name));
			else if (!meta) return void (trigger && MESSAGES(trigger).ParentNeverExposed(name, (store as any).name));

			return meta;
		},
	};
};
