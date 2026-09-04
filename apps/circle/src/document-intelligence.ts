export type DocumentDomain = "contract" | "subscription" | "expense" | "school" | "equipment";

export interface DocumentExtraction {
  fileName: string;
  mimeType: string;
  title: string;
  provider: string;
  amount: number | null;
  dueDate: string;
  contractType: "bail" | "electricity" | "gas" | "water" | "insurance" | "other";
  confidence: "high" | "medium" | "review";
  textLength: number;
}

const monthNames: Record<string, string> = {
  janvier: "01", fevrier: "02", février: "02", mars: "03", avril: "04", mai: "05", juin: "06",
  juillet: "07", aout: "08", août: "08", septembre: "09", octobre: "10", novembre: "11", decembre: "12", décembre: "12",
};

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();
const titleFromFile = (name: string) => normalize(name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));

async function readPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let index = 1; index <= Math.min(document.numPages, 12); index += 1) {
    const page = await document.getPage(index);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
  }
  return pages.join(" ");
}

async function readDocumentText(file: File) {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) return readPdf(file);
  if (file.type.startsWith("text/") || /\.(txt|csv|json)$/i.test(file.name)) return file.text();
  return "";
}

function extractAmount(text: string) {
  const prioritized = text.match(/(?:total(?:\s+ttc)?|montant(?:\s+à\s+payer)?|mensualit[ée]|pr[ée]l[èe]vement|prix)[^\d]{0,45}(\d{1,5}(?:[ .]\d{3})*(?:[,.]\d{2})?)\s*(?:€|eur)/i);
  const fallback = text.match(/(\d{1,5}(?:[ .]\d{3})*(?:[,.]\d{2}))\s*(?:€|eur)/i);
  const raw = prioritized?.[1] || fallback?.[1];
  if (!raw) return null;
  const amount = Number(raw.replace(/[ .](?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  return Number.isFinite(amount) ? amount : null;
}

function extractDate(text: string) {
  const numeric = text.match(/(?:échéance|avant le|prélèvement|renouvellement|date)[^\d]{0,35}(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/i);
  if (numeric) return `${numeric[3]}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  const words = text.match(/(?:échéance|avant le|prélèvement|renouvellement|date)[^\d]{0,35}(\d{1,2})\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[uû]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})/i);
  if (!words) return "";
  const month = monthNames[words[2].toLowerCase()] || "";
  return month ? `${words[3]}-${month}-${words[1].padStart(2, "0")}` : "";
}

function detectContractType(text: string): DocumentExtraction["contractType"] {
  if (/bail|loyer|locataire|bailleur/i.test(text)) return "bail";
  if (/assurance habitation|multirisque habitation|franchise/i.test(text)) return "insurance";
  if (/électricit|electricit|kwh|enedis/i.test(text)) return "electricity";
  if (/gaz|grdf/i.test(text)) return "gas";
  if (/eau|m[³3]|compteur/i.test(text)) return "water";
  return "other";
}

function detectProvider(text: string) {
  const providers = ["EDF", "Engie", "happ-e", "TotalEnergies", "MAIF", "Matmut", "AXA", "Bouygues Telecom", "Orange", "Free", "SFR", "Netflix", "Spotify", "Disney+", "Canal+", "Métropole Rouen Normandie"];
  return providers.find((provider) => text.toLocaleLowerCase("fr").includes(provider.toLocaleLowerCase("fr"))) || "";
}

function detectTitle(domain: DocumentDomain, text: string, fileName: string, contractType: DocumentExtraction["contractType"]) {
  if (domain === "contract") return ({ bail: "Bail du logement", electricity: "Contrat d'électricité", gas: "Contrat de gaz", water: "Contrat d'eau", insurance: "Assurance habitation", other: "Contrat du logement" } as const)[contractType];
  if (domain === "subscription") return detectProvider(text) || titleFromFile(fileName) || "Abonnement";
  if (domain === "expense") return /facture/i.test(text) ? `Facture · ${detectProvider(text) || titleFromFile(fileName)}` : titleFromFile(fileName) || "Dépense";
  if (domain === "equipment") return titleFromFile(fileName) || "Document d'équipement";
  return /autorisation/i.test(text) ? "Autorisation scolaire" : titleFromFile(fileName) || "Document scolaire";
}

export async function analyzeDocument(file: File, domain: DocumentDomain): Promise<DocumentExtraction> {
  const content = normalize(await readDocumentText(file));
  const searchable = `${file.name} ${content}`;
  const contractType = detectContractType(searchable);
  const amount = extractAmount(content);
  const dueDate = extractDate(content);
  const provider = detectProvider(searchable);
  const extractedFields = [amount !== null, Boolean(dueDate), Boolean(provider), contractType !== "other"].filter(Boolean).length;
  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    title: detectTitle(domain, searchable, file.name, contractType),
    provider,
    amount,
    dueDate,
    contractType,
    confidence: content ? (extractedFields >= 3 ? "high" : "medium") : "review",
    textLength: content.length,
  };
}

export function formatDocumentAmount(amount: number | null) {
  return amount === null ? "À confirmer" : `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
