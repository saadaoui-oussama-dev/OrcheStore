import { Dict } from "../../types/helpers";

/** Validation reporting behavior. */
type ErrorMode = "" | "error" | "warn";

/** Context information used for validation and member exposure. */
type ExposeContext = { module: string; type: string; slice?: string };

/** Transforms a layer member before it is exposed. */
type ExposeAdapter = <K extends string>(key: K, item: any) => any;

/** Global validation messages. */
const messages = {
  target: ({ slice }: ExposeContext) => (slice ? ` Affected slice '${slice}':\n` : " "), // prettier-ignore
  RequiredName: (ctx: ExposeContext) => `[OrcheStore::${ctx.module}]${messages.target(ctx)}${ctx.type} keys must be non-empty strings.`, // prettier-ignore
  InvalidName: (ctx: ExposeContext, key: string) => `[OrcheStore::${ctx.module}]${messages.target(ctx)}${ctx.type} names cannot contain '.' or '/'. Received: ${key}.`, // prettier-ignore
  ReservedKey: (ctx: ExposeContext, key: string) => `[OrcheStore::${ctx.module}]${messages.target(ctx)}'${key}' is a reserved name and cannot be used as a ${ctx.type} key.`, // prettier-ignore
  DuplicateKey: (ctx: ExposeContext, key: string) => `[OrcheStore::${ctx.module}]${messages.target(ctx)}${ctx.type} name '${key}' conflicts with another member.`, // prettier-ignore
};

/** Reports a validation message by throwing, logging, or warning. */
const report = (message: string, mode?: ErrorMode) => {
  if (!message) return false;
  else if (mode === "warn") console.warn(message);
  else if (mode === "error") console.error(message);
  else throw new Error(message);
};

/** Validates that a key is a non-empty string without "." or "/". */
export const validateKey = (key: unknown, req = "", spec = "", opt?: [ErrorMode, ErrorMode]): key is string => {
  if (typeof key !== "string" || !key) return !!report(req, opt?.[0]);
  if (key.includes(".") || key.includes("/")) return !!report(spec, opt?.[1]);
  return true;
};

/** Validates a layer key before exposing its member. */
const validateLayerKey = (context: ExposeContext, key: string, reserved: string[][]) => {
  const [RequiredName, InvalidName] = [messages.RequiredName(context), messages.InvalidName(context, key)];
  if (!validateKey(key, RequiredName, InvalidName, ["error", "error"])) return;
  else if (reserved[0].includes(key)) return console.error(messages.ReservedKey(context, key));
  else if (reserved[1].includes(key)) return console.error(messages.DuplicateKey(context, key));
  return true;
};

/** Validates, adapts, and exposes layer members. */
export const exposeLayer = (context: ExposeContext, layer: Dict, reserved: string[][], adapter: ExposeAdapter) => {
  Object.entries(layer).forEach(([key, item]) => {
    const newValue = validateLayerKey(context, key, reserved) ? adapter(key, item) : undefined;
    if (newValue === undefined) return delete layer[key];
    (layer as any)[key] = newValue;
    reserved[1].push(key);
  });
  return layer;
};
