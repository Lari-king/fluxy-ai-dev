import { supabase } from "./supabase";

export interface SchoolDirectoryEntry {
  uai: string;
  name: string;
  kind: string;
  publicPrivate: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  hasCatering: boolean;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string;
}

export interface SchoolTariffBand {
  min: number;
  max: number | null;
  label: string;
  morning: number;
  lunch: number;
  evening: number;
  wednesdayHalfDay: number;
  wednesdayFullDay: number;
}

export interface CitySchoolGuide {
  city: string;
  portalName: string;
  portalUrl: string;
  informationUrl: string;
  wednesdayUrl: string;
  reservationRule: string;
  billingRule: string;
  services: string[];
  sourceLabel: string;
  defaults?: Record<string, string>;
  tariffBands?: SchoolTariffBand[];
}

export interface SchoolEnrichmentResult {
  mode: "gemini" | "official";
  values: Record<string, string>;
  sources: Array<{ label: string; url: string }>;
  notice: string;
}

const DIRECTORY_URL = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records";
const cleanSearchTerm = (value: string) => value.replace(/["\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export async function searchSchoolDirectory(city: string, schoolName: string): Promise<SchoolDirectoryEntry[]> {
  const cleanCity = cleanSearchTerm(city);
  const cleanName = cleanSearchTerm(schoolName);
  if (cleanCity.length < 2) throw new Error("Indiquez d'abord la ville de l'école.");

  const filters = [`search(nom_commune,"${cleanCity}")`];
  if (cleanName.length >= 2) filters.push(`search(nom_etablissement,"${cleanName}")`);
  const params = new URLSearchParams({ where: filters.join(" and "), limit: "12", order_by: "nom_etablissement" });
  const response = await fetch(`${DIRECTORY_URL}?${params.toString()}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("L'Annuaire de l'Éducation nationale ne répond pas pour le moment.");
  const body = await response.json() as { results?: Array<Record<string, unknown>> };
  return (body.results || []).map((row) => ({
    uai: String(row.identifiant_de_l_etablissement || ""),
    name: String(row.nom_etablissement || ""),
    kind: String(row.libelle_nature || row.type_etablissement || "Établissement scolaire"),
    publicPrivate: String(row.statut_public_prive || ""),
    address: [row.adresse_1, row.adresse_2, row.adresse_3].filter(Boolean).map(String).join(", "),
    postalCode: String(row.code_postal || ""),
    city: String(row.nom_commune || cleanCity),
    phone: String(row.telephone || ""),
    email: String(row.mail || ""),
    website: String(row.web || ""),
    hasCatering: Number(row.restauration || 0) === 1,
    latitude: typeof row.latitude === "number" ? row.latitude : null,
    longitude: typeof row.longitude === "number" ? row.longitude : null,
    updatedAt: String(row.date_maj_ligne || ""),
  }));
}

const rouenTariffBands: SchoolTariffBand[] = [
  { min: 0, max: 350, label: "Inférieur ou égal à 350", morning: 0.21, lunch: 0.36, evening: 0.70, wednesdayHalfDay: 1.44, wednesdayFullDay: 2.16 },
  { min: 351, max: 515, label: "351 - 515", morning: 0.30, lunch: 0.86, evening: 1.00, wednesdayHalfDay: 2.07, wednesdayFullDay: 2.43 },
  { min: 516, max: 625, label: "516 - 625", morning: 0.37, lunch: 1.94, evening: 1.22, wednesdayHalfDay: 4.86, wednesdayFullDay: 5.84 },
  { min: 626, max: 850, label: "626 - 850", morning: 0.44, lunch: 3.19, evening: 1.45, wednesdayHalfDay: 6.79, wednesdayFullDay: 7.19 },
  { min: 851, max: 1150, label: "851 - 1 150", morning: 0.48, lunch: 4.11, evening: 1.59, wednesdayHalfDay: 10.68, wednesdayFullDay: 13.14 },
  { min: 1151, max: 1600, label: "1 151 - 1 600", morning: 0.53, lunch: 4.68, evening: 1.79, wednesdayHalfDay: 11.87, wednesdayFullDay: 14.38 },
  { min: 1601, max: 2309, label: "1 601 - 2 309", morning: 0.59, lunch: 5.25, evening: 1.97, wednesdayHalfDay: 13.36, wednesdayFullDay: 16.23 },
  { min: 2310, max: null, label: "Plus de 2 309", morning: 0.64, lunch: 5.70, evening: 2.15, wednesdayHalfDay: 14.85, wednesdayFullDay: 18.27 },
];

const cityGuides: CitySchoolGuide[] = [
  {
    city: "rouen",
    portalName: "Portail Famille Rouen",
    portalUrl: "https://famille.rouen.fr",
    informationUrl: "https://rouen.fr/accueil-periscolaire",
    wednesdayUrl: "https://rouen.fr/accueil-mercredi",
    reservationRule: "Ajouter ou retirer un jour au plus tard 2 jours avant ; sans réservation, le tarif est majoré de 20 %.",
    billingRule: "Facture à mois échu avec la cantine et les accueils ; tarif maximal tant que le quotient n'est pas renseigné.",
    services: ["Accueil du matin", "Accueil du midi", "Accueil du soir", "Mercredi", "Vacances scolaires"],
    sourceLabel: "Ville de Rouen · accueils périscolaires 2026",
    defaults: {
      morningStart: "07:45",
      startTime: "08:20",
      lunchTime: "12:00",
      endTime: "16:30",
      eveningStart: "16:30",
      pickupWindow: "Accueil du soir jusqu'à 18:00",
      wednesdayArrival: "08:00",
      wednesdayDeparture: "18:00",
      residentStatus: "rouen",
      tariffStatus: "maximum",
      tariffSource: "Ville de Rouen · grille applicable à compter du 1er février 2026",
    },
    tariffBands: rouenTariffBands,
  },
  {
    city: "paris",
    portalName: "Paris Familles",
    portalUrl: "https://www.paris.fr/pages/paris-familles-27902",
    informationUrl: "https://www.paris.fr/pages/activites-a-l-ecole-2073",
    wednesdayUrl: "https://www.paris.fr/pages/activites-a-l-ecole-2073",
    reservationRule: "Les inscriptions passent par Paris Familles selon les périodes et activités ouvertes.",
    billingRule: "Tarification par tranche et quotient familial ; la restauration dépend parfois de la caisse des écoles.",
    services: ["Restauration", "Goûter ou étude", "Centre de loisirs du mercredi", "Vacances scolaires"],
    sourceLabel: "Ville de Paris · activités à l'école",
  },
];

const normalizeCity = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function citySchoolGuide(city: string): CitySchoolGuide | null {
  const normalized = normalizeCity(city);
  return cityGuides.find((guide) => normalized === guide.city || normalized.startsWith(`${guide.city} `)) || null;
}

export function schoolTariffValues(city: string, quotient?: string): Record<string, string> {
  const guide = citySchoolGuide(city);
  if (!guide?.tariffBands?.length) return {};
  const parsed = Number(String(quotient || "").replace(/\s/g, "").replace(",", "."));
  const hasQuotient = Number.isFinite(parsed) && parsed >= 0 && String(quotient || "").trim() !== "";
  const band = hasQuotient
    ? guide.tariffBands.find((candidate) => parsed >= candidate.min && (candidate.max === null || parsed <= candidate.max)) || guide.tariffBands.at(-1)!
    : guide.tariffBands.at(-1)!;
  return {
    quotientBand: hasQuotient ? band.label : `${band.label} · tarif maximal provisoire`,
    tariffStatus: hasQuotient ? "quotient" : "maximum",
    morningRate: band.morning.toFixed(2),
    lunchRate: band.lunch.toFixed(2),
    eveningRate: band.evening.toFixed(2),
    wednesdayHalfDayRate: band.wednesdayHalfDay.toFixed(2),
    wednesdayRate: band.wednesdayFullDay.toFixed(2),
  };
}

export function officialSchoolEnrichment(school: SchoolDirectoryEntry, quotient = ""): SchoolEnrichmentResult {
  const guide = citySchoolGuide(school.city);
  const values = {
    ...(guide?.defaults || {}),
    ...schoolTariffValues(school.city, quotient),
    portalName: guide?.portalName || "",
    portalUrl: guide?.portalUrl || "",
    informationUrl: guide?.informationUrl || "",
    wednesdayUrl: guide?.wednesdayUrl || "",
    reservationRule: guide?.reservationRule || "",
    billingRule: guide?.billingRule || "",
  };
  return {
    mode: "official",
    values,
    sources: [
      { label: SCHOOL_DIRECTORY_SOURCE, url: SCHOOL_DIRECTORY_URL },
      ...(guide ? [{ label: guide.sourceLabel, url: guide.informationUrl }, { label: "Ville de Rouen · accueil du mercredi", url: guide.wednesdayUrl }] : []),
    ],
    notice: guide ? "Les règles municipales connues ont été proposées automatiquement." : "L'établissement est identifié ; les règles locales restent à confirmer.",
  };
}

export async function enrichSchoolWithAgent(school: SchoolDirectoryEntry, quotient = ""): Promise<SchoolEnrichmentResult> {
  const fallback = officialSchoolEnrichment(school, quotient);
  try {
    const { data, error } = await supabase.functions.invoke("school-enrichment-agent", { body: { school, quotient } });
    if (error || !data?.values) return fallback;
    return {
      mode: data.mode === "gemini" ? "gemini" : "official",
      values: { ...fallback.values, ...data.values },
      sources: Array.isArray(data.sources) && data.sources.length ? data.sources : fallback.sources,
      notice: String(data.notice || fallback.notice),
    };
  } catch {
    return fallback;
  }
}

export const SCHOOL_DIRECTORY_SOURCE = "Annuaire de l'Éducation nationale · données ouvertes";
export const SCHOOL_DIRECTORY_URL = "https://data.education.gouv.fr/explore/dataset/fr-en-annuaire-education/";
