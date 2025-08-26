import fs from "fs";

const file = "package.json";
const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
const before = pkg.version ?? "0.0.0";
const [maj, min, pat] = before.split(".").map((x) => parseInt(x || 0, 10));
const after = [maj, min, (isNaN(pat) ? 0 : pat) + 1].join(".");

pkg.version = after;
fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");

console.log(`✅ bump version ${before} → ${after}`);
