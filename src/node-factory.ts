import type { FactoryOptions, FamilyMeta, NodeMeta, Factory, FactoryOutput } from "../types/internal";

const { createNodeFactory }: Factory = {
	createNodeFactory<T, P, E>({ factoryName, instantiate, options = {} }: FactoryOptions<T, P, E>) {
		/** Runtime ownership metadata for managed nodes. */
		const metadata = new Map<T, NodeMeta<T, E>>();

		/** Registry of clone lineages. */
		const families = new Map<symbol, FamilyMeta<T, P>>();

		/** Creates the first member of a new lineage. */
		const create: FactoryOutput<T, P, E>["create"] = (props) => {
			// Normalize and register the lineage props.
			props = options.adapt ? options.adapt(props) : props;
			props = options.register ? options.register(props) : props;

			// Initialize ownership and lineage metadata for the root node.
			const meta = { familyId: Symbol("family"), path: "", children: new Map<string, T>(), parents: [] as T[] } as any;
			const family = { props, siblings: new Set<T>() };

			// Instantiate the node with lazy access to its runtime metadata.
			let node: T;
			node = instantiate(props, () => [node, meta, family]);

			// Register the node as the first member of its lineage.
			family.siblings.add(node);
			metadata.set(node, meta);
			families.set(meta.familyId, family);

			return node;
		};

		/** Creates a detached sibling in the same lineage. */
		const clone: FactoryOutput<T, P, E>["clone"] = (node, errors) => {
			let meta = metadata.get(node)!;
			let family = (meta ? families.get(meta.familyId) : undefined)!;
			if (!meta || !family) {
				if (errors?.UnknownNode) return void errors?.UnknownNode?.("", node) as any;
				throw new Error(`[OrcheStore] ${factoryName} factory: Unknown node`);
			}
			return cloneUnlessOrphan("", [], node, meta, family, true, () => {});
		};

		/** Attaches a node under a parent, cloning only when ownership changes. */
		const attach: FactoryOutput<T, P, E>["attach"] = (key, node, parent, parentMetadata, errors) => {
			// Ensure the node is managed by this factory and belongs to a known lineage.
			let meta = metadata.get(node)!;
			let family = (meta ? families.get(meta.familyId) : undefined)!;
			if (!meta || !family) {
				if (errors?.UnknownNode) return void errors?.UnknownNode?.(key, node) as any;
				throw new Error(`[OrcheStore] ${factoryName} factory: Unknown node`);
			}

			// Resolve the parent's ownership metadata.
			const parentMeta = (parentMetadata || metadata.get(parent as any)) as NodeMeta<T, E>;
			if (!parentMeta) {
				if (errors?.UnknownParent) return void errors?.UnknownParent?.(key, node, parent) as any;
				throw new Error(`[OrcheStore] ${factoryName} factory: Unknown parent node`);
			}

			// Prevent ownership cycles.
			for (const p of [parent, ...parentMeta.parents]) {
				if (p === (node as any)) {
					if (errors?.InfiniteOwnership) return void errors?.InfiniteOwnership?.(key, node, parent) as any;
					throw new Error(`[OrcheStore] ${factoryName} factory: Infinite ownership recursion`);
				}
			}

			// Compute the node's location within the ownership tree.
			const path = (parentMeta.path ? `${parentMeta.path}.` : "") + key;
			const parents = [parent, ...parentMeta.parents] as T[];

			// Reconcile ownership and attach the resulting node.
			return cloneUnlessOrphan(path, parents, node, meta, family, false, (clone) =>
				parentMeta.children.set(key, clone),
			);
		};

		/** Reconciles ownership by reusing or cloning nodes as needed. */
		function cloneUnlessOrphan(...args: [string, T[], T, NodeMeta<T, E>, FamilyMeta<T, P>, boolean, (c: T) => void]) {
			let [path, parents, node, meta, family, force, onSetOwnership] = args;

			// A node can only have one owner. Clone when ownership changes.
			force = force || (meta.parents.length > 0 && (meta.parents[0] !== parents[0] || meta.path.split(".").at(-1) !== path.split(".").at(-1))); // prettier-ignore

			if (force) {
				// Prepare metadata and props for a new sibling in the same lineage.
				const $meta = { familyId: meta.familyId, path, children: new Map(meta.children), parents } as any;
				const props = options.clone ? options.clone(family.props, [node, meta, family]) : family.props;

				// Instantiate a sibling within the same lineage with lazy access to its runtime metadata.
				meta = $meta;
				node = undefined as T;
				node = instantiate(props, () => [node, $meta, family]);

				// Register the sibling in the lineage metadata.
				metadata.set(node, $meta);
				family.siblings.add(node);
			}

			// Update ownership metadata for the node's current location.
			meta.path = path;
			meta.parents = parents;
			onSetOwnership?.(node);

			// Propagate ownership reconciliation through the subtree.
			for (const [key, child] of [...meta.children.entries()]) {
				let meta = metadata.get(child)!;
				let family = (meta ? families.get(meta.familyId) : undefined)!;
				const childPath = `${path}${path ? "." : ""}${key}`;
				cloneUnlessOrphan(childPath, [node, ...parents], child, meta, family, force, (clone) => {
					if (clone !== child) meta.children.set(key, clone);
				});
			}

			return node;
		}

		return { create, attach, clone };
	},
};

export { createNodeFactory };
