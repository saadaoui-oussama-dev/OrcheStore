import { MESSAGES } from "../helpers/messages";
import { validateKey } from "../helpers/internal";
import type { FactoryOutput, NodeMeta } from "../helpers/types";

type Callbacks<N, P, E> = { attach: FactoryOutput<N, any, E>["attach"]; respone: (child: NodeMeta<N, P, E>) => any };

/**
 * Creates a helper that validates, attaches, and exposes child nodes.
 *
 * During normal execution, child definitions are validated, attached, and
 * transformed into caller-defined results. During cloning, previously attached
 * child nodes are reused instead of being attached again.
 */
export const createAttachHelper = <N, P, E>(trigger: string, type: string, layer: string, callbacks: Callbacks<N, P, E>) => {
	return (name: string, meta: NodeMeta<N, P, E>, afterCloning: boolean, children: any, reserved: string[]) => {
		// Expose children and collect caller-defined results
		const expose = (key: string, child: NodeMeta<N, P, E>) => {
			(meta.node as any)[key] = child.node;
			reserved.push(key);
			return [key, callbacks.respone(child)] as const;
		};

		// Reattach existing child nodes when restoring a cloned subtree
		if (afterCloning) return [...meta.children.entries()].map(([key, child]) => expose(key, child));

		// Attach child nodes and collect caller-defined results
		const reducers = Object.entries(children).map(([k, item]) => {
			const key = validateKey(trigger, name, type, layer, k, reserved)!;

			const child = key
				? callbacks.attach(key, item as any, meta, {
						UnknownNode: () => MESSAGES(trigger, name, type).InvalidChild(key, item),
						InfiniteOwnership: (key) => MESSAGES(trigger, name, type).InfiniteOwnership(key),
					})
				: undefined;

			if (!child) return void delete children[key];
			return expose(key, child);
		});

		return reducers.filter((reducer) => reducer) as [string, any][];
	};
};
