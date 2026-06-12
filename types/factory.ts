type NodeMeta<T extends object> = {
	/** Clone lineage shared by all related nodes. */
	familyId: symbol;

	/** Current location from the root node. */
	path: string;

	/** Ownership chain, nearest owner first. */
	parents: T[];

	/** Directly owned children. */
	children: Map<string, T>;
};

/** Tracks all nodes that originated from the same lineage. */
type FamilyMeta<T extends object, C> = {
	/** Default config inherited by clones. */
	config: C;

	/** All nodes belonging to this lineage. */
	siblings: Set<T>;
};

type FactoryOptions<T extends object, C> = {
	/** Creates a node and provides lazy access to its runtime metadata. */
	instantiate: (config: C, getSelfMetadata: () => [T, NodeMeta<T>, FamilyMeta<T, C>]) => T;

	/** Produces the config used when cloning a family member. */
	getConfig?: (origin: T, config: C) => C;
};

type FactoryOutput<C, T> = {
	/** Creates the first member of a new lineage. */
	create: (config: C) => T;

	/** Creates a detached sibling in the same lineage. */
	clone: (node: T) => T;

	/** Attaches a node under a parent, cloning only when ownership changes. */
	attach: (key: string, node: T, parent: T, parentChildren?: Map<string, T>) => T;
};

type NodeFactory = {
	/**
	 * Creates nodes that enforce single ownership.
	 *
	 * The same node instance cannot exist in multiple places in the ownership tree.
	 * When ownership changes, a sibling clone from the same lineage is created
	 * automatically so each location gets its own instance.
	 *
	 * Example:
	 *
	 * const store = createStore({
	 *   slices: {
	 *     products: fullCRUDSlice,
	 *     categories: fullCRUDSlice,
	 *   }
	 * });
	 *
	 * Although both properties originate from the same factory output,
	 * ownership reconciliation ensures:
	 *
	 * store.products !== store.categories
	 *
	 * while both nodes still belong to the same clone lineage.
	 */
	createNodeFactory<T extends object, C>(options: FactoryOptions<T, C>): FactoryOutput<C, T>;
};

export type { NodeMeta, FamilyMeta, FactoryOptions, FactoryOutput, NodeFactory };
