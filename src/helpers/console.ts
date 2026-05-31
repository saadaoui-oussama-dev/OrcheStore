/** Whether OrcheStore is running in development mode. */
const IS_DEV =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as any).process !== "undefined" &&
  (globalThis as any).process?.env?.NODE_ENV !== "production";

let informed = false;

const logMethod = globalThis.console?.log?.bind(globalThis.console);
const warnMethod = globalThis.console?.warn?.bind(globalThis.console);
const errorMethod = globalThis.console?.error?.bind(globalThis.console);
const clearMethod = globalThis.console?.clear?.bind(globalThis.console);

if (globalThis.console?.clear) {
  globalThis.console.clear = (...args: Parameters<typeof globalThis.console.clear>) => {
    informed = false;
    clearMethod?.(...args);
  };
}

const diagnosticsMessage =
  "[OrcheStore] Development diagnostics are enabled. Warnings and errors from OrcheStore are not shown in production builds.\nRuntime exceptions that stop code execution may still occur.\nPlease resolve all OrcheStore warnings and errors before deploying to production.\n";

const inform = () => {
  if (informed) return;
  informed = true;
  logMethod?.(diagnosticsMessage);
};

export const console = {
  log(...args: any[]): void {
    if (!IS_DEV) return;
    inform();
    logMethod?.(...args);
  },

  warn(...args: any[]): void {
    if (!IS_DEV) return;
    inform();
    warnMethod?.(...args);
  },

  error(...args: any[]): void {
    if (!IS_DEV) return;
    inform();
    errorMethod?.(...args);
  },
};
