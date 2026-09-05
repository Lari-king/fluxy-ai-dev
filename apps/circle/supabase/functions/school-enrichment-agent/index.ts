import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const responseSchema = {
  type: "object",
  properties: {
    values: {
      type: "object",
      properties: {
        morningStart: { type: "string" },
        startTime: { type: "string" },
        lunchTime: { type: "string" },
        endTime: { type: "string" },
        eveningStart: { type: "string" },
        firstPickup: { type: "string" },
        pickupWindow: { type: "string" },
        wednesdayArrival: { type: "string" },
        wednesdayDeparture: { type: "string" },
        portalName: { type: "string" },
        portalUrl: { type: "string" },
        informationUrl: { type: "string" },
        wednesdayUrl: { type: "string" },
        reservationRule: { type: "string" },
        billingRule: { type: "string" },
        afterSchoolContact: { type: "string" },
        entrance: { type: "string" },
      },
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        properties: { label: { type: "string" }, url: { type: "string" } },
        required: ["label", "url"],
      },
    },
    notice: { type: "string" },
  },
  required: ["values", "sources", "notice"],
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const outputText = (payload: Record<string, unknown>) => {
  if (typeof payload.output_text === "string") return payload.output_text;
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  for (const step of steps) {
    if (!step || typeof step !== "object" || (step as { type?: string }).type !== "model_output") continue;
    const content = (step as { content?: unknown[] }).content || [];
    const text = content.find((item) => item && typeof item === "object" && (item as { type?: string }).type === "text") as { text?: string } | undefined;
    if (text?.text) return text.text;
  }
  return "";
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return json({
      mode: "official",
      values: {},
      sources: [],
      notice: "Circle a appliqué les sources officielles déjà vérifiées pour cette ville.",
    });
  }

  try {
    const body = await request.json() as { school?: Record<string, unknown>; quotient?: string };
    const school = body.school || {};
    const prompt = `Tu aides une famille à préremplir une fiche scolaire sans inventer de données.

Établissement déjà identifié dans l'annuaire national :
${JSON.stringify({ name: school.name, city: school.city, address: school.address, postalCode: school.postalCode, uai: school.uai, website: school.website })}

Recherche uniquement les pages officielles de la commune, de l'Éducation nationale et de l'établissement. Trouve les horaires réellement utiles aux parents, le portail famille, les règles de réservation et de facturation, l'accueil du mercredi et les contacts publics. Retourne une chaîne vide lorsqu'une information n'est pas explicitement publiée. N'invente jamais le nom d'un enseignant, d'une ATSEM ou d'un référent. Les heures doivent être au format HH:MM. Les sources doivent pointer vers les pages officielles exactes. Le parent validera ensuite la proposition.`;

    const gemini = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        model: Deno.env.get("GEMINI_MODEL") || "gemini-3.8-flash",
        input: prompt,
        tools: [{ type: "google_search" }, { type: "url_context" }],
        response_format: { type: "text", mime_type: "application/json", schema: responseSchema },
      }),
    });
    if (!gemini.ok) throw new Error(`Gemini ${gemini.status}`);
    const payload = await gemini.json() as Record<string, unknown>;
    const parsed = JSON.parse(outputText(payload)) as { values?: Record<string, string>; sources?: Array<{ label: string; url: string }>; notice?: string };
    return json({
      mode: "gemini",
      values: parsed.values || {},
      sources: (parsed.sources || []).filter((source) => /^https:\/\//.test(source.url)),
      notice: parsed.notice || "Circle a préparé une proposition sourcée à valider.",
    });
  } catch (error) {
    console.error("school-enrichment-agent", error);
    return json({
      mode: "official",
      values: {},
      sources: [],
      notice: "La recherche IA n'a pas abouti ; les règles officielles connues restent disponibles.",
    });
  }
});
