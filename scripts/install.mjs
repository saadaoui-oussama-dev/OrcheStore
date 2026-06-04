import { execSync } from "node:child_process";
import { resolve } from "node:path";

// Install dependencies in current directory
console.log("Installing dependencies in project...");
execSync("npm install", { stdio: "inherit" });
console.log("Project dependencies installed.");

// Uninstall old package
const testDir = resolve("./test");
console.log(`Uninstalling old orchestore package from ${testDir}`);
execSync(`npm uninstall orchestore`, { cwd: testDir, stdio: "inherit" });

// Install dependencies in ./test
console.log(`Installing dependencies in ${testDir}...`);
execSync("npm install", { cwd: testDir, stdio: "inherit" });
console.log("Test dependencies installed.");
