import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseURL = process.env.CIRCLE_BASE_URL || "http://127.0.0.1:8098";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY est requis pour le test E2E avec confirmation e-mail.");

const supabaseURL = "https://mvlhzhayvthsxldfkqxe.supabase.co";
const publishableKey = "sb_publishable_y9dNTWQzdlXSqWEU_SmLXg_gNskTQoC";
const admin = createClient(supabaseURL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const stamp = Date.now();
const publicSignup = process.env.CIRCLE_TEST_PUBLIC_SIGNUP === "1";
const email = `circle.qa.${stamp}@${publicSignup ? "gmail.com" : "example.com"}`;
const confirmEmail = `circle.confirm.${stamp}@gmail.com`;
const password = `Circle-${stamp}-Test!`;
const output = process.env.CIRCLE_TEST_OUTPUT || "/private/tmp/circle-e2e";
const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
await fs.mkdir(output, { recursive: true });

const errors = [];
const createdUserIds = [];
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const bindErrors = (page) => {
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
};
const waitForImages = (page) => page.waitForFunction(() => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0), null, { timeout: 90_000 });
const auditMobileLayout = async (page, label) => {
  await waitForImages(page);
  const result = await page.evaluate(() => {
    const rootWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const brokenImages = Array.from(document.images).filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src);
    const dialog = document.querySelector('[role="dialog"]');
    const dialogRect = dialog?.getBoundingClientRect();
    return {
      viewportWidth: window.innerWidth,
      rootWidth,
      brokenImages,
      dialogOutsideViewport: Boolean(dialogRect && (dialogRect.left < -1 || dialogRect.right > window.innerWidth + 1)),
    };
  });
  if (result.rootWidth > result.viewportWidth + 1) throw new Error(`${label}: débordement horizontal ${result.rootWidth}px pour ${result.viewportWidth}px.`);
  if (result.brokenImages.length) throw new Error(`${label}: ${result.brokenImages.length} image(s) non chargée(s).`);
  if (result.dialogOutsideViewport) throw new Error(`${label}: le panneau sort du viewport.`);
};
const closeCompletedFlow = (page) => page.locator(".panel-footer .text-button", { hasText: "Fermer" }).click();
const createTextPdf = (lines) => {
  const content = ["BT", "/F1 14 Tf", "72 740 Td", ...lines.flatMap((line, index) => [`(${line.replace(/[()\\]/g, "\\$&")}) Tj`, index < lines.length - 1 ? "0 -24 Td" : ""]), "ET"].filter(Boolean).join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    `5 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) { offsets.push(Buffer.byteLength(pdf)); pdf += object; }
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
};

let recordCount = -1;
let uploadedFileCount = -1;
let uploadedPaths = [];
try {
  if (process.env.CIRCLE_TEST_CONFIRMATION === "1") {
    const confirmationContext = await browser.newContext({ viewport: { width: 1100, height: 800 }, locale: "fr-FR" });
    const confirmationPage = await confirmationContext.newPage();
    bindErrors(confirmationPage);
    await confirmationPage.route("**/auth/v1/signup", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ user: { id: crypto.randomUUID(), aud: "authenticated", role: "authenticated", email: confirmEmail, app_metadata: { provider: "email", providers: ["email"] }, user_metadata: { full_name: "QA Confirmation" }, identities: [], created_at: new Date().toISOString() }, session: null }) });
    });
    await confirmationPage.goto(baseURL, { waitUntil: "domcontentloaded" });
    await confirmationPage.getByText("Mentions légales", { exact: true }).waitFor();
    await confirmationPage.getByRole("button", { name: "Créer mon Circle" }).first().click();
    await confirmationPage.getByLabel("Votre prénom").fill("QA Confirmation");
    await confirmationPage.getByLabel("Adresse e-mail").fill(confirmEmail);
    await confirmationPage.locator("#auth-password").fill(password);
    await confirmationPage.getByRole("button", { name: "Afficher le mot de passe" }).click();
    if (await confirmationPage.locator("#auth-password").getAttribute("type") !== "text") throw new Error("Le mot de passe ne devient pas visible.");
    await confirmationPage.getByRole("button", { name: "Créer mon compte" }).click();
    await confirmationPage.getByRole("heading", { name: "Regardez votre boîte mail." }).waitFor();
    await confirmationContext.close();
  }

  if (!publicSignup) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: "QA Circle" } });
    if (createError || !created.user) throw createError || new Error("Le compte E2E n'a pas été créé.");
    createdUserIds.push(created.user.id);
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "fr-FR" });
  const page = await context.newPage();
  bindErrors(page);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });
  await waitForImages(page);
  const landingArt = page.locator(".landing-hero > img");
  await landingArt.waitFor();
  const landingImageSource = await landingArt.getAttribute("src");
  if (!landingImageSource?.includes("circle-landing-family-v2.png")) throw new Error("La landing ne charge pas la nouvelle illustration.");
  await page.screenshot({ path: `${output}/desktop-landing.png`, fullPage: true });

  const mobileLanding = await browser.newContext({ viewport: { width: 402, height: 874 }, screen: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, locale: "fr-FR" });
  const mobileLandingPage = await mobileLanding.newPage();
  bindErrors(mobileLandingPage);
  await mobileLandingPage.goto(baseURL, { waitUntil: "domcontentloaded" });
  await auditMobileLayout(mobileLandingPage, "landing");
  await mobileLandingPage.screenshot({ path: `${output}/mobile-landing.png`, fullPage: true });
  await mobileLandingPage.getByRole("button", { name: "Créer mon Circle" }).first().click();
  await mobileLandingPage.getByRole("heading", { name: "Créer mon compte" }).waitFor();
  await auditMobileLayout(mobileLandingPage, "création de compte");
  await mobileLandingPage.screenshot({ path: `${output}/mobile-signup.png`, fullPage: false });
  await mobileLanding.close();

  if (publicSignup) {
    await page.getByRole("button", { name: "Créer mon Circle" }).first().click();
    await page.getByLabel("Votre prénom").fill("QA Circle");
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const signedUpUser = users.users.find((user) => user.email === email);
    if (signedUpUser) createdUserIds.push(signedUpUser.id);
  } else {
    await page.getByRole("button", { name: "Se connecter" }).first().click();
    await page.getByLabel("Adresse e-mail").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "Entrer dans Circle" }).click();
  }
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
  await page.getByRole("button", { name: "Ajouter un document" }).first().click();
  await page.getByLabel("Fichier à analyser").setInputFiles({ name: "facture-electricite-septembre.pdf", mimeType: "application/pdf", buffer: createTextPdf(["EDF", "Facture electricite du foyer", "Montant a payer : 124,30 EUR", "Prelevement le 21 septembre 2026"]) });
  await page.getByText("Informations repérées · à confirmer", { exact: true }).waitFor();
  await page.getByLabel("Fournisseur", { exact: true }).waitFor();
  if (await page.getByLabel("Fournisseur", { exact: true }).inputValue() !== "EDF") throw new Error("Le fournisseur du contrat n'a pas été extrait.");
  await page.getByRole("button", { name: "Confirmer et ranger" }).click();
  await page.getByRole("heading", { name: "Le document est au bon endroit." }).waitFor();
  await closeCompletedFlow(page);
  await page.getByRole("button", { name: /^Électricité/ }).first().click();
  await page.getByText("124,30 €", { exact: true }).first().waitFor();

  await page.getByRole("button", { name: "Ajouter un contrat" }).first().click();
  await page.getByRole("button", { name: /^Eau/ }).last().click();
  await page.getByRole("button", { name: "Continuer" }).click();
  await page.getByRole("button", { name: "Ajouter ce contrat" }).click();
  await page.getByRole("heading", { name: "Eau est maintenant suivi." }).waitFor();
  await page.getByRole("button", { name: "Terminer" }).click();

  await page.getByRole("button", { name: /^Maintenance/ }).click();
  await page.getByRole("button", { name: "Signaler un problème" }).first().click();
  await page.getByRole("button", { name: /Fuite d'eau/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByRole("button", { name: /Continuer/ }).click();
  await page.getByRole("button", { name: /Prévenir le foyer/ }).click();
  await page.getByRole("button", { name: /Fuite d'eau/ }).waitFor();
  await page.getByRole("button", { name: "Planifier", exact: true }).click();
  await page.getByRole("button", { name: /Une routine/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Planifier", exact: true }).click();
  await page.getByRole("heading", { name: "Vendredi à 18:30." }).waitFor();
  await closeCompletedFlow(page);

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
  await page.getByRole("button", { name: "Ajouter une première personne" }).click();
  await page.getByLabel("Prénom ou nom").fill("Enfant QA");
  await page.getByRole("button", { name: "Enfant", exact: true }).click();
  await page.getByLabel("Lien avec le foyer").fill("Enfant");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un rendez-vous" }).click();
  await page.getByLabel("Qu'est-ce qui est prévu ?").fill("Rendez-vous QA");
  await page.getByRole("button", { name: "Ajouter à l'agenda" }).click();
  await page.getByText("Rendez-vous QA", { exact: true }).first().waitFor();

  await page.getByRole("button", { name: "Abonnements", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un abonnement" }).first().click();
  await page.getByLabel("Fichier à analyser").setInputFiles(path.join(fixtures, "abonnement-netflix.txt"));
  await page.getByText("Informations repérées · à confirmer", { exact: true }).waitFor();
  await page.getByLabel("Service", { exact: true }).waitFor();
  if (await page.getByLabel("Service", { exact: true }).inputValue() !== "Netflix") throw new Error("Le service d'abonnement n'a pas été extrait.");
  await page.getByRole("button", { name: "Ajouter l'abonnement" }).click();
  await page.getByRole("heading", { name: "Netflix est suivi." }).waitFor();
  await closeCompletedFlow(page);
  await page.getByText("15,99 €", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Décider" }).click();
  await page.getByRole("button", { name: "Garder l'abonnement" }).click();
  await page.getByRole("heading", { name: "Netflix reste dans le foyer." }).waitFor();
  await closeCompletedFlow(page);

  await page.getByRole("button", { name: "Finances", exact: true }).click();
  await page.getByRole("button", { name: "Importer une facture" }).click();
  await page.getByLabel("Fichier à analyser").setInputFiles(path.join(fixtures, "facture-plombier.txt"));
  await page.getByText("Informations repérées · à confirmer", { exact: true }).waitFor();
  await page.getByLabel("Montant", { exact: true }).waitFor();
  if (await page.getByLabel("Montant", { exact: true }).inputValue() !== "87,5") throw new Error("Le montant de la facture n'a pas été extrait.");
  await page.getByRole("button", { name: "Confirmer la dépense" }).click();
  await page.getByRole("heading", { name: /est pris en compte/ }).waitFor();
  await closeCompletedFlow(page);
  await page.getByText("87,50 €", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Retrouver" }).click();
  await page.getByLabel("Rechercher un paiement").fill("plombier");
  await page.getByText("Importé depuis un document", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Terminer" }).click();
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

  const persisted = await page.evaluate(async ({ url, key: apiKey }) => {
    const authKey = Object.keys(localStorage).find((item) => item.endsWith("-auth-token"));
    if (!authKey) return [];
    const session = JSON.parse(localStorage.getItem(authKey) || "{}");
    const response = await fetch(`${url}/rest/v1/circle_records?select=id,kind,payload`, { headers: { apikey: apiKey, Authorization: `Bearer ${session.access_token}` } });
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  }, { url: supabaseURL, key: publishableKey });
  recordCount = persisted.length;
  uploadedPaths = [...new Set(persisted.map((record) => record.payload?.storagePath).filter(Boolean))];
  uploadedFileCount = uploadedPaths.length;

  const mobile = await browser.newContext({ viewport: { width: 402, height: 874 }, screen: { width: 402, height: 874 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, locale: "fr-FR" });
  const mobilePage = await mobile.newPage();
  bindErrors(mobilePage);
  await mobilePage.goto(baseURL, { waitUntil: "domcontentloaded" });
  await mobilePage.getByRole("button", { name: "J'ai déjà un compte" }).click();
  await mobilePage.getByLabel("Adresse e-mail").fill(email);
  await mobilePage.locator("#auth-password").fill(password);
  await mobilePage.getByRole("button", { name: "Entrer dans Circle" }).click();
  await mobilePage.getByRole("heading", { name: "Où voulez-vous entrer ?" }).waitFor();
  await auditMobileLayout(mobilePage, "sélection du foyer");
  await mobilePage.screenshot({ path: `${output}/mobile-households.png`, fullPage: false });
  await mobilePage.getByRole("button", { name: /Foyer test Circle/ }).click();
  await mobilePage.getByRole("heading", { name: "Foyer test Circle" }).waitFor();
  {
  const page = mobilePage;
  await page.getByRole("button", { name: "Personnes", exact: true }).click();
  await page.getByRole("button", { name: "Aujourd'hui", exact: true }).click();
  await page.getByRole("heading", { name: "Le prochain moment est clair." }).waitFor();
  await auditMobileLayout(page, "personnes aujourd'hui");
  await page.screenshot({ path: `${output}/mobile-people-today.png`, fullPage: false });
  await page.getByRole("button", { name: "Profils", exact: true }).click();
  await auditMobileLayout(page, "profils");
  await page.getByRole("heading", { name: "Enfant QA" }).waitFor();
  await page.screenshot({ path: `${output}/mobile-profile.png`, fullPage: false });
  await page.getByRole("button", { name: "Agenda", exact: true }).click();
  await page.getByText("Rendez-vous QA", { exact: true }).waitFor();
  await auditMobileLayout(page, "agenda");
  await page.screenshot({ path: `${output}/mobile-calendar.png`, fullPage: false });
  await page.getByRole("button", { name: "Entourage", exact: true }).click();
  await page.getByRole("heading", { name: "Votre entourage viendra à votre rythme." }).waitFor();
  await auditMobileLayout(page, "entourage");
  await page.screenshot({ path: `${output}/mobile-circle.png`, fullPage: false });

  await page.getByRole("button", { name: "Habitation", exact: true }).click();
  await page.getByRole("heading", { name: "La maison est prête." }).waitFor();
  await auditMobileLayout(page, "habitation contrats");
  await page.screenshot({ path: `${output}/mobile-home-contracts.png`, fullPage: false });
  await page.getByRole("button", { name: "Ajouter un document", exact: true }).first().click();
  await page.getByRole("heading", { name: "Ajouter un document" }).waitFor();
  await auditMobileLayout(page, "import document contrat");
  await page.screenshot({ path: `${output}/mobile-contract-document.png`, fullPage: false });
  await page.getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: "Équipements", exact: true }).click();
  await page.getByRole("heading", { name: "Tout ce qui fait la maison." }).waitFor();
  await auditMobileLayout(page, "habitation équipements");
  await page.screenshot({ path: `${output}/mobile-home-equipment.png`, fullPage: false });
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await page.getByRole("heading", { name: "La maison reste sereine." }).waitFor();
  await auditMobileLayout(page, "habitation maintenance");
  await page.screenshot({ path: `${output}/mobile-home-maintenance.png`, fullPage: false });
  await page.getByRole("button", { name: "Signaler un problème" }).first().click();
  await page.getByRole("heading", { name: "Signaler un problème" }).waitFor();
  await auditMobileLayout(page, "signalement maintenance");
  await page.screenshot({ path: `${output}/mobile-maintenance-report.png`, fullPage: false });
  await page.getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: "Améliorations", exact: true }).click();
  await page.getByRole("heading", { name: "Le confort avance." }).waitFor();
  await auditMobileLayout(page, "habitation améliorations");
  await page.screenshot({ path: `${output}/mobile-home-improvements.png`, fullPage: false });

  await page.getByRole("button", { name: "Abonnements", exact: true }).click();
  await page.getByRole("heading", { name: "Seulement l'utile." }).waitFor();
  await auditMobileLayout(page, "abonnements");
  await page.screenshot({ path: `${output}/mobile-subscriptions.png`, fullPage: false });
  await page.getByRole("button", { name: "Ajouter un abonnement" }).first().click();
  await page.getByRole("heading", { name: "Ajouter un abonnement" }).waitFor();
  await auditMobileLayout(page, "ajout abonnement");
  await page.screenshot({ path: `${output}/mobile-subscription-add.png`, fullPage: false });
  await page.getByRole("button", { name: "Annuler" }).click();

  await page.getByRole("button", { name: "Finances", exact: true }).click();
  await page.getByRole("heading", { name: "Ce mois-ci tient debout." }).waitFor();
  await auditMobileLayout(page, "finances");
  await page.screenshot({ path: `${output}/mobile-finance.png`, fullPage: true });
  await page.getByRole("button", { name: "Retrouver" }).click();
  await page.getByRole("heading", { name: "Retrouver un paiement" }).waitFor();
  await auditMobileLayout(page, "recherche paiement");
  await page.screenshot({ path: `${output}/mobile-payment-search.png`, fullPage: false });
  await page.getByRole("button", { name: "Terminer" }).click();
  }
  await mobile.close();
  await context.close();
} finally {
  await browser.close();
  if (uploadedPaths.length) await admin.storage.from("circle-documents").remove(uploadedPaths);
  for (const userId of createdUserIds) {
    const { data: ownedHouseholds } = await admin.from("circle_households").select("id").eq("owner_id", userId);
    for (const household of ownedHouseholds || []) {
      const folder = `${userId}/${household.id}`;
      const { data: files } = await admin.storage.from("circle-documents").list(folder, { limit: 1000 });
      if (files?.length) await admin.storage.from("circle-documents").remove(files.map((file) => `${folder}/${file.name}`));
    }
    await admin.auth.admin.deleteUser(userId);
  }
}

console.log(JSON.stringify({ baseURL, recordCount, uploadedFileCount, browserErrors: errors, screenshots: output }, null, 2));
if (recordCount < 10 || uploadedFileCount < 3 || errors.length) process.exitCode = 1;
