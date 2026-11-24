const fs = require("fs");
const path = require("path");

function patchPackage(pkgRoot) {
  const pkgPath = path.join(pkgRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.exports || typeof pkg.exports !== "object") return false;

  const next = { ...pkg.exports };
  let changed = false;
  if (next["./interfaces"] !== "./interfaces/index.js") {
    next["./interfaces"] = "./interfaces/index.js";
    changed = true;
  }
  if (next["./interfaces.js"] !== "./interfaces/index.js") {
    next["./interfaces.js"] = "./interfaces/index.js";
    changed = true;
  }
  if (!changed) return false;

  // Keep explicit mappings ahead of the catch-all `./*` → `./*.js` rule.
  pkg.exports = {
    ".": next["."],
    "./package.json": next["./package.json"],
    "./internal": next["./internal"],
    "./interfaces": "./interfaces/index.js",
    "./interfaces.js": "./interfaces/index.js",
    "./*.js": next["./*.js"],
    "./*": next["./*"],
  };

  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
  const bogus = path.join(pkgRoot, "interfaces.js");
  if (fs.existsSync(bogus) && fs.statSync(bogus).isFile()) fs.unlinkSync(bogus);
  return true;
}

const root = path.join(__dirname, "..", "node_modules");
let fixed = 0;
const pnpm = path.join(root, ".pnpm");
if (fs.existsSync(pnpm)) {
  for (const entry of fs.readdirSync(pnpm)) {
    if (!entry.startsWith("@nestjs+common@")) continue;
    if (patchPackage(path.join(pnpm, entry, "node_modules", "@nestjs", "common"))) fixed += 1;
  }
}
if (patchPackage(path.join(root, "@nestjs", "common"))) fixed += 1;
if (fixed) console.log(`nestjs interfaces export patch applied (${fixed})`);
