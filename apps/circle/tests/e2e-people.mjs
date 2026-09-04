import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";

const baseURL = process.env.CIRCLE_BASE_URL || "http://127.0.0.1:8098";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY est requis.");

const supabaseURL = "https://mvlhzhayvthsxldfkqxe.supabase.co";
const admin = createClient(supabaseURL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const stamp = Date.now();
const email = `circle.people.${stamp}@example.com`;
const password = `Circle-${stamp}-People!`;
const householdName = `Foyer homonyme ${stamp}`;
const output = process.env.CIRCLE_TEST_OUTPUT || "/private/tmp/circle-people-e2e";
await fs.mkdir(output, { recursive: true });

const errors = [];
let userId;
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const bindErrors = (page) => {
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
};
const login = async (page) => {
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "J'ai déjà un compte" }).click();
  await page.getByLabel("Adresse e-mail").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "Entrer dans Circle" }).click();
};
const assertNoDemoData = async (page) => {
  for (const value of ["Yemaya", "Ludiviane", "Koda", "Aimé prend le relais", "Sortie à la ferme"]) {
    if (await page.getByText(value, { exact: false }).count()) throw new Error(`Donnée d'exemple visible dans un foyer neuf : ${value}`);
  }
};
const addPerson = async (page, { name, relation, profile = "Adulte", city = "" }) => {
  await page.getByLabel("Créer").click();
  await page.getByRole("button", { name: /Une personne du foyer/ }).click();
  await page.getByLabel("Prénom ou nom").fill(name);
  await page.getByRole("button", { name: profile, exact: true }).click();
  await page.getByLabel("Lien avec le foyer").fill(relation);
  if (city) await page.getByLabel("Ville ou lieu").fill(city);
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText(name, { exact: true }).first().waitFor();
};

