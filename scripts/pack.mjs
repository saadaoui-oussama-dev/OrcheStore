import { execSync } from "node:child_process";
import { mkdirSync, renameSync } from "node:fs";
import { resolve } from "node:path";

// Create package
const file = execSync("npm pack", { encoding: "utf8" }).trim();
console.log(`Created ${file}`);

// Move to packed/
mkdirSync("packaged", { recursive: true });
const packFile = resolve("packaged", file);
renameSync(file, packFile);
console.log(`Moved to packaged/${file}`);

// Uninstall old package
const testDir = resolve("../test");
execSync(`npm uninstall orchestore`, { cwd: testDir, stdio: "inherit" });
console.log(`Uninstalled old orchestore package from ${testDir}`);

// Install into ../test
execSync(`npm install "${packFile}"`, { cwd: testDir, stdio: "inherit" });
console.log(`Installed ${file} into ${testDir}`);
