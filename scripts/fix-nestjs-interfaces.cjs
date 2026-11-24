const fs = require("fs");
const path = require("path");

function patchPackage(pkgRoot) {
  const pkgPath = path.join(pkgRoot, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  if (!pkg.exports || typeof pkg.exports !== "object") return false;

  const next = { ...pkg.exports };
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

  // Node 24+/26 sometimes resolves the catch-all to a physical interfaces.js.
  // Provide a real re-export so both export maps and file lookups succeed.
  const shim = path.join(pkgRoot, "interfaces.js");
  const shimSource = "module.exports = require('./interfaces/index.js');\n";
  if (!fs.existsSync(shim) || fs.readFileSync(shim, "utf8") !== shimSource) {
    fs.writeFileSync(shim, shimSource);
  }
  return true;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "@nestjs") {
        const common = path.join(full, "common");
        if (fs.existsSync(path.join(common, "package.json"))) out.push(common);
      } else if (entry.name !== ".bin" && entry.name !== "node_modules") {
        walk(full, out);
      } else if (entry.name === "node_modules") {
        walk(full, out);
      }
    }
  }
}

const root = path.join(__dirname, "..", "node_modules");
const targets = [];
walk(root, targets);
// Deduplicate real paths (pnpm symlinks).
const seen = new Set();
let fixed = 0;
for (const target of targets) {
  let real = target;
  try {
    real = fs.realpathSync(target);
  } catch {
    continue;
  }
  if (seen.has(real)) continue;
  seen.add(real);
  if (patchPackage(real)) fixed += 1;
}
if (fixed) console.log(`nestjs interfaces export patch applied (${fixed})`);
else console.log("nestjs interfaces export patch: nothing to patch");
