/**
 * Runtime metadata describing a single node instance within a factory graph.
 *
 * Nodes are always part of a family and maintain structural relationships
 * to their parent chain and children.
 */
type NodeMeta<N, P, E> = E & {
	/** Original name inherited from the first node created in this family. */
	family: string;

	/** The runtime node instance associated with this metadata. */
	node: N;

	/** Absolute path from the root of the ownership tree. */
	path: string;

	/** Ownership chain from closest parent to root. */
	parents: NodeMeta<N, P, E>[];

	/** Direct child nodes indexed by key. */
	children: Map<string, NodeMeta<N, P, E>>;

	/** All active nodes belonging to this family. */
	siblings: Set<N>;

	/** Cached props used as the source for cloning. */
	props: P;
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
	instantiate: (props: P, meta: NodeMeta<N, P, E>, cloning: boolean) => I;

	/** Finalizes node setup after instantiation and handles composition logic. */
	afterInstantiate?: (props: P, meta: NodeMeta<N, P, E>, cloning: boolean, payload: I) => void;

	options?: {
		/** Prepares and normalizes props before instantiation. */
		prepare?: (props: P) => P;

		/** Builds clone base props from the original family state props. */
		clone?: (firstRegisteredProps: P, originMeta: NodeMeta<N, P, E>, payload?: A) => P;

		/** Reduces cloned props into the subset owned by the current node. */
		currentCloned?: (props: P) => P;

		/** Extracts payload passed down to child nodes during cloning. */
		childCloned?: (key: string, props: P) => A;
	};
};

/**
 * Runtime interface exposed by a node factory.
 *
 * Provides creation, cloning, attachment, and family introspection.
 */
type FactoryOutput<N, P = any, E = {}, A = undefined> = {
	/** All node instances currently managed by the factory. */
	instances: Map<N, NodeMeta<N, P, E>>;

	/** Creates the root instance of a new family. */
	create: (props: P) => N;

	/** Creates a detached sibling instance within an existing family. */
	clone: (node: N, errors?: FactoryErrors<N>, payload?: A) => undefined | NodeMeta<N, P, E>;

	/** Attaches a node under a parent, cloning it if ownership changes. */
	attach: (key: string, node: N, parent: NodeMeta<N, P, E>, errors?: FactoryErrors<N>) => undefined | NodeMeta<N, P, E>;
};

type NodePrototype<N, A extends any[] = []> = {
	/** Original name inherited from the first node created in this family. */
	readonly name: string;

	/**
	 * Creates a new detached instance within the same family.
	 *
	 * The cloned instance is fully independent at runtime, but still
	 * linked to the original definition family.
	 */
	readonly clone: (...args: A) => N;

	/**
	 * Returns all instances that belong to the same family family,
	 * including the current instance.
	 */
	readonly getAll: () => N[];

	/**
	 * Returns all other instances in the same family,
	 * excluding the current instance.
	 */
	readonly getClones: () => N[];

	/**
	 * Checks whether another instance belongs to the same family.
	 *
	 * Useful for verifying whether two slices originate from the same definition,
	 * even if they are different runtime instances.
	 */
	readonly isTypeOf: (other?: any) => other is N;
};

export type { FactoryInput, FactoryOutput, NodeMeta, NodePrototype };
