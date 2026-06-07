interface TypeChecker {
  <T = any>(value: T): any[];
  <T = any>(value: T, validate: (value: T) => boolean): any[] | undefined;
  prefixed: {
    <T = any>(prefix: string, type: boolean, value: T): any[];
    <T = any>(
      prefix: string,
      type: boolean,
      value: T,
      validate: (value: T) => boolean,
    ): any[] | undefined;
  };
}

const checker = (...args: Parameters<TypeChecker["prefixed"]>) => {
  const [value, validate] = [args[2], args[3]];
  const prefix = `${args[0] || "Received"}: `;
  const type = args[1] !== false ? "(type: " + typeof value + ")" : "";
  if (validate?.(value)) return;
  if (value === undefined || typeof value === "object") return [prefix, value];
  if (value === "") return [`${prefix}Empty String`];
  return [`${prefix}${type}`, value];
};

export const typeChecker = (<T>(value: T, validate?: (value: T) => boolean) => {
  return checker("Received: ", true, value, validate as any);
}) as TypeChecker;

typeChecker.prefixed = <T>(
  prefix: string,
  type: boolean,
  value: T,
  validate?: (value: T) => boolean,
) => {
  return checker(prefix, type, value, validate as any) as any;
};
