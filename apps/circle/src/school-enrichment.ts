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

export interface CitySchoolGuide {
  city: string;
  portalName: string;
  portalUrl: string;
  informationUrl: string;
  reservationRule: string;
  billingRule: string;
  services: string[];
  sourceLabel: string;
}

const DIRECTORY_URL = "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records";

const cleanSearchTerm = (value: string) => value.replace(/["\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export async function searchSchoolDirectory(city: string, schoolName: string): Promise<SchoolDirectoryEntry[]> {
  const cleanCity = cleanSearchTerm(city);
  const cleanName = cleanSearchTerm(schoolName);
  if (cleanCity.length < 2) throw new Error("Indiquez d'abord la ville de l'école.");

  const filters = [`search(nom_commune,\"${cleanCity}\")`];
  if (cleanName.length >= 2) filters.push(`search(nom_etablissement,\"${cleanName}\")`);
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

const cityGuides: CitySchoolGuide[] = [
  {
    city: "rouen",
    portalName: "Portail Famille Rouen",
    portalUrl: "https://famille.rouen.fr",
    informationUrl: "https://rouen.fr/accueil-periscolaire",
    reservationRule: "Ajouter ou retirer un jour au plus tard 2 jours avant ; une présence non réservée peut être majorée.",
    billingRule: "Facture vers le 15 du mois suivant, selon le quotient familial.",
    services: ["Accueil du matin", "Accueil du midi", "Accueil du soir", "Mercredi", "Vacances scolaires"],
    sourceLabel: "Ville de Rouen · accueil périscolaire",
  },
  {
    city: "paris",
    portalName: "Paris Familles",
    portalUrl: "https://www.paris.fr/pages/paris-familles-27902",
    informationUrl: "https://www.paris.fr/pages/activites-a-l-ecole-2073",
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

export const SCHOOL_DIRECTORY_SOURCE = "Annuaire de l'Éducation nationale · données ouvertes";
export const SCHOOL_DIRECTORY_URL = "https://data.education.gouv.fr/explore/dataset/fr-en-annuaire-education/";
