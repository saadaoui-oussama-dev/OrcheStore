type NodeMeta<T, E> = E & {
	/** Clone lineage shared by all related nodes. */
	familyId: symbol;

	/** Current location from the root node. */
	path: string;

	/** Ownership chain, nearest owner first. */
	parents: T[];

	/** Directly owned children. */
	children: Map<string, T>;
};

type FamilyMeta<T, P> = {
	/** Default props inherited by clones. */
	props: P;

	/** All nodes belonging to this lineage. */
	siblings: Set<T>;
};

type AttachErrors<T> = {
	/** Invoked when a node is unknown to this factory. */
	UnknownNode?: (key: string, node: any) => void;

	/** Invoked when the specified owner is unknown. */
	UnknownParent?: (key: string, node: T, parent: any) => void;

	/** Invoked when an attachment would introduce recursive ownership. */
	InfiniteOwnership?: <U = T>(key: string, node: T, parent: U) => void;
};

type FactoryOptions<T, P = any, E = {}> = {
	/** Human-readable identifier for debugging, diagnostics, and tooling. */
	factoryName: string;

	/** Creates a node and provides lazy access to its runtime metadata. */
	instantiate: (props: P, getSelfMetadata: () => [T, NodeMeta<T, E>, FamilyMeta<T, P>]) => T;

	options?: {
		/** Transforms user-provided props before node creation and registration. */
		adapt?: (props: P) => P;

		/** Stores the lineage's initial props, later used as the clone baseline. */
		register?: (props: P) => P;

		/** Produces the props used when cloning a family member. */
		clone?: (firstRegisteredProps: P, originMetadata: [T, NodeMeta<T, E>, FamilyMeta<T, P>]) => P;
	};
};

type FactoryOutput<T, P = any, E = {}> = {
	/** Creates the first member of a new lineage. */
	create: (props: P) => T;

	/** Creates a detached sibling in the same lineage. */
	clone: (node: T, errors?: AttachErrors<T>) => T;

	/** Attaches a node under a parent, cloning only when ownership changes. */
	attach: <U = T, F = E>(key: string, node: T, parent: U, parentMeta?: NodeMeta<U, F>, errors?: AttachErrors<T>) => T;
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
	createNodeFactory<T, P, E>(options: FactoryOptions<T, P, E>): FactoryOutput<T, P, E>;
};

export type { NodeMeta, FamilyMeta, FactoryOptions, FactoryOutput, Factory };
