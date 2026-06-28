import { defineMethod, defineReadonly } from "../helpers/internal";
import type { FactoryOutput, NodeMeta, NodePrototype } from "../helpers/types";

/**
 * Attaches family inspection and cloning utilities to a node instance.
 *
 * Provides runtime access to clone creation, family traversal, and
 * type comparison across nodes belonging to the same factory family.
 */
export const exposeFamily = <N extends { family: NodePrototype<N, A> }, A extends any[], Args>(
	meta: NodeMeta<N, any, {}>,
	instances: Map<N, NodeMeta<N, any, {}>>,
	clone: FactoryOutput<N, {}, NodeMeta<N, any, {}>, Args>["clone"],
	getArgs?: (...args: A) => Args,
) => {
	const family = {} as N["family"];

	const getAll = () => [...(meta.siblings.values() || [])];

	defineReadonly(family, "name", () => {
		return meta.family;
	});

	defineMethod(family, "clone", (...args) => {
		return clone(meta.node, undefined, getArgs?.(...args))!.node;
	});

	defineMethod(family, "getAll", () => {
		return getAll();
	});

	defineMethod(family, "getClones", () => {
		return getAll().filter((it) => it !== meta.node);
	});

	defineMethod(family, "isTypeOf", ((other: any) => {
		return meta.siblings === instances.get(other)?.siblings;
	}) as any);

	defineReadonly(meta.node, "family", () => family);
};
