#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const huskyDir = ".husky";

if (!fs.existsSync(huskyDir)) {
  console.log("❌ No .husky directory found.");
  process.exit(1);
}

console.log("🔧 Ensuring Husky hooks are executable...");

const files = fs.readdirSync(huskyDir)
  .filter((f) => !f.startsWith("_"))
  .map((f) => path.join(huskyDir, f));

for (const file of files) {
  if (fs.statSync(file).isFile()) {
    execSync(`git update-index --add --chmod=+x ${file}`);
    console.log(`✅ Marked executable: ${file}`);
  }
}

console.log("🎉 All Husky hooks fixed!");
