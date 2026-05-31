/** Whether OrcheStore is running in development mode. */
const IS_DEV =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as any).process !== "undefined" &&
  (globalThis as any).process?.env?.NODE_ENV !== "production";

let informed = false;

const log = globalThis.console?.log?.bind?.(globalThis.console) || globalThis.console?.log;
const warn = globalThis.console?.warn?.bind?.(globalThis.console) || globalThis.console?.warn;
const error = globalThis.console?.error?.bind?.(globalThis.console) || globalThis.console?.error;
const clear = globalThis.console?.clear?.bind?.(globalThis.console) || globalThis.console?.clear;

if (globalThis.console?.clear) {
  globalThis.console.clear = (...args: Parameters<typeof globalThis.console.clear>) => {
    informed = false;
    clear?.(...args);
  };
}

const diagnosticsMessage =
  "[OrcheStore] Development diagnostics are enabled.\nWarnings and errors from OrcheStore are not shown in production builds.\nRuntime exceptions that stop code execution may still occur.\nPlease resolve all OrcheStore warnings and errors before deploying to production.\n";

const inform = () => {
  if (informed) return;
  informed = true;
  log?.(diagnosticsMessage);
};

const devConsole = {
  log(...args: any[]): void {
    if (!IS_DEV) return;
    inform();
    log?.(...args);
  },

  warn(...args: any[]): void {
    if (!IS_DEV) return;
    inform();
    warn?.(...args);
  },

  error(...args: any[]): void {
    if (!IS_DEV) return;
    inform();
    error?.(...args);
  },
};

export { devConsole as console };
