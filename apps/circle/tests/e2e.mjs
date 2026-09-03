import { chromium } from "playwright";
import fs from "node:fs/promises";

const baseURL = process.env.CIRCLE_BASE_URL || "http://127.0.0.1:8098";
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const stamp = Date.now();
const email = `circle.qa.${stamp}@example.com`;
const password = `Circle-${stamp}-Test!`;
const output = process.env.CIRCLE_TEST_OUTPUT || "/private/tmp/circle-e2e";
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chrome });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR" });
const page = await context.newPage();
const errors = [];
const waitForImages = (target) => target.waitForFunction(() => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 90_000 });
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(baseURL, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Créer mon Circle" }).first().click();
await page.getByLabel("Votre prénom").fill("QA Circle");
await page.getByLabel("Adresse e-mail").fill(email);
await page.getByLabel("Mot de passe").fill(password);
await page.getByRole("button", { name: "Créer mon compte" }).click();
await page.getByRole("heading", { name: "Commençons par votre foyer." }).waitFor();
await page.getByLabel("Nom du foyer").fill("Foyer test Circle");
await page.getByLabel("Ville").fill("Rouen");
await page.getByRole("button", { name: "Créer mon Circle" }).click();
await page.getByRole("heading", { name: "Où voulez-vous entrer ?" }).waitFor();
await page.getByRole("button", { name: /Foyer test Circle/ }).click();
await page.getByRole("heading", { name: "Foyer test Circle" }).waitFor();
await waitForImages(page);
await page.screenshot({ path: `${output}/desktop-household.png`, fullPage: true });

await page.getByRole("button", { name: "Habitation", exact: true }).click();
await page.getByRole("button", { name: /^Maintenance/ }).click();
await page.getByRole("button", { name: "Signaler un problème" }).first().click();
await page.getByRole("button", { name: /Fuite d'eau/ }).click();
await page.getByRole("button", { name: /Continuer/ }).click();
await page.getByRole("button", { name: /Continuer/ }).click();
await page.getByRole("button", { name: /Prévenir le foyer/ }).click();
await page.getByRole("button", { name: /Fuite d'eau/ }).waitFor();
await waitForImages(page);
await page.screenshot({ path: `${output}/desktop-maintenance-created.png`, fullPage: true });

await page.getByRole("button", { name: "Personnes", exact: true }).click();
await page.getByRole("button", { name: "Profils", exact: true }).click();
await page.getByRole("button", { name: "Yemaya Fille" }).click();
await page.getByRole("button", { name: /^École/ }).click();
await page.getByRole("button", { name: "Modifier la semaine" }).click();
await page.getByRole("button", { name: "Vendredi 18 · soir" }).click();
await page.getByRole("button", { name: "Enregistrer les changements" }).click();
await page.getByRole("heading", { name: "Vendredi soir est réservé." }).waitFor();
await waitForImages(page);
await page.screenshot({ path: `${output}/desktop-school-booking.png`, fullPage: true });

const recordCount = await page.evaluate(async () => {
  const key = Object.keys(localStorage).find((item) => item.endsWith("-auth-token"));
  if (!key) return -1;
  const session = JSON.parse(localStorage.getItem(key) || "{}");
  const response = await fetch("https://mvlhzhayvthsxldfkqxe.supabase.co/rest/v1/circle_records?select=id", {
    headers: {
      apikey: "sb_publishable_y9dNTWQzdlXSqWEU_SmLXg_gNskTQoC",
      Authorization: `Bearer ${session.access_token}`,
      Prefer: "count=exact",
    },
  });
  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : -2;
});

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", storageState: await context.storageState() });
const mobilePage = await mobile.newPage();
await mobilePage.goto(baseURL, { waitUntil: "networkidle" });
await mobilePage.getByRole("button", { name: /Foyer test Circle/ }).click();
await mobilePage.getByRole("heading", { name: "Foyer test Circle" }).waitFor();
await waitForImages(mobilePage);
await mobilePage.screenshot({ path: `${output}/mobile-household.png`, fullPage: false });

console.log(JSON.stringify({ baseURL, email, recordCount, browserErrors: errors, screenshots: output }, null, 2));
await mobile.close();
await context.close();
await browser.close();

if (recordCount < 2 || errors.length) process.exitCode = 1;
