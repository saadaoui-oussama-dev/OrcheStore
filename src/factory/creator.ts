import type { FactoryInput, FactoryOutput, FamilyMeta, NodeMeta } from "../helpers/types"; // prettier-ignore

/**
 * Creates a hierarchical node factory with lineage-based ownership reconciliation.
 *
 * It manages nodes that can be mounted in multiple places in a hierarchy while ensuring each runtime location
 * receives its own isolated instance. When a node is reused under a different parent or path, it is cloned within
 * the same lineage to preserve independence without breaking shared type identity.
 *
 * This is the core mechanism behind OrcheStore’s identity and cloning system for tree-structured slices.
 *
 * The system guarantees:
 *
 * - Each runtime location has an isolated instance
 * - All instances from the same definition share a lineage
 * - Re-mounting triggers cloning instead of shared mutation
 * - Child nodes are recursively reconciled for consistency
 *
 * Example:
 *
 * ```ts
 * const tree = createStore({
 *   slices: {
 *     a: reusableNode,
 *     b: reusableNode,
 *   },
 * });
 *
 * tree.a !== tree.b;
 * ```
 */
const createNodeFactory = <N, P, E, A, I>(opts: FactoryInput<N, P, E, A, I>): FactoryOutput<N, P, E, A> => {
	const { instantiate, afterInstantiate, options = {} } = opts;

	/** Registry of all active node instances managed by this factory. */
	const instances = new Map<N, NodeMeta<N, E>>();

	/** Registry of lineage families grouping related node clones. */
	const families = new Map<symbol, FamilyMeta<N, P>>();

	/** Creates the root instance of a new lineage. */
	const create: FactoryOutput<N, P, E, A>["create"] = (props) => {
		// Prepare props and initialize ownership and lineage metadata for the root node.
		props = options.prepare ? options.prepare(props) : props;
		const meta = { familyId: Symbol("family"), path: "", children: new Map(), parents: [] } as any;
		const family = { props, siblings: new Set<N>() };

		// Instantiate the node with access to its runtime metadata.
		const instantiatePayload = instantiate(props, meta, family, false);

		// Register the node as the first member of its lineage.
		family.siblings.add(meta.node);
		instances.set(meta.node, meta);
		families.set(meta.familyId, family);

		// Post-instantiation composition and final wiring of the node.
		if (afterInstantiate) afterInstantiate(props, meta, family, false, instantiatePayload);

		return meta.node;
	};

	/** Creates a detached sibling instance within the same lineage. */
	const clone: FactoryOutput<N, P, E, A>["clone"] = (node, errors, payload) => {
		const meta = instances.get(node)!;
		const family = (meta ? families.get(meta.familyId) : undefined)!;
		if (!meta || !family) return void errors?.UnknownNode?.("", node);
		return updateOwnership("", [], meta, family, true, payload!, () => {});
	};

	/** Attaches a node under a parent, cloning it if ownership changes. */
	const attach: FactoryOutput<N, P, E, A>["attach"] = (key, node, parent, parentMetadata, errors) => {
		const meta = instances.get(node)!;
		const family = (meta ? families.get(meta.familyId) : undefined)!;
		if (!meta || !family) return void errors?.UnknownNode?.(key, node);

		// Resolve the parent's ownership metadata.
		const parentMeta = (parentMetadata || instances.get(parent as any)) as NodeMeta<N, E>;
		if (!parentMeta) return void errors?.UnknownParent?.(key, node, parent) as any;

		// Prevent ownership cycles.
		const parents = [parent, ...(parentMeta.parents || [])] as N[];
		if (parents.includes(node)) return void errors?.InfiniteOwnership?.(key, node, parent);

		// Reconcile ownership and attach the resulting node.
		const path = (parentMeta.path ? `${parentMeta.path}.` : "") + key;
		return updateOwnership(path, parents, meta, family, false, undefined!, (clone) => {
			parentMeta.children?.set(key, clone);
		});
	};

	/** Reconciles ownership state and determines whether cloning is required. */
	function updateOwnership(
		...args: [string, N[], NodeMeta<N, E>, FamilyMeta<N, P>, boolean, A, (clone: NodeMeta<N, E>) => void]
	) {
		let [path, parents, meta, family, force, payload, onSetOwnership] = args;
		let instantiation: { executed: boolean; payload: I } = { executed: false, payload: undefined! };
		let props: [P, P] = [] as any;

		force =
			force ||
			// Node already has a parent (it is not free/detached)
			(meta.parents.length > 0 &&
				// Ownership parent has changed
				(meta.parents[0] !== parents[0] ||
					// Position (key) has changed within the same parent
					meta.path.split(".").at(-1) !== path.split(".").at(-1)));

		if (force) {
			// Prepare metadata and props for a new sibling in the same lineage.
			const $meta = { familyId: meta.familyId, path, children: new Map(meta.children), parents } as any;
			props[0] = options.clone ? options.clone(family.props, meta, family, payload) : family.props;
			props[1] = options.currentCloned ? options.currentCloned(props[0]) : props[0];
			meta = $meta;

			// Instantiate a sibling within the same lineage with access to its runtime metadata.
			instantiation.payload = instantiate(props[1], $meta, family, true);
			instantiation.executed = true;

			// Register the sibling in the lineage metadata.
			instances.set(meta.node, $meta);
			family.siblings.add(meta.node);
		}

		// Update ownership metadata for the node's current location.
		meta.path = path;
		meta.parents = parents;
		onSetOwnership?.(meta);

		// Propagate ownership reconciliation through the subtree.
		for (const [key, childMeta] of [...meta.children.entries()]) {
			const childPath = `${path}${path ? "." : ""}${key}`;
			const childFamily = families.get(childMeta.familyId)!;
			const childPayload = options.childCloned && props[0] ? options.childCloned(key, props[0]) : undefined!;

			updateOwnership(childPath, [meta.node, ...parents], childMeta, childFamily, false, childPayload, (clone) => {
				if (clone !== childMeta) meta.children.set(key, clone);
			});
		}

		// Post-instantiation composition and final wiring of the node.
		if (instantiation.executed && afterInstantiate)
			afterInstantiate(props[1], meta, family, true, instantiation.payload);

		return meta;
	}

	return { families, instances, create, attach, clone };
};

export { createNodeFactory };
