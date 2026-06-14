import type { FactoryOptions, FamilyMeta, NodeMeta, Factory } from "../types/internal";

const { createNodeFactory }: Factory = {
	createNodeFactory<T, C>({ factoryName, instantiate, options = {} }: FactoryOptions<T, C>) {
		/** Runtime ownership metadata for managed nodes. */
		const metadata = new Map<T, NodeMeta<T>>();

		/** Registry of clone lineages. */
		const families = new Map<symbol, FamilyMeta<T, C>>();

		/** Resolves lineage and ownership metadata for a node. */
		function getNodeData(node: T) {
			const meta = metadata.get(node);
			const family = meta ? families.get(meta.familyId) : undefined;
			if (!meta || !family) throw new Error(`${factoryName} factory: Unknown node`);
			return [family, meta] as const;
		}

		/** Creates the first member of a new lineage. */
		function create(props: C) {
			// Normalize and register the lineage props.
			props = options.adapt ? options.adapt(props) : props;
			props = options.register ? options.register(props) : props;

			// Initialize ownership and lineage metadata for the root node.
			const meta = { familyId: Symbol("family"), path: "", children: new Map<string, T>(), parents: [] as T[] };
			const family = { props, siblings: new Set<T>() };

			// Instantiate the node with lazy access to its runtime metadata.
			let node: T;
			node = instantiate(props, () => [node, meta, family]);

			// Register the node as the first member of its lineage.
			family.siblings.add(node);
			metadata.set(node, meta);
			families.set(meta.familyId, family);

			return node;
		}

		/** Creates a detached sibling in the same lineage. */
		function clone(node: T) {
			return cloneUnlessOrphan("", [], node, true);
		}

		/** Attaches a node under a parent, cloning only when ownership changes. */
		function attach<P = T>(key: string, node: T, parent: P, parentMetadata?: NodeMeta<P>) {
			// Resolve the parent's ownership metadata.
			const parentMeta = (parentMetadata || metadata.get(parent as any)) as NodeMeta<T>;
			if (!parentMeta) throw new Error(`${factoryName} factory: Unknown node parent`);

			// Prevent ownership cycles.
			if (node === (parent as any)) throw new Error(`${factoryName} factory: Infinite ownership recursion`);
			for (const parent of parentMeta.parents.values()) {
				if (parent === (node as any)) throw new Error(`${factoryName} factory: Infinite ownership recursion`);
			}

			// Compute the node's location within the ownership tree.
			const path = (parentMeta.path ? `${parentMeta.path}.` : "") + key;
			const parents = [parent, ...(parentMeta.parents || [])] as T[];

			// Reconcile ownership and attach the resulting node.
			return cloneUnlessOrphan(path, parents, node, false, (clone) => parentMeta.children.set(key, clone));
		}

		/** Reconciles ownership by reusing or cloning nodes as needed. */
		function cloneUnlessOrphan(path: string, parents: T[], origin: T, force: boolean, onSetOwnership?: (c: T) => void) {
			let [node, [family, meta]] = [origin, getNodeData(origin)];

			// A node can only have one owner. Clone when ownership changes.
			force = force || (meta.parents.length > 0 && (meta.parents[0] !== parents[0] || meta.path.split(".").at(-1) !== path.split(".").at(-1))); // prettier-ignore

			if (force) {
				// Prepare metadata and props for a new sibling in the same lineage.
				meta = { familyId: meta.familyId, path, children: new Map(meta.children), parents };
				const props = options.clone ? options.clone(family.props, origin) : family.props;

				// Instantiate a sibling within the same lineage with lazy access to its runtime metadata.
				node = undefined as T;
				node = instantiate(props, () => [node, meta, family]);

				// Register the sibling in the lineage metadata.
				metadata.set(node, meta);
				family.siblings.add(node);
			}

			// Update ownership metadata for the node's current location.
			meta.path = path;
			meta.parents = parents;
			onSetOwnership?.(node);

			// Propagate ownership reconciliation through the subtree.
			for (const [key, child] of [...meta.children.entries()]) {
				cloneUnlessOrphan(`${path}${path ? "." : ""}${key}`, [node, ...parents], child, force, (clone) => {
					if (clone !== child) meta.children.set(key, clone);
				});
			}

			return node;
		}

		return { create, clone, attach };
	},
};

export { createNodeFactory };
