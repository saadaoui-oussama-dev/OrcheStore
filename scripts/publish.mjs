import { execSync } from "node:child_process";
import { mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";

// Create package
const file = execSync("npm pack", { encoding: "utf8" }).trim();
console.log(`Created ${file}`);

// Move to packaged/
mkdirSync("packaged", { recursive: true });
const packFile = resolve("packaged", file);
renameSync(file, packFile);
console.log(`Moved to packaged/${file}`);

// Uninstall old package
const testDir = resolve("./test");
console.log(`Uninstalling old orchestore package from ${testDir}`);
execSync("npm uninstall orchestore", { cwd: testDir, stdio: "inherit" });

// Install into ./test
console.log(`Installing ${file} into ${testDir}`);
execSync(`npm install "${packFile}"`, { cwd: testDir, stdio: "inherit" });
console.log(`Installed ${file} into ${testDir}`);

// Publish to npm
console.log("Publishing package to npm...");
execSync("npm publish", { stdio: "inherit" });
console.log("Package published successfully.");

// Start
execSync(`npm start`, { cwd: testDir, stdio: "inherit" });
