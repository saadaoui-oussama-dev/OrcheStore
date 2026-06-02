let log = 0;

export function normalizeState(state: any, slice: string) {
  const normalizedState = {} as any;

  const slices = Object.keys(state)
    .filter((key) => key.startsWith(slice))
    .map((key) => key.split("."))
    .sort((a, b) => a.length - b.length);

 const   logging = log ++ < 2;

  slices.forEach((key) => {
    let parent = normalizedState;
    key.slice(0, key.length - 1).forEach((part) => parent = (parent[part] ||= {}));
    if (logging) console.log(key, {target: parent, key: key[key.length - 1], part: state[key.join(".")]})
    parent[key[key.length - 1]] = state[key.join(".")];
    if (logging) console.log(key, parent, parent);
  });

  console.log("Normalized state of " + (slice ? slice : "root") + ":", normalizedState);

  return normalizedState;
}

export function extractSliceState(state: any, slice: string) {
  slice.split(".").forEach((part) => state = state[part]);
  return state;
}