try {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "QA Isolation" } });
  if (error || !data.user) throw error || new Error("Compte QA non créé.");
  userId = data.user.id;

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR" });
  const page = await desktop.newPage();
  bindErrors(page);
  await login(page);
  await page.getByRole("heading", { name: "Commençons par votre foyer." }).waitFor();
  if (await page.getByLabel("Nom du foyer").inputValue()) throw new Error("Le nom du premier foyer est prérempli.");
  if (await page.getByLabel("Ville").inputValue()) throw new Error("La ville du premier foyer est préremplie.");
  await page.getByLabel("Nom du foyer").fill(householdName);
  await page.getByLabel("Ville").fill("Rouen");
  await page.getByRole("button", { name: "Créer mon Circle" }).click();
  await page.getByRole("heading", { name: "Où voulez-vous entrer ?" }).waitFor();
  await page.locator(".household-card").filter({ hasText: "Rouen" }).click();
  await page.getByRole("heading", { name: householdName }).waitFor();
  await page.getByRole("heading", { name: "Qui fait partie de ce foyer ?" }).waitFor();
  await assertNoDemoData(page);

  const peopleArts = [];
  for (const tab of ["Aujourd'hui", "Profils", "Agenda", "Entourage"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    const image = page.locator(".people-empty > img");
    await image.evaluate((element) => element.decode());
    const source = await image.getAttribute("src");
    if (!source) throw new Error(`Le bandeau ${tab} n'a pas d'illustration.`);
    peopleArts.push(source);
  }
  if (new Set(peopleArts).size !== peopleArts.length) throw new Error(`Illustrations réutilisées dans Personnes : ${peopleArts.join(", ")}`);
  if (peopleArts.includes("/art/circle-trusted-ring-v1.png")) throw new Error("L'illustration du foyer est réutilisée dans un onglet Personnes.");
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  if (await page.locator(".real-calendar > header").count()) throw new Error("L'ancien bandeau blanc de l'Agenda est encore rendu.");
  if (await page.getByRole("button", { name: "Ajouter", exact: true }).count()) throw new Error("Le bouton Ajouter redondant de l'Agenda est encore rendu.");
  await page.getByRole("button", { name: "Aujourd'hui", exact: true }).click();

  await page.getByRole("button", { name: "Centre de notifications" }).click();
  await page.getByRole("heading", { name: "Rien à signaler." }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).last().click();

  await page.getByRole("button", { name: "Ajouter une première personne" }).click();
  await page.getByLabel("Prénom ou nom").fill("Camille QA");
  await page.getByLabel("Lien avec le foyer").fill("Parent");
  await page.getByLabel("Ville ou lieu").fill("Rouen");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.getByText("Camille QA", { exact: true }).first().waitFor();
  await addPerson(page, { name: "Lina QA", relation: "Fille", profile: "Enfant", city: "Rouen" });
  await page.locator(".dynamic-profile-switcher > button").filter({ hasText: "Camille QA" }).click();
  await page.getByRole("button", { name: "Modifier Camille QA" }).click();
  await page.getByLabel("Lien avec le foyer").fill("Parent référent");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText("Parent référent", { exact: true }).first().waitFor();
  await addPerson(page, { name: "Pixel QA", relation: "Chien", profile: "Animal" });
  await page.locator(".dynamic-profile-switcher > button").filter({ hasText: "Pixel QA" }).click();
  await page.getByRole("button", { name: "Modifier Pixel QA" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Retirer", exact: true }).click();
  await page.waitForFunction(() => !document.body.innerText.includes("Pixel QA"));

  await page.getByLabel("Créer").click();
  await page.getByRole("button", { name: /Un rendez-vous/ }).click();
  await page.getByLabel("Qu'est-ce qui est prévu ?").fill("Dentiste QA");
  await page.getByRole("checkbox", { name: "Lina QA", exact: true }).check();
  await page.getByLabel("Lieu").fill("Centre médical");
  await page.getByRole("button", { name: "Ajouter à l'agenda" }).click();
  await page.getByText("Dentiste QA", { exact: true }).first().waitFor();

  await page.getByLabel("Créer").click();
  await page.getByRole("button", { name: /Une routine/ }).click();
  await page.getByRole("textbox", { name: "Routine", exact: true }).fill("Lecture du soir QA");
  await page.getByLabel("Personne concernée").selectOption({ label: "Lina QA" });
  await page.getByRole("button", { name: "Enregistrer la routine" }).click();
  await page.locator(".dynamic-profile-switcher > button").filter({ hasText: "Lina QA" }).click();
  await page.getByText("Lecture du soir QA", { exact: true }).waitFor();

  await page.getByRole("button", { name: "Entourage", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un proche" }).click();
  await page.getByLabel("Prénom ou nom").fill("Marie QA");
  await page.getByLabel("Lien avec le foyer").fill("Grand-mère");
  await page.getByLabel("Ville ou lieu").fill("Bois-Guillaume");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByText("Marie QA", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Mon compte" }).click();
  await page.getByText(email, { exact: true }).waitFor();
  await page.getByRole("button", { name: "Fermer", exact: true }).first().click();
  await page.screenshot({ path: `${output}/desktop-first-household.png`, fullPage: true });

  await page.getByRole("button", { name: "Changer de foyer" }).click();
  await page.getByRole("button", { name: "Créer un autre foyer" }).click();
  await page.getByLabel("Nom du nouveau foyer").fill(householdName);
  await page.getByLabel("Ville du nouveau foyer").fill("Paris");
  await page.getByRole("button", { name: "Créer ce foyer" }).click();
  await page.getByRole("heading", { name: "Qui fait partie de ce foyer ?" }).waitFor();
  await assertNoDemoData(page);
  if (await page.getByText("Camille QA", { exact: true }).count()) throw new Error("Une personne du premier foyer apparaît dans le second.");
  await page.getByRole("button", { name: "Ajouter une première personne" }).click();
  await page.getByLabel("Prénom ou nom").fill("Noé QA");
  await page.getByLabel("Lien avec le foyer").fill("Parent");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.getByText("Noé QA", { exact: true }).first().waitFor();

  await page.getByRole("button", { name: "Changer de foyer" }).click();
  const cards = page.locator(".household-card");
  if (await cards.count() !== 2) throw new Error("Les deux foyers homonymes ne sont pas affichés séparément.");
  await cards.filter({ hasText: "Rouen" }).click();
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.getByText("Camille QA", { exact: true }).first().waitFor();
  if (await page.getByText("Noé QA", { exact: true }).count()) throw new Error("Une personne du second foyer apparaît dans le premier.");
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 402, height: 874 }, screen: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, locale: "fr-FR" });
  const mobilePage = await mobile.newPage();
  bindErrors(mobilePage);
  await login(mobilePage);
  await mobilePage.getByRole("heading", { name: "Où voulez-vous entrer ?" }).waitFor();
  const mobileCard = mobilePage.locator(".household-card").first();
  const cardBox = await mobileCard.boundingBox();
  const artBox = await mobileCard.locator("img").boundingBox();
  if (!cardBox || cardBox.height > 210) throw new Error(`Carte foyer mobile trop haute : ${cardBox?.height}`);
  if (artBox) throw new Error(`L'illustration du foyer réserve encore ${artBox.width}px sur mobile.`);
  const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
  if (scrollWidth > 403) throw new Error(`Débordement horizontal mobile : ${scrollWidth}px`);
  await mobilePage.screenshot({ path: `${output}/mobile-households.png`, fullPage: false });
  await mobilePage.locator(".household-card").filter({ hasText: "Rouen" }).click();
  const coverBox = await mobilePage.locator(".household-cover").boundingBox();
  if (!coverBox || coverBox.height > 105) throw new Error(`Bandeau foyer mobile trop haut : ${coverBox?.height}`);
  await mobilePage.getByRole("button", { name: "Profils", exact: true }).click();
  await mobilePage.getByText("Camille QA", { exact: true }).first().waitFor();
  await mobilePage.screenshot({ path: `${output}/mobile-people.png`, fullPage: false });
  await mobile.close();

  const { data: households } = await admin.from("circle_households").select("id,name,city").eq("owner_id", userId).order("created_at");
  if (!households || households.length !== 2 || new Set(households.map((item) => item.id)).size !== 2) throw new Error("Les deux foyers n'ont pas deux UUID distincts.");
  const { data: records } = await admin.from("circle_records").select("household_id,kind,title").in("household_id", households.map((item) => item.id));
  const rouen = households.find((item) => item.city === "Rouen");
  const paris = households.find((item) => item.city === "Paris");
  if (!rouen || !paris) throw new Error("Les foyers QA sont introuvables.");
  const rouenTitles = records?.filter((item) => item.household_id === rouen.id).map((item) => item.title) || [];
  const parisTitles = records?.filter((item) => item.household_id === paris.id).map((item) => item.title) || [];
  if (!rouenTitles.includes("Camille QA") || rouenTitles.includes("Noé QA") || !parisTitles.includes("Noé QA") || parisTitles.includes("Camille QA")) throw new Error("Isolation serveur des foyers invalide.");

  console.log(JSON.stringify({ households: households.map(({ id, name, city }) => ({ id, name, city })), recordCount: records?.length || 0, browserErrors: errors, screenshots: output }, null, 2));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
  if (userId) await admin.auth.admin.deleteUser(userId);
}
