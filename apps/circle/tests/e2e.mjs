import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";

const baseURL = process.env.CIRCLE_BASE_URL || "http://127.0.0.1:8098";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY est requis pour le test E2E avec confirmation e-mail.");

const supabaseURL = "https://mvlhzhayvthsxldfkqxe.supabase.co";
const publishableKey = "sb_publishable_y9dNTWQzdlXSqWEU_SmLXg_gNskTQoC";
const admin = createClient(supabaseURL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const stamp = Date.now();
const email = `circle.qa.${stamp}@example.com`;
const confirmEmail = `circle.confirm.${stamp}@gmail.com`;
const password = `Circle-${stamp}-Test!`;
const output = process.env.CIRCLE_TEST_OUTPUT || "/private/tmp/circle-e2e";
await fs.mkdir(output, { recursive: true });

const errors = [];
const createdUserIds = [];
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const bindErrors = (page) => {
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
};
const waitForImages = (page) => page.waitForFunction(() => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 90_000 });
const closeCompletedFlow = (page) => page.locator(".panel-footer .text-button", { hasText: "Fermer" }).click();

let recordCount = -1;
try {
  if (process.env.CIRCLE_TEST_CONFIRMATION === "1") {
    const confirmationContext = await browser.newContext({ viewport: { width: 1100, height: 800 }, locale: "fr-FR" });
    const confirmationPage = await confirmationContext.newPage();
    bindErrors(confirmationPage);
    await confirmationPage.route("**/auth/v1/signup", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: crypto.randomUUID(), aud: "authenticated", role: "authenticated", email: confirmEmail, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: { full_name: "QA Confirmation" }, identities: [], created_at: new Date().toISOString() }, session: null }) });
    });
    await confirmationPage.goto(baseURL, { waitUntil: "networkidle" });
    await confirmationPage.getByRole("button", { name: "Créer mon Circle" }).first().click();
    await confirmationPage.getByLabel("Votre prénom").fill("QA Confirmation");
    await confirmationPage.getByLabel("Adresse e-mail").fill(confirmEmail);
    await confirmationPage.getByLabel("Mot de passe").fill(password);
    await confirmationPage.getByRole("button", { name: "Créer mon compte" }).click();
    await confirmationPage.getByRole("heading", { name: "Regardez votre boîte mail." }).waitFor();
    await confirmationContext.close();
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "QA Circle" } });
  if (createError || !created.user) throw createError || new Error("Le compte E2E n'a pas été créé.");
  createdUserIds.push(created.user.id);

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR" });
  const page = await context.newPage();
  bindErrors(page);
  await page.goto(baseURL, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Se connecter" }).first().click();
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Entrer dans Circle" }).click();
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

  await page.getByRole("button", { name: "Équipements", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un équipement" }).first().click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("heading", { name: "Lave-vaisselle Bosch est suivi." }).waitFor();
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.getByRole("button", { name: /Lave-vaisselle Bosch/ }).first().waitFor();

  await page.getByRole("button", { name: "Améliorations", exact: true }).click();
  await page.getByRole("button", { name: "Imaginer une amélioration" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("heading", { name: "L'idée est prête à être décidée." }).waitFor();
  await page.getByRole("button", { name: "Terminer" }).click();

  await page.getByRole("button", { name: "Personnes", exact: true }).click();
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.getByRole("button", { name: "Yemaya Fille" }).click();
  await page.getByRole("button", { name: /^École/ }).click();
  await page.getByRole("button", { name: "Modifier la semaine" }).click();
  await page.getByRole("button", { name: "Vendredi 18 · soir" }).click();
  await page.getByRole("button", { name: "Enregistrer les changements" }).click();
  await page.getByRole("heading", { name: "Vendredi soir est réservé." }).waitFor();
  await closeCompletedFlow(page);
  await page.getByRole("button", { name: "Ajouter un document" }).click();
  await page.getByRole("button", { name: "Choisir un fichier" }).click();
  await page.getByRole("button", { name: "Valider et ranger" }).click();
  await page.getByRole("heading", { name: "L'autorisation est rangée." }).waitFor();
  await closeCompletedFlow(page);

  await page.getByRole("button", { name: "Abonnements", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un abonnement" }).first().click();
  await page.getByRole("button", { name: "Ajouter l'abonnement" }).click();
  await page.getByRole("heading", { name: "Disney+ est suivi." }).waitFor();
  await closeCompletedFlow(page);
  await page.getByRole("button", { name: /Disney\+/ }).waitFor();

  await page.getByRole("button", { name: "Finances", exact: true }).click();
  await page.getByRole("button", { name: "Voir et ajuster" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: /Selon les revenus/ }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("heading", { name: "Tout le monde voit la même chose." }).waitFor();
  await page.getByRole("button", { name: "Terminer" }).click();
  await page.getByRole("button", { name: /Règle Selon les revenus/ }).waitFor();
  await waitForImages(page);
  await page.screenshot({ path: `${output}/desktop-connected-workflows.png`, fullPage: true });

  recordCount = await page.evaluate(async ({ url, key: apiKey }) => {
    const authKey = Object.keys(localStorage).find((item) => item.endsWith("-auth-token"));
    if (!authKey) return -1;
    const session = JSON.parse(localStorage.getItem(authKey) || "{}");
    const response = await fetch(`${url}/rest/v1/circle_records?select=id`, { headers: { apikey: apiKey, Authorization: `Bearer ${session.access_token}` } });
    const rows = await response.json();
    return Array.isArray(rows) ? rows.length : -2;
  }, { url: supabaseURL, key: publishableKey });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: "fr-FR", storageState: await context.storageState() });
  const mobilePage = await mobile.newPage();
  bindErrors(mobilePage);
  await mobilePage.goto(baseURL, { waitUntil: "networkidle" });
  await mobilePage.getByRole("button", { name: /Foyer test Circle/ }).click();
  await mobilePage.getByRole("heading", { name: "Foyer test Circle" }).waitFor();
  await waitForImages(mobilePage);
  await mobilePage.screenshot({ path: `${output}/mobile-household.png`, fullPage: false });
  await mobile.close();
  await context.close();
} finally {
  await browser.close();
  for (const userId of createdUserIds) await admin.auth.admin.deleteUser(userId);
}

console.log(JSON.stringify({ baseURL, recordCount, browserErrors: errors, screenshots: output }, null, 2));
if (recordCount < 6 || errors.length) process.exitCode = 1;
