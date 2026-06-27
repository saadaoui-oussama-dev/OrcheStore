import { defineMethod, defineReadonly } from "../helpers/internal";
import type { FactoryOutput, NodeMeta, NodePrototype } from "../helpers/types";

/**
 * Attaches lineage inspection and cloning utilities to a node instance.
 *
 * Provides runtime access to clone creation, lineage traversal, and
 * type comparison across nodes belonging to the same factory family.
 */
export const exposeLineage = <N extends { prototype: NodePrototype<N, A> }, A extends any[], Args>(
	meta: NodeMeta<N, {}>,
	instances: Map<N, NodeMeta<N, {}>>,
	clone: FactoryOutput<N, {}, NodeMeta<N, {}>, Args>["clone"],
	getArgs?: (...args: A) => Args,
) => {
	const prototype = {} as N["prototype"];

	const getLineage = () => [...(meta.family.siblings.values() || [])];

	defineReadonly(prototype, "name", () => {
		return meta.family.name;
	});

	defineMethod(prototype, "clone", (...args) => {
		return clone(meta.node, undefined, getArgs?.(...args))!.node;
	});

	defineMethod(prototype, "getLineage", () => {
		return getLineage();
	});

	defineMethod(prototype, "getClones", () => {
		return getLineage().filter((it) => it !== meta.node);
	});

	defineMethod(prototype, "isTypeOf", ((other: any) => {
		return meta.family === instances.get(other)?.family;
	}) as any);

	defineReadonly(meta.node, "prototype", () => prototype);
};
