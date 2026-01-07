import fs from "fs";
import path from "path";

const root = "./src";

function scan(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      scan(full);
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      let content = fs.readFileSync(full, "utf8");

      if (content.includes("ringColor")) {
        const updated = content.replace(/ringColor\s*:/g, "'--tw-ring-color':");
        fs.writeFileSync(full, updated, "utf8");
        console.log("🔧 Fixed:", full);
      }
    }
  });
}

console.log("🚀 Fixing ringColor...");
scan(root);
console.log("✅ Done!");
