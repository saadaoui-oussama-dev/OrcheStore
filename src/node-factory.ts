import type { FactoryOptions, FamilyMeta, NodeMeta, NodeFactory } from "../types/internal";

const { createNodeFactory }: NodeFactory = {
	createNodeFactory<T extends object, C>(options: FactoryOptions<T, C>) {
		const { instantiate, getConfig = (_, c) => c } = options;

		/** Runtime ownership metadata for managed nodes. */
		const metadata = new Map<T, NodeMeta<T>>();

		/** Registry of clone lineages. */
		const families = new Map<symbol, FamilyMeta<T, C>>();

		/** Resolves lineage and ownership metadata for a node. */
		function getData(node: T) {
			const meta = metadata.get(node);
			const family = meta ? families.get(meta.familyId) : undefined;
			if (!meta || !family) throw new Error("Unknown node");
			return [family, meta] as const;
		}

		/** Creates the first member of a new lineage. */
		function create(config: C) {
			const familyId = Symbol("family");
			const meta = { familyId, path: "", children: new Map<string, T>(), parents: [] as T[] };
			const family = { config, siblings: new Set<T>() };

			let node: T;
			node = instantiate(config, () => [node, meta, family]);

			family.siblings.add(node);
			metadata.set(node, meta);
			families.set(familyId, family);

			return node;
		}

		/** Creates a detached sibling in the same lineage. */
		function clone(node: T) {
			return cloneUnlessOrphan("", [], node, true, () => {});
		}

		/** Attaches a node under a parent, cloning only when ownership changes. */
		function attach(key: string, node: T, parent: T, parentChildren?: Map<string, T>) {
			// Prevent parent -> child1 -> child2 -> parent cycles.
			for (const child of getData(node)[1].children.values()) {
				if (child === parent) throw new Error("Infinite recursion");
			}

			return cloneUnlessOrphan(key, [parent], node, false, (clone) => {
				(metadata.get(parent)?.children || parentChildren)?.set(key, clone);
			});
		}

		/** Reconciles ownership by reusing or cloning nodes as needed. */
		function cloneUnlessOrphan(path: string, parents: T[], origin: T, forced: boolean, onSetChild: (c: T) => void) {
			let [node, [family, meta]] = [origin, getData(origin)];

			// A node can only have one owner. Clone when ownership changes.
			if (forced || meta.parents[0] !== parents[0]) {
				// Children are copied by reference first; ownership is reconciled recursively below.
				const cloneChildren = new Map(meta.children);

				const cloneMeta = { familyId: meta.familyId, path: "", children: cloneChildren, parents: [] as T[] };

				let clone: T;
				clone = instantiate(getConfig(origin, family.config), () => [clone, cloneMeta, family]);

				metadata.set((node = clone), (meta = cloneMeta));
				family.siblings.add(node);
			}

			// Update ownership metadata for the node's current location.
			meta.path = path;
			meta.parents = parents;
			onSetChild(node);

			for (const [key, child] of [...meta.children.entries()]) {
				cloneUnlessOrphan(`${path}${path ? "." : ""}${key}`, [node, ...parents], child, forced, (clone) => {
					// Replace the reference only when reconciliation produced a clone.
					if (clone !== child) meta.children.set(key, clone);
				});
			}

			return node;
		}

		return { create, clone, attach };
	},
};

export { createNodeFactory };
