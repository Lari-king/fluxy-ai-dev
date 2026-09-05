import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";

const baseURL = process.env.CIRCLE_BASE_URL || "http://127.0.0.1:8099";
const email = process.env.CIRCLE_TEST_EMAIL;
const password = process.env.CIRCLE_TEST_PASSWORD;
if (!email || !password) throw new Error("CIRCLE_TEST_EMAIL et CIRCLE_TEST_PASSWORD sont requis.");

const supabase = createClient(
  "https://mvlhzhayvthsxldfkqxe.supabase.co",
  "sb_publishable_y9dNTWQzdlXSqWEU_SmLXg_gNskTQoC",
  { auth: { autoRefreshToken: false, persistSession: false } },
);
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const stamp = Date.now();
const householdName = `École QA ${stamp}`;
const childName = `Lina École ${stamp}`;
const output = process.env.CIRCLE_TEST_OUTPUT || "/private/tmp/circle-school-e2e";
await fs.mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chrome });
const errors = [];
const bindErrors = (page) => {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", (response) => {
    if (response.status() >= 400 && !response.url().includes("favicon")) errors.push(`${response.status()} ${response.url()}`);
  });
};
const login = async (page) => {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "J'ai déjà un compte" }).click();
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "Entrer dans Circle" }).click();
  await page.getByRole("heading", { name: "Où voulez-vous entrer ?" }).waitFor();
};
const openSchool = async (page) => {
  await page.locator(".households-page, .section-toolbar").first().waitFor();
  if (await page.locator(".households-page").count()) {
    await page.locator(".household-card").filter({ hasText: householdName }).click();
  }
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.locator(".dynamic-profile-switcher > button").filter({ hasText: childName }).click();
  await page.getByRole("button", { name: "École", exact: true }).click();
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR" });
  const page = await context.newPage();
  bindErrors(page);
  await login(page);

  await page.getByRole("button", { name: "Créer un autre foyer" }).click();
  await page.getByLabel("Nom du nouveau foyer").fill(householdName);
  await page.getByLabel("Ville du nouveau foyer").fill("Rouen");
  await page.getByRole("button", { name: "Créer ce foyer" }).click();
  await page.getByRole("heading", { name: householdName }).waitFor();

  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter une personne" }).click();
  await page.getByLabel("Prénom ou nom").fill(childName);
  await page.getByRole("button", { name: "Enfant", exact: true }).click();
  await page.getByLabel("Lien avec le foyer").fill("Fille");
  await page.getByLabel("Ville ou lieu").fill("Rouen");
  await page.getByRole("button", { name: "Féminin" }).click();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText(childName, { exact: true }).first().waitFor();

  await page.locator(".dynamic-profile-switcher > button").filter({ hasText: childName }).click();
  await page.getByRole("button", { name: "École", exact: true }).click();
  await page.getByRole("button", { name: "Lancer l’assistant École" }).click();
  await page.getByLabel("Rechercher une école").fill("Pépinières");
  await page.getByRole("button", { name: "Rechercher", exact: true }).click();
  const schoolResult = page.getByRole("button", { name: /Pépinières Saint Julien/i }).first();
  await schoolResult.waitFor({ timeout: 30_000 });
  await schoolResult.click();
  await page.getByLabel("Tarif matin (€)").waitFor();
  await page.waitForFunction(() => document.querySelector('[aria-label="Tarif matin (€)"]')?.value === "0.64");
  if (!((await page.getByLabel("Tranche appliquée").inputValue()).includes("tarif maximal provisoire"))) throw new Error("Le tarif maximal n'est pas appliqué sans quotient.");
  await page.getByLabel("Quotient familial").fill("900");
  if (await page.getByLabel("Tarif matin (€)").inputValue() !== "0.48") throw new Error("Le quotient ne recalcule pas le tarif du matin.");

  await page.getByLabel("Classe ou niveau").fill("Petite section");
  await page.getByLabel("Entrée ou point de rendez-vous").fill("Entrée côté jardin");
  await page.getByLabel("Enseignant ou référent").fill("Jenny Langevin");
  await page.getByLabel("ATSEM ou second contact").fill("Fatma Yilmaz");
  await page.getByLabel("Ouverture de l'accueil").fill("07:45");
  await page.getByLabel("Début de la classe").fill("08:20");
  await page.getByLabel("Déjeuner").fill("12:00");
  await page.getByLabel("Fin de la classe").fill("16:30");
  await page.getByLabel("Début du périscolaire").fill("16:30");
  await page.getByLabel("Première récupération").fill("17:05");
  await page.getByLabel("Créneau de récupération").fill("Entre 17:30 et 18:00");
  await page.getByLabel("Personnes autorisées").fill("Aimé, Ludiviane, Marie");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();

  await page.getByRole("heading", { name: /Pépinières Saint Julien/i }).waitFor();
  await page.getByText("UAI", { exact: false }).count();
  await page.getByLabel("Modifier les réservations").click();
  for (const label of ["Lun · matin", "Lun · midi", "Lun · soir", "Mar · midi", "Mar · soir", "Jeu · matin", "Jeu · midi", "Jeu · soir", "Ven · midi"]) {
    await page.getByLabel(label).click();
  }
  await page.getByRole("button", { name: /Mercredi · centre de loisirs/ }).click();
  await page.getByLabel("Arrivée du mercredi").fill("08:00");
  await page.getByLabel("Départ du mercredi").fill("18:00");
  await page.getByRole("button", { name: "Enregistrer dans Circle" }).click();
  await page.getByRole("heading", { name: "La semaine est claire." }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByText("Matin · Midi · Soir", { exact: true }).first().waitFor();
  await page.getByRole("button", { name: "Comprendre et ajuster" }).click();
  await page.getByLabel("Quotient familial pour le calcul").fill("900");
  await page.getByRole("button", { name: "Mettre à jour le calcul" }).click();
  await page.getByRole("heading", { name: "Tarification mise à jour" }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await page.locator(".school-memory > button").filter({ hasText: "Dans son sac" }).click();
  await page.getByLabel("Contenu du sac").fill("Change complet, pochette, doudou");
  await page.getByLabel("Référent périscolaire").fill("Laurent Ledemé");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("heading", { name: "Repères enregistrés" }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByText("Change complet, pochette, doudou", { exact: true }).waitFor();

  await page.getByLabel("Ajouter un document").click();
  await page.getByLabel("Fichier à analyser").setInputFiles({
    name: "fiche-sanitaire.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Fiche sanitaire de l'enfant\nValable pour l'école et le centre de loisirs"),
  });
  await page.getByLabel("Nom du document scolaire").fill("Fiche sanitaire");
  await page.getByRole("button", { name: "Ranger dans son dossier" }).click();
  await page.getByRole("heading", { name: /Fiche sanitaire est à sa place/ }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByText("Fiche sanitaire", { exact: true }).first().waitFor();
  await page.getByLabel("Ouvrir Fiche sanitaire").click();
  await page.getByLabel("Nom du document scolaire").fill("Fiche sanitaire validée");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("heading", { name: "Le dossier est à jour." }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.getByText("Fiche sanitaire validée", { exact: true }).first().waitFor();

  await page.locator(".school-memory > button").filter({ hasText: "Vacances" }).click();
  await page.getByLabel("Nom des vacances").fill("Vacances de la Toussaint");
  await page.getByLabel("Début des vacances").fill("2026-10-17");
  await page.getByLabel("Fin des vacances").fill("2026-11-02");
  await page.getByLabel("Couverture des vacances").fill("Première semaine avec les parents");
  await page.getByLabel("Jours à organiser").fill("Mercredi 28 octobre");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("heading", { name: "La période est visible." }).waitFor();
  await page.getByLabel("Fermer").last().click();

  await page.reload({ waitUntil: "domcontentloaded" });
  await openSchool(page);
  await page.getByRole("heading", { name: /Pépinières Saint Julien/i }).waitFor();
  await page.getByText("Fiche sanitaire validée", { exact: true }).first().waitFor();
  await page.getByText(/période préparée/).waitFor();
  await page.locator(".school-memory > button").filter({ hasText: "Vacances" }).click();
  await page.locator(".school-holiday-list > button").filter({ hasText: "Vacances de la Toussaint" }).click();
  if (await page.getByLabel("Jours à organiser").inputValue() !== "Mercredi 28 octobre") throw new Error("La période de vacances n'est pas rééditable après rechargement.");
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.screenshot({ path: `${output}/desktop-school.png`, fullPage: true });

  const mobile = await browser.newContext({ viewport: { width: 402, height: 874 }, screen: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, locale: "fr-FR" });
  const mobilePage = await mobile.newPage();
  bindErrors(mobilePage);
  await login(mobilePage);
  await mobilePage.locator(".household-card").filter({ hasText: householdName }).click();
  await openSchool(mobilePage);
  await mobilePage.getByRole("heading", { name: /Pépinières Saint Julien/i }).waitFor();
  const layout = await mobilePage.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth, card: document.querySelector(".school-hub")?.getBoundingClientRect().width }));
  if (layout.width > layout.viewport + 1) throw new Error(`Débordement mobile: ${layout.width}px pour ${layout.viewport}px.`);
  await mobilePage.screenshot({ path: `${output}/mobile-school.png`, fullPage: false });
  await mobile.close();

  await page.getByRole("button", { name: "Changer de foyer" }).click();
  await page.getByLabel(`Supprimer le foyer ${householdName}`).click();
  await page.getByLabel("Nom du foyer à supprimer").fill(householdName);
  await page.getByRole("button", { name: "Supprimer définitivement" }).click();
  await page.waitForFunction((name) => !document.body.innerText.includes(name), householdName);
  await context.close();

  if (errors.length) throw new Error(`Erreurs navigateur:\n${errors.join("\n")}`);
  console.log(JSON.stringify({ school: "persisted", booking: "persisted", document: "persisted", holiday: "persisted", mobile: "402x874", householdDeletion: "verified", screenshots: output }, null, 2));
} finally {
  await browser.close();
  const { data } = await supabase.auth.signInWithPassword({ email, password });
  if (data.user) {
    const { data: leftovers } = await supabase.from("circle_households").select("id,name").eq("owner_id", data.user.id).eq("name", householdName);
    const removeFolder = async (prefix) => {
      const { data: entries } = await supabase.storage.from("circle-documents").list(prefix, { limit: 1000 });
      const files = (entries || []).filter((item) => item.id).map((item) => `${prefix}/${item.name}`);
      if (files.length) await supabase.storage.from("circle-documents").remove(files);
      for (const folder of (entries || []).filter((item) => !item.id)) await removeFolder(`${prefix}/${folder.name}`);
    };
    const { data: roots } = await supabase.storage.from("circle-documents").list("", { limit: 1000 });
    for (const household of leftovers || []) {
      for (const root of new Set([data.user.id, ...(roots || []).filter((item) => !item.id).map((item) => item.name)])) await removeFolder(`${root}/${household.id}`);
      await supabase.rpc("circle_delete_household", { target_household_id: household.id });
    }
    await supabase.auth.signOut();
  }
}
