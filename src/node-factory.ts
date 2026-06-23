import type { Factory, FactoryOptions, FactoryOutput, FactoryErrors, FamilyMeta, NodeMeta } from "../types/internal"; // prettier-ignore

const { createNodeFactory }: Factory = {
	createNodeFactory<N, P, E, A, I>(opts: FactoryOptions<N, P, E, A, I>) {
		const { instantiate, afterInstantiate, options = {} } = opts;

		/** Runtime metadata for all nodes managed by this factory. */
		const instances = new Map<N, NodeMeta<N, E>>();

		/** Registry of clone lineages. */
		const families = new Map<symbol, FamilyMeta<N, P>>();

		/** Ensure the node is managed by this factory and belongs to a known lineage. */
		const getData = (key: string, node: N, errors?: FactoryErrors<N>) => {
			const meta = instances.get(node)!;
			const family = (meta ? families.get(meta.familyId) : undefined)!;
			if (!meta || !family) return void errors?.UnknownNode?.(key, node);
			return [meta, family] as const;
		};

		/** Creates the first member of a new lineage. */
		const create: FactoryOutput<N, P, E, A>["create"] = (props) => {
			// Normalize and register the lineage props.
			props = options.adapt ? options.adapt(props) : props;
			props = options.register ? options.register(props) : props;

			// Initialize ownership and lineage metadata for the root node.
			const meta = { familyId: Symbol("family"), path: "", children: new Map(), parents: [] } as any;
			const family = { props, siblings: new Set<N>() };

			// Instantiate the node with access to its runtime metadata.
			const instantiatePayload = instantiate(props, meta, family, false);
			meta.node = instantiatePayload.node;

			// Register the node as the first member of its lineage.
			family.siblings.add(meta.node);
			instances.set(meta.node, meta);
			families.set(meta.familyId, family);

			// Post-instantiation composition and final wiring of the node.
			if (instantiatePayload && afterInstantiate)
				meta.node = afterInstantiate(meta.node, meta, family, false, instantiatePayload);

			return meta.node;
		};

		/** Creates a detached sibling in the same lineage. */
		const clone: FactoryOutput<N, P, E, A>["clone"] = (node, errors, payload) => {
			const data = getData("", node, errors);
			return data ? updateOwnership("", [], data[0], data[1], true, payload!, () => {}) : undefined;
		};

		/** Attaches a node under a parent, cloning only when ownership changes. */
		const attach: FactoryOutput<N, P, E, A>["attach"] = (key, node, parent, parentMetadata, errors) => {
			const data = getData(key, node, errors);
			if (!data) return;

			// Resolve the parent's ownership metadata.
			const parentMeta = (parentMetadata || instances.get(parent as any)) as NodeMeta<N, E>;
			if (!parentMeta) return void errors?.UnknownParent?.(key, node, parent) as any;

			// Prevent ownership cycles.
			const parents = [parent, ...parentMeta.parents] as N[];
			if ([parent, ...parentMeta.parents].includes(node)) return void errors?.InfiniteOwnership?.(key, node, parent);

			// Reconcile ownership and attach the resulting node.
			const path = (parentMeta.path ? `${parentMeta.path}.` : "") + key;
			return updateOwnership(path, parents, data[0], data[1], false, undefined!, (clone) => {
				parentMeta.children.set(key, clone);
			});
		};

		/** Reconciles ownership by reusing or cloning nodes as needed. */
		function updateOwnership(...args: [string, N[], NodeMeta<N, E>, FamilyMeta<N, P>, boolean, A, (c: N) => void]) {
			let [path, parents, meta, family, force, payload, onSetOwnership] = args;
			let instantiatePayload: I & { node: N } = undefined!;

			// A node can only have one owner. Clone when ownership changes.
			force = force || (meta.parents.length > 0 && (meta.parents[0] !== parents[0] || meta.path.split(".").at(-1) !== path.split(".").at(-1))); // prettier-ignore

			if (force) {
				// Prepare metadata and props for a new sibling in the same lineage.
				const $meta = { familyId: meta.familyId, path, children: new Map(meta.children), parents } as any;
				const props = options.clone ? options.clone(family.props, meta, family, payload) : family.props;
				meta = $meta;

				// Instantiate a sibling within the same lineage with access to its runtime metadata.
				instantiatePayload = instantiate(props, $meta, family, true);
				meta.node = instantiatePayload.node;

				// Register the sibling in the lineage metadata.
				instances.set(meta.node, $meta);
				family.siblings.add(meta.node);
			}

			// Update ownership metadata for the node's current location.
			meta.path = path;
			meta.parents = parents;
			onSetOwnership?.(meta.node);

			// Propagate ownership reconciliation through the subtree.
			for (const [key, child] of [...meta.children.entries()]) {
				const childPath = `${path}${path ? "." : ""}${key}`;
				const [childMeta, childFamily] = getData(childPath, child)!;
				updateOwnership(childPath, [meta.node, ...parents], childMeta, childFamily, false, undefined!, (clone) => {
					if (clone !== child) meta.children.set(key, clone);
				});
			}

			// Post-instantiation composition and final wiring of the node.
			if (instantiatePayload && afterInstantiate)
				meta.node = afterInstantiate(meta.node, meta, family, true, instantiatePayload);

			return meta.node;
		}

		return { families, instances, create, attach, clone };
	},
};

export { createNodeFactory };
