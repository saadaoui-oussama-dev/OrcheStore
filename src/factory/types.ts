/**
 * Shared lineage state for all nodes derived from the same definition.
 */
type FamilyMeta<N, P> = {
	/** Baseline props used as the source for cloning. */
	props: P;

	/** All active nodes belonging to this lineage. */
	siblings: Set<N>;
};

/**
 * Runtime metadata describing a single node instance within a factory graph.
 *
 * Nodes are always part of a lineage and maintain structural relationships
 * to their parent chain and children.
 */
type NodeMeta<N, E> = E & {
	/** The runtime node instance associated with this metadata. */
	node: N;

	/** Identifier shared across all nodes in the same lineage. */
	familyId: symbol;

	/** Absolute path from the root of the ownership tree. */
	path: string;

	/** Ownership chain from closest parent to root. */
	parents: N[];

	/** Direct child nodes indexed by key. */
	children: Map<string, NodeMeta<N, E>>;
};

/**
 * Optional error handlers triggered during lifecycle validation.
 */
type FactoryErrors<N> = {
	/** Triggered when a node is not registered in the factory. */
	UnknownNode?: (key: string, node: any) => void;

	/** Triggered when a parent node cannot be resolved. */
	UnknownParent?: (key: string, node: N, parent: any) => void;

	/** Triggered when an ownership cycle is detected. */
	InfiniteOwnership?: <U = N>(key: string, node: N, parent: U) => void;
};

/**
 * Defines how nodes are created, cloned, and composed within a factory system.
 */
type FactoryInput<N, P = any, E = {}, A = undefined, I = {}> = {
	/** Instantiates a node and binds it to runtime metadata. */
	instantiate: (props: P, meta: NodeMeta<N, E>, family: FamilyMeta<N, P>, cloning: boolean) => I;

	/** Finalizes node setup after instantiation and handles composition logic. */
	afterInstantiate?: (props: P, meta: NodeMeta<N, E>, family: FamilyMeta<N, P>, cloning: boolean, payload: I) => void;

	options?: {
		/** Prepares and normalizes props before instantiation. */
		prepare?: (props: P) => P;

		/** Builds clone base props from the original lineage state props. */
		clone?: (firstRegisteredProps: P, originMeta: NodeMeta<N, E>, family: FamilyMeta<N, P>, payload?: A) => P;

		/** Reduces cloned props into the subset owned by the current node. */
		currentCloned?: (props: P) => P;

		/** Extracts payload passed down to child nodes during cloning. */
		childCloned?: (key: string, props: P) => A;
	};
};

/**
 * Runtime interface exposed by a node factory.
 *
 * Provides creation, cloning, attachment, and lineage introspection.
 */
type FactoryOutput<N, P = any, E = {}, A = undefined> = {
	/** All node instances currently managed by the factory. */
	instances: Map<N, NodeMeta<N, E>>;

	/** All active lineage groups managed by the factory. */
	families: Map<symbol, FamilyMeta<N, P>>;

	/** Creates the root instance of a new lineage. */
	create: (props: P) => N;

	/** Creates a detached sibling instance within an existing lineage. */
	clone: (node: N, errors?: FactoryErrors<N>, payload?: A) => undefined | NodeMeta<N, E>;

	/** Attaches a node under a parent, cloning it if ownership changes. */
	attach: <U = N, F = E>(
		key: string,
		node: N,
		parent: U,
		parentMeta?: NodeMeta<U, F>,
		errors?: FactoryErrors<N>,
	) => undefined | NodeMeta<N, E>;
};

type NodePrototype<N, A extends any[] = []> = {
	/**
	 * Creates a new detached instance within the same lineage.
	 *
	 * The cloned instance is fully independent at runtime, but still
	 * linked to the original definition family.
	 */
	readonly clone: (...args: A) => N;

	/**
	 * Returns all instances that belong to the same lineage family,
	 * including the current instance.
	 */
	readonly getLineage: () => N[];

	/**
	 * Returns all other instances in the same lineage,
	 * excluding the current instance.
	 */
	readonly getClones: () => N[];

	/**
	 * Checks whether another instance belongs to the same lineage.
	 *
	 * Useful for verifying whether two slices originate from the same definition,
	 * even if they are different runtime instances.
	 */
	readonly isTypeOf: (other?: any) => other is N;
};

export type { FactoryInput, FactoryOutput, FamilyMeta, NodeMeta, NodePrototype };
