type NodeMeta<T> = {
	/** Clone lineage shared by all related nodes. */
	familyId: symbol;

	/** Current location from the root node. */
	path: string;

	/** Ownership chain, nearest owner first. */
	parents: T[];

	/** Directly owned children. */
	children: Map<string, T>;
};

type FamilyMeta<T, C> = {
	/** Default props inherited by clones. */
	props: C;

	/** All nodes belonging to this lineage. */
	siblings: Set<T>;
};

type FactoryOptions<T, C> = {
	/** Human-readable identifier for debugging, diagnostics, and tooling. */
	factoryName: string;

	/** Creates a node and provides lazy access to its runtime metadata. */
	instantiate: (props: C, getSelfMetadata: () => [T, NodeMeta<T>, FamilyMeta<T, C>]) => T;

	options?: {
		/** Transforms user-provided props before node creation and registration. */
		adapt?: (props: C) => C;

		/** Stores the lineage's initial props, later used as the clone baseline. */
		register?: (props: C) => C;

		/** Produces the props used when cloning a family member. */
		clone?: (firstRegisteredProps: C, origin: T) => C;
	};
};

type FactoryOutput<T, C> = {
	/** Creates the first member of a new lineage. */
	create: (props: C) => T;

	/** Creates a detached sibling in the same lineage. */
	clone: (node: T) => T;

	/** Attaches a node under a parent, cloning only when ownership changes. */
	attach: <P = T>(key: string, node: T, parent: P, parentMeta?: NodeMeta<P>) => T;
};

type Factory = {
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
	createNodeFactory<T, C>(options: FactoryOptions<T, C>): FactoryOutput<T, C>;
};

export type { NodeMeta, FamilyMeta, FactoryOptions, FactoryOutput, Factory };
