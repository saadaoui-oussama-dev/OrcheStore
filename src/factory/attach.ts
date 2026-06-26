import { MESSAGES } from "../helpers/messages";
import { validateKey } from "../helpers/internal";
import type { FactoryOutput, NodeMeta } from "../helpers/types";

type Callbacks<N, E> = { attach: FactoryOutput<N, any, E>["attach"]; respone: (child: NodeMeta<N, E>) => any };

/**
 * Creates a helper that validates, attaches, and exposes child nodes.
 *
 * During normal execution, child definitions are validated, attached, and
 * transformed into caller-defined results. During cloning, previously attached
 * child nodes are reused instead of being attached again.
 */
export const createAttachHelper = <N, E>(trigger: string, layer: string, { attach, respone }: Callbacks<N, E>) => {
	return (name: string, meta: NodeMeta<N, E>, afterCloning: boolean, children: any, reserved: string[]) => {
		// Expose children and collect caller-defined results
		const expose = (key: string, child: NodeMeta<N, E>) => {
			(meta.node as any)[key] = child.node;
			reserved.push(key);
			return [key, respone(child)] as const;
		};

		// Reattach existing child nodes when restoring a cloned subtree
		if (afterCloning) return [...meta.children.entries()].map(([key, child]) => expose(key, child));

		// Attach child nodes and collect caller-defined results
		const reducers = Object.entries(children).map(([k, item]) => {
			const key = validateKey(trigger, layer, k, reserved, name)!;

			const child = key
				? attach(key, item as any, meta.node, meta, {
						UnknownNode: () => MESSAGES(trigger, name).InvalidChild(key, item),
						InfiniteOwnership: (key) => MESSAGES(trigger, name).InfiniteOwnership(key),
					})
				: undefined;

			if (!child) return void delete children[key];
			return expose(key, child);
		});

		return reducers.filter((reducer) => reducer) as [string, any][];
	};
};
