import type { FactoryInput, FactoryOutput, FamilyMeta, NodeMeta } from "../helpers/types"; // prettier-ignore

/**
 * Creates a hierarchical node factory with family-based ownership reconciliation.
 *
 * It manages nodes that can be mounted in multiple places in a hierarchy while ensuring each runtime location
 * receives its own isolated instance. When a node is reused under a different parent or path, it is cloned within
 * the same family to preserve independence without breaking shared type identity.
 *
 * This is the core mechanism behind OrcheStore’s identity and cloning system for tree-structured slices.
 *
 * The system guarantees:
 *
 * - Each runtime location has an isolated instance
 * - All instances from the same definition share a family
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

	/** Registry of family families grouping related node clones. */
	const families = new Map<symbol, FamilyMeta<N, P>>();

	/** Creates the root instance of a new family. */
	const create: FactoryOutput<N, P, E, A>["create"] = (props) => {
		// Prepare props and initialize ownership and family metadata for the root node.
		props = options.prepare ? options.prepare(props) : props;
		const family = { name: (props as any).name, props, siblings: new Set<N>() };
		const meta = { path: "", family, children: new Map(), parents: [] } as any;

		// Instantiate the node with access to its runtime metadata.
		const instantiatePayload = instantiate(props, meta, false);

		// Register the node as the first member of its family.
		family.siblings.add(meta.node);
		instances.set(meta.node, meta);
		families.set(meta.familyId, family);

		// Post-instantiation composition and final wiring of the node.
		if (afterInstantiate) afterInstantiate(props, meta, false, instantiatePayload);

		return meta.node;
	};

	/** Creates a detached sibling instance within the same family. */
	const clone: FactoryOutput<N, P, E, A>["clone"] = (node, errors, payload) => {
		const meta = instances.get(node)!;
		if (!meta) return void errors?.UnknownNode?.("", node);
		return updateOwnership("", [], meta, true, payload!, () => {});
	};

	/** Attaches a node under a parent, cloning it if ownership changes. */
	const attach: FactoryOutput<N, P, E, A>["attach"] = (key, node, parentMeta, errors) => {
		const meta = instances.get(node)!;
		if (!meta) return void errors?.UnknownNode?.(key, node);

		// Prevent ownership cycles.
		const parents = [parentMeta, ...(parentMeta.parents || [])];
		if (parents.includes(meta)) return void errors?.InfiniteOwnership?.(key, node, parentMeta?.node);

		// Reconcile ownership and attach the resulting node.
		const path = (parentMeta.path ? `${parentMeta.path}.` : "") + key;
		return updateOwnership(path, parents, meta, false, undefined!, (clone) => {
			parentMeta.children?.set(key, clone);
		});
	};

	/** Reconciles ownership state and determines whether cloning is required. */
	function updateOwnership(
		...args: [string, NodeMeta<N, E>[], NodeMeta<N, E>, boolean, A, (clone: NodeMeta<N, E>) => void]
	) {
		let [path, parents, meta, force, payload, onSetOwnership] = args;
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
			// Prepare metadata and props for a new sibling in the same family.
			const $meta = { family: meta.family, path, children: new Map(meta.children), parents } as any;
			props[0] = options.clone ? options.clone(meta.family.props, meta, payload) : meta.family.props;
			props[1] = options.currentCloned ? options.currentCloned(props[0]) : props[0];
			meta = $meta;

			// Instantiate a sibling within the same family with access to its runtime metadata.
			instantiation.payload = instantiate(props[1], $meta, true);
			instantiation.executed = true;

			// Register the sibling in the family metadata.
			instances.set(meta.node, $meta);
			meta.family.siblings.add(meta.node);
		}

		// Update ownership metadata for the node's current location.
		meta.path = path;
		meta.parents = parents;
		onSetOwnership?.(meta);

		// Propagate ownership reconciliation through the subtree.
		for (const [key, childMeta] of [...meta.children.entries()]) {
			const childPath = `${path}${path ? "." : ""}${key}`;
			const childPayload = options.childCloned && props[0] ? options.childCloned(key, props[0]) : undefined!;

			updateOwnership(childPath, [meta, ...parents], childMeta, false, childPayload, (clone) => {
				if (clone !== childMeta) meta.children.set(key, clone);
			});
		}

		// Post-instantiation composition and final wiring of the node.
		if (instantiation.executed && afterInstantiate) afterInstantiate(props[1], meta, true, instantiation.payload);

		return meta;
	}

	return { families, instances, create, attach, clone };
};

export { createNodeFactory };
