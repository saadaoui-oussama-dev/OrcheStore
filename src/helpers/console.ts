type DiagnosticsLevel = "off" | "errors" | "all";

let diagnosticsLevel: DiagnosticsLevel = "all";
let informed = {diagnostics: false, prerelease: false};

const log = globalThis.console?.log?.bind?.(globalThis.console) || globalThis.console?.log;
const warn = globalThis.console?.warn?.bind?.(globalThis.console) || globalThis.console?.warn;
const error = globalThis.console?.error?.bind?.(globalThis.console) || globalThis.console?.error;
const clear = globalThis.console?.clear?.bind?.(globalThis.console) || globalThis.console?.clear;

if (globalThis.console?.clear) {
  globalThis.console.clear = (...args: Parameters<typeof globalThis.console.clear>) => {
    informed.diagnostics = false;
    clear?.(...args);
  };
}

const prereleaseMessage =
  "[OrcheStore] 🚧 Pre-release Notice\n" +
  "Thank you for your interest in OrcheStore.\n" +
  "OrcheStore is currently under active development and is not yet ready for production use.\n" +
  "APIs, behavior, and internal implementation details may change without notice.\n" +
  "The first stable release is currently planned for 2026-06-15.\n" +
  "Stay tuned for updates!\n";

const diagnosticsMessage =
  "[OrcheStore] Diagnostics are enabled.\n" +
  "OrcheStore may emit warnings and errors to help identify incorrect usage, invalid configurations, and potential runtime issues.\n" +
  "Runtime exceptions that stop code execution may still occur regardless of diagnostics settings.\n" +
  "Please resolve all OrcheStore warnings and errors before deploying to production.\n" +
  'Diagnostics can be configured with configureDiagnostics("off" | "errors" | "all").\n';

const devConsole = {
  inform(type: "diagnostics" | "prerelease") {
    if (informed[type]) return;
    informed[type] = true;
    if (diagnosticsLevel !== "all") return;
    log?.(type === "prerelease" ? prereleaseMessage : diagnosticsMessage);
  },

  warn(...args: any[]) {
    if (diagnosticsLevel !== "all") return;
    devConsole.inform("diagnostics");
    warn?.(...args);
  },

  error(...args: any[]) {
    if (diagnosticsLevel === "off") return;
    devConsole.inform("diagnostics");
    error?.(...args);
  },
};

/**
 * Configures OrcheStore diagnostics output.
 *
 * Levels:
 * - "off" - disables all output
 * - "errors" - shows errors only
 * - "all" - shows logs, warnings, and errors
 */
function configureDiagnostics(level: DiagnosticsLevel) {
  diagnosticsLevel = level;
}

export { devConsole as console, configureDiagnostics };
