import { execSync } from "node:child_process";
import { resolve } from "node:path";

const testDir = resolve("./test");
execSync(`npm start`, { cwd: testDir, stdio: "inherit" });
