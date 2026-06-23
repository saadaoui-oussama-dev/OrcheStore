type NodeMeta<N, E> = E & {
	/** Node associated with this metadata. */
	node: N;

	/** Clone lineage shared by all related nodes. */
	familyId: symbol;

	/** Current location from the root node. */
	path: string;

	/** Ownership chain, nearest owner first. */
	parents: N[];

	/** Directly owned children. */
	children: Map<string, N>;
};

type FamilyMeta<N, P> = {
	/** Default props inherited by clones. */
	props: P;

	/** All nodes belonging to this lineage. */
	siblings: Set<N>;
};

type FactoryErrors<N> = {
	/** Invoked when a node is unknown to this factory. */
	UnknownNode?: (key: string, node: any) => void;

	/** Invoked when the specified owner is unknown. */
	UnknownParent?: (key: string, node: N, parent: any) => void;

	/** Invoked when an attachment would introduce recursive ownership. */
	InfiniteOwnership?: <U = N>(key: string, node: N, parent: U) => void;
};

type FactoryOptions<N, P = any, E = {}, A = undefined, I = {}> = {
	/** Creates a node and provides access to its runtime metadata during initialization. */
	instantiate: (props: P, metadata: NodeMeta<N, E>, family: FamilyMeta<N, P>, cloning: boolean) => I & { node: N };

	/** Finalizes node setup after instantiation and applies composition or wiring logic. */
	afterInstantiate?: (node: N, metadata: NodeMeta<N, E>, family: FamilyMeta<N, P>, cloning: boolean, payload: I) => N;

	options?: {
		/** Transforms user-provided props before node creation and registration. */
		adapt?: (props: P) => P;

		/** Stores the lineage's initial props, later used as the clone baseline. */
		register?: (props: P) => P;

		/** Produces the props used when creating a cloned sibling. */
		clone?: (firstRegisteredProps: P, originMetadata: NodeMeta<N, E>, family: FamilyMeta<N, P>, payload?: A) => P;

		/** Refines cloned props into the portion owned by the node being instantiated. */
		resolve?: (props: P) => P;

		/** Extracts the payload used to clone child nodes from the parent's cloned props. */
		childPayload?: (key: string, props: P) => A;
	};
};

type FactoryOutput<N, P = any, E = {}, A = undefined> = {
	/** Registry of clone lineages. */
	families: Map<symbol, FamilyMeta<N, P>>;

	/** Runtime metadata for all nodes managed by this factory. */
	instances: Map<N, NodeMeta<N, E>>;

	/** Creates the first member of a new lineage. */
	create: (props: P) => N;

	/** Creates a detached sibling in the same lineage. */
	clone: (node: N, errors?: FactoryErrors<N>, payload?: A) => N | undefined;

	/** Attaches a node under a parent, cloning only when ownership changes. */
	attach: <U = N, F = E>(key: string, node: N, parent: U, parentMeta?: NodeMeta<U, F>, errors?: FactoryErrors<N>) => N;
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
	createNodeFactory<N, P = any, E = {}, A = undefined, I = {}>(
		options: FactoryOptions<N, P, E, A, I>,
	): FactoryOutput<N, P, E, A>;
};

export type { Factory, FactoryOptions, FactoryOutput, FactoryErrors, NodeMeta, FamilyMeta };
