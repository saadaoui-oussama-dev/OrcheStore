export const nestingSeparator = ".";

export function normalizeState(state: any, slice?: string) {
	const normalizedState = { children: {} } as any;

	const slices = Object.keys(state)
		.filter((key) => key.startsWith(slice || ""))
		.map((key) => key.split(nestingSeparator))
		.sort((a, b) => a.length - b.length);

	slices.forEach((key) => {
		let parent = normalizedState;
		key.slice(0, key.length - 1).forEach((part) => (parent = parent[part] ||= {}));
		parent.children ||= {};
		parent.children[key[key.length - 1]] = { ...state[key.join(nestingSeparator)] };
	});

	return normalizedState.children;
}

export function extractSliceState(state: any, slice: string) {
	slice.split(nestingSeparator).forEach((part) => (state = state[part]));
	return state;
}
