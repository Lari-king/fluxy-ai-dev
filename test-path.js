import fs from "fs";

const path = "./src/styles/globals.css";

if (fs.existsSync(path)) {
  console.log("✅ Le fichier globals.css est bien trouvé :", path);
} else {
  console.log("❌ Introuvable :", path);
}
