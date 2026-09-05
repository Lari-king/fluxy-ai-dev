import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import {
  AlarmClock, ArrowLeft, Bell, Bolt, BriefcaseBusiness, CalendarClock, CalendarDays, Camera, Car, Check,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, CreditCard, Dog, ExternalLink, FileCheck2, FileText,
  Droplets, Flame, Gauge, HandHeart, HeartPulse, Home, House, Info, KeyRound, Leaf, Lightbulb, ListChecks, LockKeyhole, Mail,
  MapPin, MapPinned, Menu, MessageCircle, MoreHorizontal, MoonStar, Navigation, NotebookTabs, PackageCheck, PawPrint, Pencil, Phone, Plus,
  Paperclip, ReceiptText, Repeat2, School, Search, Settings, ShieldCheck, Sparkles, Stethoscope,
  LoaderCircle, LogOut, Send, SunMedium, Trees, Trash2, Upload, UserCheck, UserRound, UsersRound, UtensilsCrossed, WalletCards, WandSparkles,
  Wifi, Wrench, X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./styles.css";
import { AuthScreen } from "./auth";
import { CircleDataProvider, useCircleData } from "./circle-data";
import type { CircleHousehold, CircleRecord } from "./circle-data";
import { analyzeDocument, formatDocumentAmount } from "./document-intelligence";
import type { DocumentDomain, DocumentExtraction } from "./document-intelligence";
import { supabase } from "./supabase";
import { citySchoolGuide, enrichSchoolWithAgent, SCHOOL_DIRECTORY_SOURCE, SCHOOL_DIRECTORY_URL, schoolTariffValues, searchSchoolDirectory } from "./school-enrichment";
import type { SchoolDirectoryEntry } from "./school-enrichment";

type Tab = "people" | "home" | "subscriptions" | "finance";
type Screen = "landing" | "households" | "household";
type HomeMode = "contracts" | "equipment" | "maintenance" | "improvements";
type PeopleMode = "today" | "profiles" | "calendar" | "circle";
type Person = "mother" | "daughter" | "dog";
type ProfileMode = "overview" | "school" | "health" | "organization";
type CircleMode = "needs" | "people" | "availability" | "services";
type Overlay = "notifications" | "create" | "help" | "onboarding" | "handoff" | "document" | "contract-document" | "add-contract" | "report-issue" | "plan-care" | "equipment-detail" | "add-equipment" | "improvement-flow" | "allocation-flow" | "subscription-detail" | "add-subscription" | "expense-document" | "payment-search" | "school-booking" | "menu" | "holiday" | "need" | "helper-space" | "availability" | "visit-request" | "propose-time" | "circle-map" | null;

const qaParams = new URLSearchParams(window.location.search);
const qaScreen = qaParams.get("qa");
const qaTab = qaParams.get("tab");
const qaHomeMode = qaParams.get("home");
const qaPeopleMode = qaParams.get("people");
const qaPerson = qaParams.get("person");
const qaProfileMode = qaParams.get("profile");
const qaOverlay = qaParams.get("overlay");
const initialScreen: Screen = qaScreen === "household" || qaScreen === "households" ? qaScreen : "landing";
const initialTab: Tab = qaTab === "home" || qaTab === "subscriptions" || qaTab === "finance" ? qaTab : "people";
const initialHomeMode: HomeMode = qaHomeMode === "equipment" || qaHomeMode === "maintenance" || qaHomeMode === "improvements" ? qaHomeMode : "contracts";
const initialPeopleMode: PeopleMode = qaPeopleMode === "profiles" || qaPeopleMode === "calendar" || qaPeopleMode === "circle" ? qaPeopleMode : "today";
const initialPerson: Person = qaPerson === "mother" || qaPerson === "dog" ? qaPerson : "daughter";
const initialProfileMode: ProfileMode = qaProfileMode === "school" || qaProfileMode === "health" || qaProfileMode === "organization" ? qaProfileMode : "overview";
const initialOverlay: Overlay = qaOverlay === "school-booking" ? "school-booking" : null;

const navItems: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "people", label: "Personnes", icon: UsersRound },
  { id: "home", label: "Habitation", icon: Home },
  { id: "subscriptions", label: "Abonnements", icon: CreditCard },
  { id: "finance", label: "Finances", icon: WalletCards },
];

const Avatar = ({ person, size = "small" }: { person: Person; size?: "tiny" | "small" | "large" }) =>
  <span className={`avatar avatar--${person} avatar--${size}`} aria-hidden="true" />;

type CirclePersonType = "adult" | "child" | "pet";
type CirclePersonScope = "household" | "trusted";

const personType = (record: CircleRecord): CirclePersonType => record.payload.personType === "child" || record.payload.personType === "pet" ? record.payload.personType : "adult";
const personScope = (record: CircleRecord): CirclePersonScope => record.payload.scope === "trusted" ? "trusted" : "household";
const personRelation = (record: CircleRecord) => String(record.payload.relation || (personType(record) === "pet" ? "Animal du foyer" : "Membre du foyer"));
const personGenderLabel = (record: CircleRecord) => ({ female: personType(record) === "pet" ? "Femelle" : "Féminin", male: personType(record) === "pet" ? "Mâle" : "Masculin", neutral: "Neutre", unspecified: "Non précisé" }[String(record.payload.gender || "unspecified")] || "Non précisé");
const personInitials = (record: CircleRecord) => record.title.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
const personAvatarPreset = (record: CircleRecord): Person => personType(record) === "child" ? "daughter" : personType(record) === "pet" ? "dog" : "mother";
const sortHouseholdPeople = (people: CircleRecord[]) => [...people].sort((left, right) => {
  const rank = (record: CircleRecord) => {
    if (record.payload.accountLinked) return 0;
    if (personType(record) === "adult" && /parent|papa|maman|père|mère/i.test(personRelation(record))) return 1;
    if (personType(record) === "adult") return 2;
    return personType(record) === "child" ? 3 : 4;
  };
  return rank(left) - rank(right) || String(left.created_at).localeCompare(String(right.created_at));
});

function StoredAvatar({ path, label, size }: { path: string; label: string; size: "tiny" | "small" | "large" }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    let alive = true;
    void supabase.storage.from("circle-documents").createSignedUrl(path, 3600).then(({ data }) => {
      if (alive) setSource(data?.signedUrl || "");
    });
    return () => { alive = false; };
  }, [path]);
  return source
    ? <img className={`record-photo record-photo--${size}`} src={source} alt={`Portrait de ${label}`} />
    : <span className={`record-initial record-initial--${size}`} aria-hidden="true">{label.slice(0, 1).toUpperCase()}</span>;
}

const RecordAvatar = ({ record, size = "small" }: { record: CircleRecord; size?: "tiny" | "small" | "large" }) => {
  const imagePath = String(record.payload.avatarPath || "");
  if (imagePath) return <StoredAvatar path={imagePath} label={record.title} size={size} />;
  if (typeof record.payload.avatarPreset === "number") return <span className={`avatar-preset avatar-preset--${record.payload.avatarPreset} avatar-preset--${size}`} aria-hidden="true" />;
  if (personType(record) === "pet") return <Avatar person="dog" size={size} />;
  return personScope(record) === "trusted"
    ? <span className={`record-initial record-initial--${size}`} aria-hidden="true">{personInitials(record)}</span>
    : <Avatar person={personAvatarPreset(record)} size={size} />;
};
const eventDate = (record: CircleRecord) => record.starts_at ? new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(record.starts_at)) : "Date à préciser";

const IconButton = ({ label, children, onClick, badge }: { label: string; children: React.ReactNode; onClick?: () => void; badge?: string }) =>
  <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>{children}{badge && <i>{badge}</i>}</button>;

function Brand({ onClick }: { onClick?: () => void }) {
  return <button className="brand" type="button" onClick={onClick}><img src="/art/circle-logo-mark-v1.png" alt="" /><span>Circle</span></button>;
}

function AppHeader({ active, onTab, onOverlay, onHouseholds, onHome }: { active: Tab; onTab: (tab: Tab) => void; onOverlay: (overlay: Overlay) => void; onHouseholds: () => void; onHome: () => void }) {
  const { activeHousehold, profileName, syncing, records } = useCircleData();
  const initials = profileName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const people = records.filter((record) => record.kind === "person");
  const members = sortHouseholdPeople(people.filter((record) => personScope(record) === "household"));
  const trusted = people.filter((record) => personScope(record) === "trusted");
  const upcoming = records.filter((record) => record.kind === "event" && record.starts_at && new Date(record.starts_at).getTime() >= Date.now()).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)))[0];
  const attentionCount = records.filter((record) => record.status === "pending" || record.status === "action_required").length;
  return <>
    <header className="global-bar">
      <Brand onClick={onHome} />
      <button className="household-switch" type="button" onClick={onHouseholds} aria-label="Changer de foyer" title="Changer de foyer"><House size={16} /><span>Changer de foyer</span><ChevronRight size={15} /></button>
      <div className="global-actions">
        {syncing && <span className="sync-state"><LoaderCircle className="spin" size={15} /> Enregistrement</span>}
        <IconButton label="Centre de notifications" badge={attentionCount ? String(attentionCount) : undefined} onClick={() => onOverlay("notifications")}><Bell size={19} /></IconButton>
        <button className="account-icon" type="button" aria-label="Mon compte" title="Mon compte" onClick={() => onOverlay("menu")}>{initials}</button>
      </div>
    </header>
    <section className="household-cover">
      <div className="household-cover__copy">
        <span className="eyebrow"><i className="live-dot" /> Circle familial</span>
        <h1>{activeHousehold?.name || "Mon Circle"}</h1>
        <p><MapPin size={15} /> {activeHousehold?.city || "Lieu à préciser"}</p>
        <div className="cover-circles">
          <span><small>Foyer</small><i>{members.length ? members.slice(0, 5).map((record) => <RecordAvatar key={record.id} record={record} size="tiny" />) : <em>Aucun membre</em>}</i></span>
          {trusted.length > 0 && <span><small>Entourage</small><i>{trusted.slice(0, 5).map((record) => <RecordAvatar key={record.id} record={record} size="tiny" />)}</i></span>}
        </div>
      </div>
      {upcoming ? <button className="cover-next" type="button" onClick={() => onTab("people")}><span><small>À venir · {eventDate(upcoming)}</small><strong>{upcoming.title}</strong><em>{String(upcoming.payload.location || "Agenda du foyer")}</em></span><ChevronRight size={20} /></button> : <div className="cover-next cover-next--empty"><span><small>À venir</small><strong>Rien n'est prévu.</strong><em>Le foyer commence avec une page claire.</em></span></div>}
      <img className="household-cover__art" src="/art/circle-trusted-ring-v1.png" alt="Le foyer et son cercle de proches" />
    </section>
    <nav className="main-tabs" aria-label="Espaces de Circle">
      {navItems.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} type="button" aria-label={label} onClick={() => onTab(id)}><Icon size={19} /><span>{label}</span></button>)}
    </nav>
  </>;
}

const stageContent: Record<Tab, { eyebrow: string; title: string; note: string; art: string; action: string; icon: React.ReactNode }> = {
  people: { eyebrow: "Aujourd'hui", title: "La famille, bien entourée.", note: "Une seule chose à préparer avant vendredi.", art: "/art/circle-school-life-v1.png", action: "Voir ce qui compte", icon: <ListChecks size={18} /> },
  home: { eyebrow: "Habitation", title: "La maison est prête.", note: "Contrats et entretien, au même endroit.", art: "/art/luce-household-paper-home-v1.png", action: "Signaler quelque chose", icon: <Wrench size={18} /> },
  subscriptions: { eyebrow: "Abonnements", title: "Tout est bien rangé.", note: "Les services du quotidien, sans surprise.", art: "/art/circle-subscriptions-v1.png", action: "Ajouter un abonnement", icon: <Plus size={18} /> },
  finance: { eyebrow: "Finances", title: "Ce mois-ci tient debout.", note: "Les charges sont réparties. Trois échéances approchent.", art: "/art/circle-finances-v1.png", action: "Voir les échéances", icon: <CalendarDays size={18} /> },
};

function ContextStage({ tab, onAction }: { tab: Tab; onAction: () => void }) {
  const data = stageContent[tab];
  return <section className={`context-stage context-stage--${tab}`}>
    <div className="context-stage__copy"><span className="eyebrow">{data.eyebrow}</span><h2>{data.title}</h2><p>{data.note}</p><button className="primary-button" type="button" onClick={onAction}>{data.icon}{data.action}</button></div>
    <div className="context-stage__art"><img src={data.art} alt="" /></div>
  </section>;
}

function PeopleView({ onOverlay }: { onOverlay: (overlay: Overlay) => void }) {
  const [mode, setMode] = useState<PeopleMode>(initialPeopleMode);
  const { records } = useCircleData();
  const people = records.filter((record) => record.kind === "person");
  const householdPeople = sortHouseholdPeople(people.filter((record) => personScope(record) === "household"));
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [flow, setFlow] = useState<{ kind: "menu" | "person" | "event" | "routine" | "profile-details" | "school-booking" | "school-cost" | "school-memory" | "school-document" | "school-document-detail" | "school-holiday" | "school-help"; scope?: CirclePersonScope; record?: CircleRecord; targetRecord?: CircleRecord; personId?: string; section?: ProfileMode } | null>(null);
  useEffect(() => {
    if (!selectedPersonId || !householdPeople.some((record) => record.id === selectedPersonId)) setSelectedPersonId(householdPeople[0]?.id || null);
  }, [householdPeople.map((record) => record.id).join("|"), selectedPersonId]);
  return <main className="view">
    <SectionToolbar mode={mode} onMode={setMode} onCreate={() => setFlow({ kind: "menu" })} />
    {mode === "today" && <PeopleToday records={records} people={householdPeople} onAddPerson={() => setFlow({ kind: "person", scope: "household" })} onAddEvent={() => setFlow({ kind: "event" })} onCalendar={() => setMode("calendar")} />}
    {mode === "profiles" && <PeopleProfiles records={records} people={householdPeople} selectedId={selectedPersonId} onSelect={setSelectedPersonId} onAdd={() => setFlow({ kind: "person", scope: "household" })} onEdit={(record) => setFlow({ kind: "person", scope: "household", record })} onConfigure={(record, section) => setFlow({ kind: "profile-details", record, section })} onEvent={(personId) => setFlow({ kind: "event", personId })} onRoutine={(personId) => setFlow({ kind: "routine", personId })} onSchoolBooking={(record) => setFlow({ kind: "school-booking", record })} onSchoolCost={(record) => setFlow({ kind: "school-cost", record })} onSchoolMemory={(record) => setFlow({ kind: "school-memory", record })} onSchoolDocument={(record) => setFlow({ kind: "school-document", record })} onSchoolDocumentDetail={(record, targetRecord) => setFlow({ kind: "school-document-detail", record, targetRecord })} onSchoolHoliday={(record) => setFlow({ kind: "school-holiday", record })} onSchoolHelp={(record) => setFlow({ kind: "school-help", record })} />}
    {mode === "calendar" && <PeopleCalendar records={records} people={householdPeople} onAdd={() => setFlow({ kind: "event" })} />}
    {mode === "circle" && <PeopleTrustedCircle people={people.filter((record) => personScope(record) === "trusted")} onAdd={() => setFlow({ kind: "person", scope: "trusted" })} onEdit={(record) => setFlow({ kind: "person", scope: "trusted", record })} />}
    {flow?.kind === "menu" && <PeopleCreateMenu onClose={() => setFlow(null)} onPerson={() => setFlow({ kind: "person", scope: "household" })} onEvent={() => setFlow({ kind: "event" })} onRoutine={() => setFlow({ kind: "routine" })} onTrusted={() => setFlow({ kind: "person", scope: "trusted" })} />}
    {flow?.kind === "person" && <PersonFlow scope={flow.scope || "household"} record={flow.record} onClose={() => setFlow(null)} />}
    {flow?.kind === "event" && <EventFlow people={householdPeople} initialPersonId={flow.personId} onClose={() => setFlow(null)} />}
    {flow?.kind === "routine" && <RoutineFlow people={householdPeople} initialPersonId={flow.personId} onClose={() => setFlow(null)} />}
    {flow?.kind === "profile-details" && flow.record && <ProfileDetailsFlow record={flow.record} section={flow.section || "overview"} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-booking" && flow.record && <ProfileSchoolBookingFlow child={flow.record} records={records} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-cost" && flow.record && <ProfileSchoolCostFlow child={flow.record} records={records} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-memory" && flow.record && <ProfileSchoolMemoryFlow child={flow.record} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-document" && flow.record && <ProfileSchoolDocumentFlow child={flow.record} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-document-detail" && flow.record && flow.targetRecord && <ProfileSchoolDocumentDetailFlow child={flow.record} document={flow.targetRecord} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-holiday" && flow.record && <ProfileSchoolHolidayFlow child={flow.record} records={records} onClose={() => setFlow(null)} />}
    {flow?.kind === "school-help" && flow.record && <ProfileSchoolHelpFlow child={flow.record} onClose={() => setFlow(null)} />}
  </main>;
}

function SectionToolbar({ mode, onMode, onCreate }: { mode: PeopleMode; onMode: (mode: PeopleMode) => void; onCreate: () => void }) {
  const items: Array<[PeopleMode, string, React.ReactNode]> = [["today", "Aujourd'hui", <SunMedium size={17} />], ["profiles", "Profils", <UsersRound size={17} />], ["calendar", "Agenda", <CalendarDays size={17} />], ["circle", "Entourage", <CircleHelp size={17} />]];
  return <div className="section-toolbar"><div className="segmented">{items.map(([id, label, icon]) => <button key={id} className={mode === id ? "active" : ""} type="button" aria-label={label} title={label} onClick={() => onMode(id)}>{icon}<span>{label}</span></button>)}</div><button className="secondary-button" type="button" aria-label="Créer" title="Créer" onClick={onCreate}><Plus size={18} /> Créer</button></div>;
}

function PeopleEmpty({ title, text, action, onAction, art }: { title: string; text: string; action: string; onAction: () => void; art: string }) {
  return <section className="people-empty"><div><span className="eyebrow">Votre Circle commence ici</span><h2>{title}</h2><p>{text}</p><button className="primary-button primary-button--forest" type="button" onClick={onAction}><Plus size={18} /> {action}</button></div><img src={art} alt="" /></section>;
}

function PeopleToday({ records, people, onAddPerson, onAddEvent, onCalendar }: { records: CircleRecord[]; people: CircleRecord[]; onAddPerson: () => void; onAddEvent: () => void; onCalendar: () => void }) {
  const upcoming = records.filter((record) => record.kind === "event" && record.starts_at && new Date(record.starts_at).getTime() >= Date.now()).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  const routines = records.filter((record) => record.kind === "routine");
  if (!people.length) return <PeopleEmpty title="Qui fait partie de ce foyer ?" text="Ajoutez d'abord les personnes qui vivent ici. Circle restera vide tant que vous ne lui confiez rien." action="Ajouter une première personne" onAction={onAddPerson} art="/art/circle-school-life-v1.png" />;
  return <>
    <section className="people-today-hero"><div><span className="eyebrow"><Check size={15} /> Aujourd'hui</span><h2>{upcoming.length ? "Le prochain moment est clair." : "Rien ne réclame votre attention."}</h2><p>{upcoming.length ? `${upcoming[0].title} · ${eventDate(upcoming[0])}` : "Ajoutez seulement ce qui mérite d'être partagé."}</p><div><button className="primary-button" type="button" onClick={upcoming.length ? onCalendar : onAddEvent}>{upcoming.length ? <CalendarDays size={18} /> : <Plus size={18} />}{upcoming.length ? "Voir l'agenda" : "Prévoir quelque chose"}</button></div></div><img src="/art/circle-school-life-v1.png" alt="" /></section>
    <section className="people-live-grid"><article><header><span><CalendarDays size={18} /></span><div><small>À venir</small><h3>{upcoming.length ? `${upcoming.length} moment${upcoming.length > 1 ? "s" : ""}` : "Agenda libre"}</h3></div></header>{upcoming.slice(0, 3).map((record) => <button type="button" key={record.id} onClick={onCalendar}><span><b>{record.title}</b><small>{eventDate(record)}</small></span><ChevronRight size={16} /></button>)}{!upcoming.length && <p>Aucun rendez-vous ou relais prévu.</p>}</article><article><header><span><Repeat2 size={18} /></span><div><small>Repères</small><h3>{routines.length ? `${routines.length} routine${routines.length > 1 ? "s" : ""}` : "Aucune routine"}</h3></div></header>{routines.slice(0, 3).map((record) => <div className="people-static-row" key={record.id}><span><b>{record.title}</b><small>{String(record.payload.recurrence || "Récurrence à préciser")}</small></span></div>)}{!routines.length && <p>Le quotidien reste léger : rien n'est imposé.</p>}</article></section>
  </>;
}

const profileSection = (record: CircleRecord, section: "school" | "health" | "organization") => {
  const value = record.payload[section];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
};

function ProfileFact({ label, value }: { label: string; value: unknown }) {
  return <div className="profile-fact"><small>{label}</small><b>{value ? String(value) : "À renseigner"}</b></div>;
}

function ProfileDomain({ record, section, onConfigure, onEvent }: { record: CircleRecord; section: Exclude<ProfileMode, "overview">; onConfigure: () => void; onEvent: () => void }) {
  const data = profileSection(record, section);
  const configured = Object.values(data).some((value) => String(value || "").trim());
  const child = personType(record) === "child";
  const pet = personType(record) === "pet";
  const content = section === "school"
    ? { eyebrow: "École", title: configured ? String(data.schoolName || "Sa scolarité") : "Préparer sa vie d'école.", note: "Établissement, horaires et accueils utiles, sans recopier tout le portail scolaire.", art: "/art/luce-household-access-v1.png" }
    : section === "health"
      ? { eyebrow: pet ? "Santé animale" : "Santé", title: configured ? String(data.practitioner || "Ses repères de santé") : "Les informations utiles, au bon moment.", note: "Traitements, allergies et contacts restent attachés à ce profil.", art: "/art/luce-child-health-v1.png" }
      : { eyebrow: "Organisation", title: configured ? String(data.custodyMode || data.primaryHome || "Son organisation") : "Rendre les relais plus simples.", note: "Lieux de vie, garde et personnes autorisées restent clairs pour les adultes concernés.", art: "/art/luce-shared-custody-v1.png" };
  return <section className={`profile-domain profile-domain--${section}`}>
    <div className="profile-domain__hero"><div><span className="eyebrow">{content.eyebrow}</span><h2>{content.title}</h2><p>{content.note}</p><button className="primary-button primary-button--forest" type="button" onClick={onConfigure}><Pencil size={17} /> {configured ? "Modifier les informations" : "Renseigner"}</button></div><img src={content.art} alt="" /></div>
    {section === "school" && <div className="profile-facts"><ProfileFact label="Établissement" value={data.schoolName} /><ProfileFact label="Classe" value={data.level} /><ProfileFact label="Horaires" value={data.startTime && data.endTime ? `${data.startTime} – ${data.endTime}` : ""} /><ProfileFact label="Périscolaire" value={[data.morningCare, data.eveningCare, data.wednesdayCare].filter(Boolean).join(" · ")} /><ProfileFact label="Référent" value={data.teacher} /><ProfileFact label="Personnes autorisées" value={data.authorizedPeople} /></div>}
    {section === "health" && <><div className="profile-facts"><ProfileFact label={pet ? "Vétérinaire" : "Médecin ou pédiatre"} value={data.practitioner} /><ProfileFact label="Allergies" value={data.allergies || "Aucune indiquée"} /><ProfileFact label="Traitement" value={data.medications || "Aucun indiqué"} /><ProfileFact label="En cas de besoin" value={data.emergencyContact} /></div><div className="profile-domain__action"><span><HeartPulse size={19} /><span><b>Un rendez-vous à prévoir ?</b><small>Il apparaîtra aussi dans l'agenda familial.</small></span></span><button className="secondary-button" type="button" onClick={onEvent}><CalendarDays size={17} /> Ajouter un rendez-vous</button></div></>}
    {section === "organization" && <div className="profile-facts"><ProfileFact label={child ? "Mode de garde" : "Organisation"} value={data.custodyMode} /><ProfileFact label="Lieu principal" value={data.primaryHome} /><ProfileFact label="Prochain relais" value={data.handoff} /><ProfileFact label="Personnes autorisées" value={data.authorizedPeople} /><ProfileFact label="Consigne à partager" value={data.instructions} /><ProfileFact label="Note" value={data.notes} /></div>}
  </section>;
}

function PeopleProfiles({ records, people, selectedId, onSelect, onAdd, onEdit, onConfigure, onEvent, onRoutine, onSchoolBooking, onSchoolCost, onSchoolMemory, onSchoolDocument, onSchoolDocumentDetail, onSchoolHoliday, onSchoolHelp }: { records: CircleRecord[]; people: CircleRecord[]; selectedId: string | null; onSelect: (id: string) => void; onAdd: () => void; onEdit: (record: CircleRecord) => void; onConfigure: (record: CircleRecord, section: ProfileMode) => void; onEvent: (id: string) => void; onRoutine: (id: string) => void; onSchoolBooking: (record: CircleRecord) => void; onSchoolCost: (record: CircleRecord) => void; onSchoolMemory: (record: CircleRecord) => void; onSchoolDocument: (record: CircleRecord) => void; onSchoolDocumentDetail: (record: CircleRecord, document: CircleRecord) => void; onSchoolHoliday: (record: CircleRecord) => void; onSchoolHelp: (record: CircleRecord) => void }) {
  const [profileMode, setProfileMode] = useState<ProfileMode>(initialProfileMode);
  if (!people.length) return <PeopleEmpty title="Aucun profil pour le moment." text="Chaque profil appartient uniquement à ce foyer et commence sans information préremplie." action="Ajouter une personne" onAction={onAdd} art="/art/luce-family-avatar-presets-web-v1.png" />;
  const selected = people.find((record) => record.id === selectedId) || people[0];
  const linkedEvents = records.filter((record) => record.kind === "event" && Array.isArray(record.payload.personIds) && record.payload.personIds.includes(selected.id)).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  const linkedRoutines = records.filter((record) => record.kind === "routine" && record.payload.personId === selected.id);
  const identityFacts = personType(selected) === "adult" ? [["Sexe ou genre", personGenderLabel(selected)], ["Nationalité", selected.payload.nationality], ["Téléphone", selected.payload.phone], ["Adresse e-mail", selected.payload.email], ["Employeur", selected.payload.employer], ["Lieu de travail", selected.payload.workplace]] : personType(selected) === "child" ? [["Sexe ou genre", personGenderLabel(selected)], ["Nationalité", selected.payload.nationality], ["Date de naissance", selected.payload.birthDate], ["Lieu de vie", selected.payload.city]] : [["Sexe", personGenderLabel(selected)], ["Date de naissance", selected.payload.birthDate], ["Lieu de vie", selected.payload.city]];
  const availableModes: Array<[ProfileMode, string, React.ReactNode]> = [["overview", "Repères", <ListChecks size={16} />], ...(personType(selected) === "child" ? [["school", "École", <School size={16} />] as [ProfileMode, string, React.ReactNode]] : []), ["health", "Santé", <HeartPulse size={16} />], ["organization", "Organisation", <UsersRound size={16} />]];
  const activeMode = availableModes.some(([mode]) => mode === profileMode) ? profileMode : "overview";
  return <>
    <div className="profile-switcher dynamic-profile-switcher">{people.map((record) => <button className={record.id === selected.id ? "active" : ""} type="button" onClick={() => { onSelect(record.id); setProfileMode("overview"); }} key={record.id}><RecordAvatar record={record} /><span><b>{record.title}</b><small>{personRelation(record)}</small></span></button>)}<button className="profile-add" type="button" onClick={onAdd} aria-label="Ajouter une personne"><Plus size={19} /></button></div>
    <section className="real-profile-banner"><div className="real-profile-portrait"><RecordAvatar record={selected} size="large" /><div><small>{personRelation(selected)}</small><h2>{selected.title}</h2>{Boolean(selected.payload.accountLinked) && <span className="account-linked"><ShieldCheck size={13} /> Profil lié à votre compte</span>}</div><IconButton label={`Modifier ${selected.title}`} onClick={() => onEdit(selected)}><Pencil size={17} /></IconButton></div><div className="real-profile-focus"><span className="eyebrow"><SunMedium size={15} /> Son quotidien</span><h2>{linkedEvents[0] ? linkedEvents[0].title : "Aucun rendez-vous prévu."}</h2><p>{linkedEvents[0] ? eventDate(linkedEvents[0]) : "Ajoutez un repère uniquement lorsqu'il devient utile."}</p><div><button className="primary-button primary-button--forest" type="button" onClick={() => onEvent(selected.id)}><CalendarDays size={17} /> Rendez-vous de {selected.title}</button><button className="secondary-button" type="button" onClick={() => onRoutine(selected.id)}><Repeat2 size={17} /> Routine de {selected.title}</button><button className="secondary-button" type="button" onClick={() => onEdit(selected)}><Pencil size={17} /> Modifier le profil</button></div></div><aside><span><MapPin size={18} /><small>Lieu</small><b>{String(selected.payload.city || "À préciser")}</b></span><span><CalendarDays size={18} /><small>Naissance</small><b>{selected.payload.birthDate ? new Intl.DateTimeFormat("fr-FR").format(new Date(String(selected.payload.birthDate))) : "À préciser"}</b></span><span><NotebookTabs size={18} /><small>Note utile</small><b>{String(selected.payload.notes || "Aucune")}</b></span></aside></section>
    <nav className="profile-section-tabs" aria-label={`Informations de ${selected.title}`}>{availableModes.map(([mode, label, icon]) => <button className={activeMode === mode ? "active" : ""} type="button" key={mode} onClick={() => setProfileMode(mode)}>{icon}<span>{label}</span></button>)}</nav>
    {activeMode === "overview" ? <><section className="profile-identity-facts">{identityFacts.map(([label, value]) => <ProfileFact label={String(label)} value={value} key={String(label)} />)}</section><section className="real-profile-details"><article><span className="eyebrow">Agenda</span><h3>Ses prochains moments</h3>{linkedEvents.length ? linkedEvents.slice(0, 4).map((record) => <div className="people-static-row" key={record.id}><span><b>{record.title}</b><small>{eventDate(record)}</small></span></div>) : <p>Rien de prévu.</p>}</article><article><span className="eyebrow">Rythme</span><h3>Ses routines</h3>{linkedRoutines.length ? linkedRoutines.map((record) => <div className="people-static-row" key={record.id}><span><b>{record.title}</b><small>{String(record.payload.recurrence || "Récurrent")}</small></span></div>) : <p>Aucune routine enregistrée.</p>}</article></section></> : activeMode === "school" ? <SchoolProfileHub child={selected} records={records} onConfigure={() => onConfigure(selected, "school")} onBooking={() => onSchoolBooking(selected)} onCost={() => onSchoolCost(selected)} onMemory={() => onSchoolMemory(selected)} onDocument={() => onSchoolDocument(selected)} onDocumentDetail={(document) => onSchoolDocumentDetail(selected, document)} onHoliday={() => onSchoolHoliday(selected)} onHelp={() => onSchoolHelp(selected)} /> : <ProfileDomain record={selected} section={activeMode} onConfigure={() => onConfigure(selected, activeMode)} onEvent={() => onEvent(selected.id)} />}
  </>;
}

type SchoolService = "morning" | "lunch" | "evening";
type SchoolSchedule = Record<string, SchoolService[]>;
const schoolWeek: Array<[string, string]> = [["monday", "Lun"], ["tuesday", "Mar"], ["thursday", "Jeu"], ["friday", "Ven"]];

const schoolText = (data: Record<string, unknown>, key: string, fallback = "") => String(data[key] || fallback);
const dateInputValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const nextSchoolWeekStart = () => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const offset = day === 0 ? 1 : day === 6 ? 2 : 1 - day;
  date.setDate(date.getDate() + offset);
  return dateInputValue(date);
};
const schoolWeekLabel = (weekStart?: unknown) => {
  const start = new Date(`${String(weekStart || nextSchoolWeekStart())}T12:00:00`);
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const startLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: start.getMonth() === end.getMonth() ? undefined : "long" }).format(start);
  const endLabel = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(end);
  return `Semaine du ${startLabel} au ${endLabel}`;
};
const schoolScheduleFrom = (booking?: CircleRecord): SchoolSchedule => {
  const value = booking?.payload.schedule;
  return value && typeof value === "object" && !Array.isArray(value) ? value as SchoolSchedule : {};
};
const schoolServicesLabel = (services: SchoolService[]) => services.length ? services.map((service) => service === "morning" ? "Matin" : service === "lunch" ? "Midi" : "Soir").join(" · ") : "Rien de réservé";

function SchoolProfileHub({ child, records, onConfigure, onBooking, onCost, onMemory, onDocument, onDocumentDetail, onHoliday, onHelp }: { child: CircleRecord; records: CircleRecord[]; onConfigure: () => void; onBooking: () => void; onCost: () => void; onMemory: () => void; onDocument: () => void; onDocumentDetail: (document: CircleRecord) => void; onHoliday: () => void; onHelp: () => void }) {
  const school = profileSection(child, "school");
  const configured = Boolean(school.schoolName);
  const bookings = records.filter((record) => record.kind === "school_booking" && record.payload.personId === child.id);
  const booking = bookings[0];
  const schedule = schoolScheduleFrom(booking);
  const documents = records.filter((record) => record.kind === "document" && record.payload.context === "school" && record.payload.personId === child.id);
  const holidays = records.filter((record) => record.kind === "event" && record.payload.context === "school_holiday" && record.payload.personId === child.id);
  const guide = citySchoolGuide(schoolText(school, "city", String(child.payload.city || "")));
  const officialRates = schoolTariffValues(schoolText(school, "city", String(child.payload.city || "")), schoolText(school, "familyQuotient"));
  const counts = schoolWeek.reduce((total, [key]) => {
    const services = schedule[key] || [];
    services.forEach((service) => { total[service] += 1; });
    return total;
  }, { morning: 0, lunch: 0, evening: 0 });
  const weeklyEstimate = counts.morning * numberFromSchool(school.morningRate || officialRates.morningRate) + counts.lunch * numberFromSchool(school.lunchRate || officialRates.lunchRate) + counts.evening * numberFromSchool(school.eveningRate || officialRates.eveningRate);
  const calculatedEstimate = Math.round((weeklyEstimate * 4.33 + (booking?.payload.wednesdayBooked ? numberFromSchool(school.wednesdayRate || officialRates.wednesdayRate) * 4 : 0)) * 100) / 100;
  const estimate = Number(booking?.payload.estimatedAmount || 0) || calculatedEstimate;
  if (!configured) return <section className="school-empty-state"><div><span className="eyebrow"><School size={15} /> École</span><h2>Préparer sa vie d’école.</h2><p>Indiquez la ville et quelques lettres du nom de l’école. Circle cherchera l’établissement dans l’annuaire officiel, puis vous laissera valider chaque information.</p><button className="primary-button primary-button--forest" type="button" onClick={onConfigure}><Sparkles size={17} /> Lancer l’assistant École</button></div><img src="/art/luce-household-access-v1.png" alt="" /></section>;

  const timeline: Array<[string, string, string]> = [
    [schoolText(school, "morningStart", "—"), "Accueil", "blue"],
    [schoolText(school, "startTime", "—"), "Classe", "green"],
    [schoolText(school, "lunchTime", "—"), "Midi", "gold"],
    [schoolText(school, "eveningStart", schoolText(school, "endTime", "—")), "Sortie", "coral"],
    [schoolText(school, "firstPickup", "—"), "Récupération", "ink"],
  ];
  return <section className="school-hub school-hub--rich school-hub--live">
    <header className="school-identity"><div><span className="eyebrow"><School size={15} /> {schoolText(school, "level", "Scolarité")}</span><h2>{schoolText(school, "schoolName")}</h2><p>{[school.teacher, school.classroomAssistant, school.entrance].filter(Boolean).map(String).join(" · ") || schoolText(school, "address", "Coordonnées à compléter")}</p><small className="school-source"><ShieldCheck size={13} /> {schoolText(school, "enrichmentSource", "Informations validées par le foyer")}</small></div><div className="school-identity__actions">{Boolean(school.phone) && <a className="secondary-button" href={`tel:${String(school.phone).replace(/\s/g, "")}`}><Phone size={17} /> Appeler</a>}<button className="secondary-button" type="button" onClick={onConfigure}><Pencil size={17} /> Modifier</button></div></header>
    <div className="school-today"><div><span className="eyebrow">Journée repère</span><h3>Les horaires utiles, d’un regard.</h3><p>Ce résumé vient des informations que vous avez validées.</p></div><div className="school-day">{timeline.map(([time, title, tone]) => <SchoolStep key={title} time={time} title={title} tone={tone} />)}</div><aside><CalendarClock size={19} /><span><small>Ce soir</small><b>{schoolText(school, "pickupWindow", "Récupération à préciser")}</b></span></aside></div>
    <div className="school-columns">
      <article className="school-services"><div className="block-heading"><div><small>{schoolWeekLabel(booking?.payload.weekStart)}</small><h3>Réservations</h3></div><IconButton label="Modifier les réservations" onClick={onBooking}><Pencil size={16} /></IconButton></div>{schoolWeek.map(([key, label]) => <ServiceLine key={key} day={label} values={schoolServicesLabel(schedule[key] || [])} active={Boolean(schedule[key]?.length)} />)}<button className="text-button" type="button" onClick={onBooking}>{booking ? "Modifier cette semaine" : "Organiser cette semaine"} <ChevronRight size={16} /></button><small className="school-deadline">{schoolText(school, "reservationRule", guide?.reservationRule || "Vérifiez le délai auprès du service municipal")}</small></article>
      <article className="school-wednesday"><div className="block-heading"><div><small>Mercredi</small><h3>Centre de loisirs</h3></div>{booking?.payload.wednesdayBooked ? <span className="sync-pill"><Check size={14} /> Prévu</span> : <span className="quiet-pill">À décider</span>}</div><div className="wednesday-times"><span><Clock3 size={17} /><small>Arrivée</small><b>{String(booking?.payload.wednesdayArrival || "À préciser")}</b></span><span><Clock3 size={17} /><small>Départ</small><b>{String(booking?.payload.wednesdayDeparture || "À préciser")}</b></span></div><p>{booking?.payload.wednesdayBooked ? `Journée${school.wednesdayRate ? ` · ${String(school.wednesdayRate)} €` : ""}` : "Aucune réservation enregistrée dans Circle."}</p><button className="text-button" type="button" onClick={onBooking}>Gérer les mercredis <ChevronRight size={16} /></button><small className="school-deadline">Le portail municipal reste la source de réservation.</small></article>
      <article className="school-documents"><div className="block-heading"><div><small>Dossier</small><h3>L’essentiel</h3></div><IconButton label="Ajouter un document" onClick={onDocument}><Plus size={16} /></IconButton></div>{documents.length ? documents.slice(0, 4).map((record) => <DocumentLine key={record.id} title={record.title} status={record.due_at ? `À vérifier avant le ${new Intl.DateTimeFormat("fr-FR").format(new Date(record.due_at))}` : "Rangé dans Circle"} onClick={() => onDocumentDetail(record)} />) : <p className="school-empty-copy">Aucun document scolaire rangé.</p>}{Boolean(school.authorizedPeople) && <DocumentLine title="Personnes autorisées" status={String(school.authorizedPeople)} />}</article>
    </div>
    <div className="school-cost"><span className="tile-icon tile-icon--gold"><ReceiptText size={20} /></span><div><small>Estimation mensuelle</small><strong>{estimate ? `${estimate.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : "À calculer"}</strong><p>{counts.morning} matin{counts.morning > 1 ? "s" : ""} · {counts.lunch} midi{counts.lunch > 1 ? "s" : ""} · {counts.evening} soir{counts.evening > 1 ? "s" : ""}{booking?.payload.wednesdayBooked ? " · mercredi" : ""} par semaine</p></div><div className="school-cost__rule"><small>Tarification</small><b>{schoolText(school, "quotientBand", officialRates.quotientBand || "À confirmer")}</b><em>{schoolText(school, "billingRule", guide?.billingRule || "Règle municipale à vérifier")}</em></div><button className="secondary-button" type="button" onClick={onCost}>Comprendre et ajuster</button></div>
    <div className="school-memory"><button type="button" onClick={onMemory}><span className="tile-icon"><NotebookTabs size={18} /></span><span><small>Dans son sac</small><b>{schoolText(school, "bag", "À compléter")}</b></span><ChevronRight size={16} /></button><button type="button" onClick={onMemory}><span className="tile-icon"><Phone size={18} /></span><span><small>Référent périscolaire</small><b>{schoolText(school, "afterSchoolContact", "À compléter")}</b></span><ChevronRight size={16} /></button><button type="button" onClick={onHoliday}><span className="tile-icon"><Trees size={18} /></span><span><small>Vacances</small><b>{holidays.length ? `${holidays.length} période${holidays.length > 1 ? "s" : ""} préparée${holidays.length > 1 ? "s" : ""}` : "Rien de préparé"}</b></span><ChevronRight size={16} /></button></div>
    <div className="school-official-links"><span><ShieldCheck size={18} /><span><b>Sources officielles</b><small>Circle distingue toujours les données de l’école et vos choix familiaux.</small></span></span><div>{Boolean(school.portalUrl) && <a href={String(school.portalUrl)} target="_blank" rel="noreferrer">{schoolText(school, "portalName", "Portail famille")} <ExternalLink size={14} /></a>}{Boolean(school.informationUrl) && <a href={String(school.informationUrl)} target="_blank" rel="noreferrer">Règles locales <ExternalLink size={14} /></a>}<a href={SCHOOL_DIRECTORY_URL} target="_blank" rel="noreferrer">Annuaire national <ExternalLink size={14} /></a></div></div>
    <div className="school-footer"><div><span className="tile-icon tile-icon--blue"><UsersRound size={20} /></span><span><small>Un imprévu ?</small><strong>Préparer une récupération ou une garde pour {child.title}</strong></span></div><button className="secondary-button" type="button" onClick={onHelp}>Demander à un proche</button></div>
  </section>;
}

function PeopleCalendar({ records, people, onAdd }: { records: CircleRecord[]; people: CircleRecord[]; onAdd: () => void }) {
  const events = records.filter((record) => record.kind === "event").sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
  const nameFor = (id: unknown) => people.find((person) => person.id === id)?.title;
  if (!events.length) return <PeopleEmpty title="L'agenda est encore libre." text="Ajoutez un rendez-vous, un relais ou une activité quand vous en avez réellement besoin." action="Ajouter un événement" onAction={onAdd} art="/art/luce-household-calendar-v1.png" />;
  return <section className="real-calendar"><div className="real-calendar-list">{events.map((record) => <article key={record.id}><span className="date-tile"><b>{record.starts_at ? new Date(record.starts_at).getDate() : "–"}</b>{record.starts_at ? new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(record.starts_at)).toUpperCase() : ""}</span><div><small>{eventDate(record)}</small><h3>{record.title}</h3><p>{Array.isArray(record.payload.personIds) ? record.payload.personIds.map(nameFor).filter(Boolean).join(" · ") : "Tout le foyer"}{record.payload.location ? ` · ${String(record.payload.location)}` : ""}</p></div></article>)}</div></section>;
}

function PeopleTrustedCircle({ people, onAdd, onEdit }: { people: CircleRecord[]; onAdd: () => void; onEdit: (record: CircleRecord) => void }) {
  if (!people.length) return <PeopleEmpty title="Votre entourage viendra à votre rythme." text="Ajoutez un proche lorsque vous souhaitez pouvoir le solliciter. Il ne voit jamais les autres données du foyer par défaut." action="Ajouter un proche" onAction={onAdd} art="/art/circle-help-network-v2.png" />;
  return <section className="real-trusted"><header><div><span className="eyebrow">Entourage</span><h2>Les personnes sur qui compter.</h2><p>Des coordonnées et des disponibilités simples, sans ouvrir tout le foyer.</p></div><button className="secondary-button" type="button" onClick={onAdd}><Plus size={18} /> Ajouter un proche</button></header><div>{people.map((record) => <button type="button" onClick={() => onEdit(record)} key={record.id}><RecordAvatar record={record} /><span><b>{record.title}</b><small>{personRelation(record)}{record.payload.city ? ` · ${String(record.payload.city)}` : ""}</small></span><Pencil size={16} /></button>)}</div></section>;
}

function PeopleCreateMenu({ onClose, onPerson, onEvent, onRoutine, onTrusted }: { onClose: () => void; onPerson: () => void; onEvent: () => void; onRoutine: () => void; onTrusted: () => void }) {
  const actions = [[<UserRound size={19} />, "Une personne du foyer", "Adulte, enfant ou animal", onPerson], [<CalendarDays size={19} />, "Un rendez-vous", "Pour une ou plusieurs personnes", onEvent], [<Repeat2 size={19} />, "Une routine", "Un repère qui revient", onRoutine], [<UsersRound size={19} />, "Un proche", "Ajouter quelqu'un à l'entourage", onTrusted]] as const;
  return <OverlayFrame title="Que voulez-vous ajouter ?" eyebrow="Personnes" onClose={onClose}><div className="create-list">{actions.map(([icon, title, text, action]) => <button type="button" key={title} onClick={action}><span className="tile-icon">{icon}</span><span><b>{title}</b><small>{text}</small></span><ChevronRight size={17} /></button>)}</div></OverlayFrame>;
}

function PersonFlow({ scope, record, onClose }: { scope: CirclePersonScope; record?: CircleRecord; onClose: () => void }) {
  const { session, addRecord, updateRecord, deleteRecord, uploadProfileImage, deleteStoredFile, syncing } = useCircleData();
  const [name, setName] = useState(record?.title || "");
  const [relation, setRelation] = useState(String(record?.payload.relation || ""));
  const [kind, setKind] = useState<CirclePersonType>(record ? personType(record) : scope === "trusted" ? "adult" : "adult");
  const [city, setCity] = useState(String(record?.payload.city || ""));
  const [birthDate, setBirthDate] = useState(String(record?.payload.birthDate || ""));
  const [gender, setGender] = useState(String(record?.payload.gender || "unspecified"));
  const [nationality, setNationality] = useState(String(record?.payload.nationality || ""));
  const [phone, setPhone] = useState(String(record?.payload.phone || ""));
  const [email, setEmail] = useState(String(record?.payload.email || (record?.payload.accountLinked ? session.user.email || "" : "")));
  const [employer, setEmployer] = useState(String(record?.payload.employer || ""));
  const [workplace, setWorkplace] = useState(String(record?.payload.workplace || ""));
  const [notes, setNotes] = useState(String(record?.payload.notes || ""));
  const [avatarPreset, setAvatarPreset] = useState<number | null>(typeof record?.payload.avatarPreset === "number" ? record.payload.avatarPreset : record ? null : scope === "trusted" ? 8 : 0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!photoFile) { setPhotoPreview(""); return; }
    const source = URL.createObjectURL(photoFile);
    setPhotoPreview(source);
    return () => URL.revokeObjectURL(source);
  }, [photoFile]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    let uploadedPath = "";
    try {
      if (photoFile) uploadedPath = await uploadProfileImage(photoFile);
      const currentPath = String(record?.payload.avatarPath || "");
      const payload = {
        ...(record?.payload || {}), scope, personType: kind, relation, city, birthDate, gender, nationality, phone, email, employer, workplace, notes,
        avatarPath: uploadedPath || (avatarPreset === null ? currentPath : ""),
        avatarPreset,
      };
      if (record) await updateRecord(record.id, { title: name.trim(), payload });
      else await addRecord({ kind: "person", title: name.trim(), payload });
      if (currentPath && (uploadedPath || avatarPreset !== null)) await deleteStoredFile(currentPath).catch(() => undefined);
      onClose();
    } catch (cause) {
      if (uploadedPath) await deleteStoredFile(uploadedPath).catch(() => undefined);
      setError(cause instanceof Error ? cause.message : "Impossible d'enregistrer cette personne.");
    }
  };
  const remove = async () => {
    if (!record || record.payload.accountLinked) return;
    try {
      await deleteRecord(record.id);
      const currentPath = String(record.payload.avatarPath || "");
      if (currentPath) await deleteStoredFile(currentPath).catch(() => undefined);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de supprimer cette personne."); }
  };
  return <OverlayFrame title={record ? `Modifier ${record.title}` : scope === "trusted" ? "Ajouter un proche" : "Ajouter une personne"} eyebrow={scope === "trusted" ? "Entourage" : "Foyer"} onClose={onClose}><form className="real-form" onSubmit={submit}>
    <section className="avatar-editor"><div className="avatar-editor__preview">{photoPreview ? <img src={photoPreview} alt="Aperçu du portrait" /> : record && !photoFile && avatarPreset === null ? <RecordAvatar record={record} size="large" /> : <span className={`avatar-preset avatar-preset--${avatarPreset ?? 0} avatar-preset--large`} />}</div><div><b>Son image</b><p>Choisissez une photo de votre téléphone ou un avatar Circle.</p><label className="secondary-button avatar-upload"><Upload size={17} /> Choisir une photo<input aria-label="Choisir une photo" type="file" accept="image/jpeg,image/png,image/heic,image/heif" onChange={(event) => { const file = event.target.files?.[0] || null; setPhotoFile(file); if (file) setAvatarPreset(null); }} /></label></div></section>
    <fieldset className="avatar-choices"><legend>Ou choisir un avatar</legend>{Array.from({ length: 12 }, (_, index) => <button className={avatarPreset === index && !photoFile ? "active" : ""} type="button" aria-label={`Avatar Circle ${index + 1}`} onClick={() => { setAvatarPreset(index); setPhotoFile(null); }} key={index}><span className={`avatar-preset avatar-preset--${index} avatar-preset--small`} /></button>)}</fieldset>
    <label><span>Prénom ou nom</span><input aria-label="Prénom ou nom" value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label>{scope === "household" && <fieldset><legend>Profil</legend>{([['adult','Adulte'],['child','Enfant'],['pet','Animal']] as const).map(([value, label]) => <button className={kind === value ? "active" : ""} type="button" onClick={() => { setKind(value); if (!photoFile && value === "pet") setAvatarPreset(null); else if (!photoFile && kind === "pet" && avatarPreset === null) setAvatarPreset(value === "child" ? 2 : 0); }} key={value}>{label}</button>)}</fieldset>}<label><span>Lien avec le foyer</span><input aria-label="Lien avec le foyer" value={relation} onChange={(event) => setRelation(event.target.value)} placeholder={scope === "trusted" ? "Grand-mère, ami, voisine…" : "Parent, fille, chien…"} required /></label>
    <fieldset><legend>Sexe ou genre</legend>{[["female", kind === "pet" ? "Femelle" : "Féminin"], ["male", kind === "pet" ? "Mâle" : "Masculin"], ["neutral", "Neutre"], ["unspecified", "Ne pas préciser"]].map(([value, label]) => <button className={gender === value ? "active" : ""} type="button" onClick={() => setGender(value)} key={value}>{label}</button>)}</fieldset>
    <div className="field-pair"><label><span>Ville ou lieu</span><input aria-label="Ville ou lieu" value={city} onChange={(event) => setCity(event.target.value)} /></label><label><span>Date de naissance</span><input aria-label="Date de naissance" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></label></div>
    {kind !== "pet" && <label><span>Nationalité</span><input aria-label="Nationalité" value={nationality} onChange={(event) => setNationality(event.target.value)} placeholder="Facultatif" /></label>}
    {kind === "adult" && <><div className="field-pair"><label><span>Téléphone</span><input aria-label="Téléphone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></label><label><span>Adresse e-mail</span><input aria-label="Adresse e-mail du profil" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label></div><div className="field-pair"><label><span>Employeur</span><input aria-label="Employeur" value={employer} onChange={(event) => setEmployer(event.target.value)} placeholder="Facultatif" /></label><label><span>Lieu de travail</span><input aria-label="Lieu de travail" value={workplace} onChange={(event) => setWorkplace(event.target.value)} placeholder="Adresse ou ville" /></label></div></>}
    <label><span>Note utile</span><textarea aria-label="Note utile" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Facultatif" /></label><div className="privacy-card"><ShieldCheck size={18} /><span><b>Données propres à ce foyer</b><small>Créer un profil n'accorde aucun accès au compte. Les invitations seront toujours explicites.</small></span></div>
    {record?.payload.accountLinked ? <div className="account-profile-note"><ShieldCheck size={18} /><span><b>Votre profil de co-parent</b><small>Il est lié à votre accès au foyer. Vous pouvez le modifier, mais pas le supprimer ici.</small></span></div> : record && <section className="profile-delete"><Trash2 size={19} /><span><b>Supprimer ce profil</b><small>Ses informations personnelles disparaîtront de ce foyer.</small></span>{confirmDelete ? <button className="danger-button" type="button" onClick={() => void remove()}>Confirmer la suppression</button> : <button className="danger-text" type="button" onClick={() => setConfirmDelete(true)}>Supprimer</button>}</section>}
    {error && <div className="auth-error">{error}</div>}<footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !name.trim() || !relation.trim()}>{syncing && <LoaderCircle className="spin" size={17} />} Enregistrer</button></footer></form></OverlayFrame>;
}

function SchoolSettingsFields({ values, setValues }: { values: Record<string, string>; setValues: React.Dispatch<React.SetStateAction<Record<string, string>>> }) {
  const [results, setResults] = useState<SchoolDirectoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichmentNote, setEnrichmentNote] = useState(values.enrichmentNotice || "");
  const [searchError, setSearchError] = useState("");
  const set = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const field = (name: string, label: string, placeholder = "", type = "text") => <label><span>{label}</span><input aria-label={label} type={type} value={values[name] || ""} placeholder={placeholder} onChange={(event) => set(name, event.target.value)} /></label>;
  const search = async () => {
    setSearching(true);
    setSearchError("");
    try {
      const next = await searchSchoolDirectory(values.city || "", values.schoolName || "");
      setResults(next);
      if (!next.length) setSearchError("Aucun établissement trouvé. Essayez avec moins de mots ou vérifiez la ville.");
    } catch (cause) { setSearchError(cause instanceof Error ? cause.message : "Recherche impossible."); }
    finally { setSearching(false); }
  };
  const complete = async (school: SchoolDirectoryEntry) => {
    setEnriching(true);
    const proposal = await enrichSchoolWithAgent(school, values.familyQuotient || "");
    setValues((current) => ({
      ...current,
      ...proposal.values,
      enrichmentMode: proposal.mode,
      enrichmentNotice: proposal.notice,
      enrichmentSources: JSON.stringify(proposal.sources),
      enrichmentSource: proposal.mode === "gemini" ? "Assistant Circle · recherche Gemini sourcée" : (citySchoolGuide(school.city)?.sourceLabel || SCHOOL_DIRECTORY_SOURCE),
      enrichedAt: new Date().toISOString(),
    }));
    setEnrichmentNote(proposal.notice);
    setEnriching(false);
  };
  const choose = async (school: SchoolDirectoryEntry) => {
    const guide = citySchoolGuide(school.city);
    setValues((current) => ({
      ...current,
      schoolName: school.name,
      city: school.city,
      address: [school.address, school.postalCode, school.city].filter(Boolean).join(", "),
      phone: school.phone,
      email: school.email,
      website: school.website,
      uai: school.uai,
      schoolKind: school.kind,
      postalCode: school.postalCode,
      publicPrivate: school.publicPrivate,
      hasCatering: school.hasCatering ? "Restauration indiquée par l'annuaire" : "À vérifier",
      latitude: school.latitude === null ? "" : String(school.latitude),
      longitude: school.longitude === null ? "" : String(school.longitude),
      directoryUpdatedAt: school.updatedAt,
      enrichmentSource: SCHOOL_DIRECTORY_SOURCE,
      portalName: guide?.portalName || current.portalName || "",
      portalUrl: guide?.portalUrl || current.portalUrl || "",
      informationUrl: guide?.informationUrl || current.informationUrl || "",
      reservationRule: guide?.reservationRule || current.reservationRule || "",
      billingRule: guide?.billingRule || current.billingRule || "",
    }));
    setResults([]);
    await complete(school);
  };
  const selectedSchool: SchoolDirectoryEntry | null = values.uai ? {
    uai: values.uai, name: values.schoolName || "", kind: values.schoolKind || "Établissement scolaire", publicPrivate: values.publicPrivate || "", address: values.address || "", postalCode: values.postalCode || "", city: values.city || "", phone: values.phone || "", email: values.email || "", website: values.website || "", hasCatering: values.hasCatering?.includes("indiquée") || false, latitude: Number(values.latitude) || null, longitude: Number(values.longitude) || null, updatedAt: values.directoryUpdatedAt || "",
  } : null;
  const guide = citySchoolGuide(values.city || "");
  return <>
    <section className="school-assistant"><span className="school-assistant__mark"><Sparkles size={21} /></span><div><span className="eyebrow">Assistant École</span><h3>Partir des bonnes sources.</h3><p>Circle identifie l’établissement, puis prépare les horaires, accueils, règles et tarifs publiés. Rien n’est enregistré avant votre validation.</p><div className="school-assistant__search"><label><span>Ville</span><input aria-label="Ville de l'école" value={values.city || ""} onChange={(event) => set("city", event.target.value)} placeholder="Rouen, Paris…" /></label><label><span>Nom ou quelques lettres</span><input aria-label="Rechercher une école" value={values.schoolName || ""} onChange={(event) => set("schoolName", event.target.value)} placeholder="Pépinières, Jules Ferry…" /></label><button className="primary-button primary-button--forest" type="button" disabled={searching || enriching || (values.city || "").trim().length < 2} onClick={() => void search()}>{searching ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />} Rechercher</button></div>{searchError && <p className="school-assistant__error">{searchError}</p>}{results.length > 0 && <div className="school-results">{results.map((school) => <button type="button" key={school.uai} disabled={enriching} onClick={() => void choose(school)}><span><b>{school.name}</b><small>{school.address} · {school.postalCode} {school.city}</small><em>{school.kind} · {school.publicPrivate} · UAI {school.uai}</em></span>{enriching ? <LoaderCircle className="spin" size={17} /> : <ChevronRight size={17} />}</button>)}</div>}{guide && <div className="school-guide-preview"><ShieldCheck size={17} /><span><b>{guide.portalName} identifié</b><small>{enrichmentNote || guide.services.join(" · ")}</small></span>{selectedSchool ? <button className="text-button" type="button" disabled={enriching} onClick={() => void complete(selectedSchool)}>{enriching ? "Recherche…" : "Actualiser"}</button> : <a href={guide.informationUrl} target="_blank" rel="noreferrer">Vérifier <ExternalLink size={13} /></a>}</div>}</div></section>
    <div className="form-section-heading"><span className="eyebrow">Établissement</span><h3>Les personnes et le lieu</h3></div>
    {field("schoolName", "Établissement", "Nom de l'école")}
    <div className="field-pair">{field("level", "Classe ou niveau", "Petite section, CP…")}{field("entrance", "Entrée ou point de rendez-vous", "Ex. portail côté jardin")}</div>
    <div className="field-pair">{field("teacher", "Enseignant ou référent", "Facultatif")}{field("classroomAssistant", "ATSEM ou second contact", "Facultatif")}</div>
    {field("address", "Adresse de l'école")}
    <div className="field-pair">{field("phone", "Téléphone", "", "tel")}{field("email", "Adresse e-mail", "", "email")}</div>
    <div className="field-pair">{field("uai", "Code UAI", "Fourni par l'annuaire")}{field("publicPrivate", "Statut", "Public ou privé")}</div>
    <div className="form-section-heading"><span className="eyebrow">Journée repère</span><h3>Seulement les horaires utiles</h3></div>
    <div className="field-pair">{field("morningStart", "Ouverture de l'accueil", "", "time")}{field("startTime", "Début de la classe", "", "time")}</div>
    <div className="field-pair">{field("lunchTime", "Déjeuner", "", "time")}{field("endTime", "Fin de la classe", "", "time")}</div>
    <div className="field-pair">{field("eveningStart", "Début du périscolaire", "", "time")}{field("firstPickup", "Première récupération", "", "time")}</div>
    {field("pickupWindow", "Créneau de récupération", "Ex. entre 17:30 et 18:00")}
    <div className="form-section-heading"><span className="eyebrow">Services et coût</span><h3>Ce qui influence la semaine</h3></div>
    <div className="field-pair"><label><span>Quotient familial</span><input aria-label="Quotient familial" type="number" min="0" value={values.familyQuotient || ""} placeholder="Facultatif" onChange={(event) => { const familyQuotient = event.target.value; setValues((current) => ({ ...current, familyQuotient, ...schoolTariffValues(current.city || "", familyQuotient) })); }} /><small className="field-help">Sans quotient, Circle applique provisoirement la tranche la plus élevée.</small></label><label><span>Tranche appliquée</span><input aria-label="Tranche appliquée" value={values.quotientBand || ""} readOnly /></label></div>
    {field("reservationRule", "Délai de modification", "Ex. jusqu'à J-2")}
    <div className="field-pair">{field("morningRate", "Tarif matin (€)", "0,00", "number")}{field("lunchRate", "Tarif midi (€)", "0,00", "number")}</div>
    <div className="field-pair">{field("eveningRate", "Tarif soir (€)", "0,00", "number")}{field("wednesdayRate", "Tarif mercredi (€)", "0,00", "number")}</div>
    {field("billingRule", "Règle de facturation", "Quand et comment la facture arrive")}
    <div className="form-section-heading"><span className="eyebrow">Mémoire utile</span><h3>Les détails qui évitent les oublis</h3></div>
    {field("authorizedPeople", "Personnes autorisées", "Noms séparés par une virgule")}
    <div className="field-pair">{field("afterSchoolContact", "Référent périscolaire", "Nom et téléphone")}{field("bag", "Dans son sac", "Change, doudou, gourde…")}</div>
    <div className="field-pair">{field("portalName", "Nom du portail famille")}{field("portalUrl", "Adresse du portail", "https://…", "url")}</div>
    {field("informationUrl", "Source officielle locale", "Page de la ville ou du service", "url")}
    <label><span>Consignes ou documents à penser</span><textarea aria-label="Consignes ou documents à penser" value={values.notes || ""} onChange={(event) => set("notes", event.target.value)} /></label>
  </>;
}

function ProfileDetailsFlow({ record, section, onClose }: { record: CircleRecord; section: ProfileMode; onClose: () => void }) {
  const { updateRecord, syncing } = useCircleData();
  const key = section === "overview" ? "organization" : section;
  const [values, setValues] = useState<Record<string, string>>(() => ({ city: String(record.payload.city || ""), ...Object.fromEntries(Object.entries(profileSection(record, key)).map(([name, value]) => [name, String(value || "")])) }));
  const [error, setError] = useState("");
  const field = (name: string, label: string, placeholder = "", type = "text") => <label><span>{label}</span><input aria-label={label} type={type} value={values[name] || ""} placeholder={placeholder} onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))} /></label>;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try { await updateRecord(record.id, { payload: { ...record.payload, [key]: values } }); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d'enregistrer ces informations."); }
  };
  const title = key === "school" ? `École de ${record.title}` : key === "health" ? `Santé de ${record.title}` : `Organisation de ${record.title}`;
  return <OverlayFrame title={title} eyebrow="Profil" onClose={onClose}><form className="real-form profile-details-form" onSubmit={submit}>
    {key === "school" && <SchoolSettingsFields values={values} setValues={setValues} />}
    {key === "health" && <><div className="privacy-card"><LockKeyhole size={18} /><span><b>Informations sensibles</b><small>Elles restent dans ce foyer et ne sont jamais partagées automatiquement avec l'entourage.</small></span></div>{field("practitioner", personType(record) === "pet" ? "Vétérinaire" : "Médecin ou pédiatre", "Nom et coordonnées")}{field("allergies", "Allergies", "Aucune connue, ou précisez")}{field("medications", "Traitement ou médicaments", "Nom, dose et moment")}{field("emergencyContact", "Contact en cas de besoin", "Nom et téléphone")}<label><span>Consignes importantes</span><textarea aria-label="Consignes importantes" value={values.instructions || ""} onChange={(event) => setValues((current) => ({ ...current, instructions: event.target.value }))} placeholder="Ce qu'un adulte doit savoir pour bien s'en occuper" /></label><label><span>Note privée</span><textarea aria-label="Note privée" value={values.notes || ""} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} /></label></>}
    {key === "organization" && <><div className="kindness-note"><UsersRound size={18} /><span><b>Une information claire évite les relances</b><small>Ces repères pourront ensuite accompagner un relais ou une garde, après votre validation.</small></span></div>{field("custodyMode", personType(record) === "child" ? "Mode de garde" : "Organisation", "Alternée, principale, libre…")}{field("primaryHome", "Lieu principal", "Chez qui ou à quelle adresse")}{field("handoff", "Repère de relais", "Ex. vendredi après l'école")}{field("authorizedPeople", "Personnes autorisées", "Qui peut venir chercher ou accompagner")}{field("instructions", "Consigne à partager", "Ex. sac, médicaments, habitudes")}<label><span>Note d'organisation</span><textarea aria-label="Note d'organisation" value={values.notes || ""} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} /></label></>}
    {error && <div className="auth-error">{error}</div>}<footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing}>{syncing && <LoaderCircle className="spin" size={17} />} Enregistrer</button></footer>
  </form></OverlayFrame>;
}

function EventFlow({ people, initialPersonId, onClose }: { people: CircleRecord[]; initialPersonId?: string; onClose: () => void }) {
  const { addRecord, syncing } = useCircleData();
  const tomorrow = new Date(Date.now() + 86400000); tomorrow.setHours(17, 0, 0, 0);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(tomorrow.toISOString().slice(0, 16));
  const [location, setLocation] = useState("");
  const [personIds, setPersonIds] = useState<string[]>(initialPersonId ? [initialPersonId] : []);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); try { await addRecord({ kind: "event", title: title.trim(), status: "planned", startsAt: new Date(startsAt).toISOString(), payload: { personIds, location, notes } }); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d'ajouter cet événement."); } };
  const linkedPerson = people.find((person) => person.id === initialPersonId);
  return <OverlayFrame title={linkedPerson ? `Rendez-vous de ${linkedPerson.title}` : "Ajouter un rendez-vous"} eyebrow={linkedPerson ? "Profil personnel" : "Agenda familial"} onClose={onClose}><form className="real-form" onSubmit={submit}>{linkedPerson && <div className="linked-action-note"><RecordAvatar record={linkedPerson} /><span><b>Ce rendez-vous concerne {linkedPerson.title}</b><small>Vous pouvez ajouter d'autres personnes concernées ci-dessous.</small></span></div>}<label><span>Qu'est-ce qui est prévu ?</span><input aria-label="Qu'est-ce qui est prévu ?" value={title} onChange={(event) => setTitle(event.target.value)} required autoFocus /></label><label><span>Date et heure</span><input aria-label="Date et heure" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label><label><span>Lieu</span><input aria-label="Lieu" value={location} onChange={(event) => setLocation(event.target.value)} /></label><fieldset className="person-checks"><legend>Qui est concerné ?</legend>{people.length ? people.map((person) => <label key={person.id}><input aria-label={person.title} type="checkbox" checked={personIds.includes(person.id)} onChange={() => setPersonIds((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} /><RecordAvatar record={person} size="tiny" /> {person.title}</label>) : <p>Ajoutez d'abord une personne au foyer.</p>}</fieldset><label><span>Détail utile</span><textarea aria-label="Détail utile" value={notes} onChange={(event) => setNotes(event.target.value)} /></label>{error && <div className="auth-error">{error}</div>}<footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !title.trim() || !startsAt || !personIds.length}>Ajouter à l'agenda</button></footer></form></OverlayFrame>;
}

function RoutineFlow({ people, initialPersonId, onClose }: { people: CircleRecord[]; initialPersonId?: string; onClose: () => void }) {
  const { addRecord, syncing } = useCircleData();
  const [title, setTitle] = useState("");
  const [personId, setPersonId] = useState(initialPersonId || "all");
  const [time, setTime] = useState("18:30");
  const [recurrence, setRecurrence] = useState("Tous les jours");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); await addRecord({ kind: "routine", title: title.trim(), payload: { personId, time, recurrence } }); onClose(); };
  const linkedPerson = people.find((person) => person.id === initialPersonId);
  return <OverlayFrame title={linkedPerson ? `Routine de ${linkedPerson.title}` : "Routine du foyer"} eyebrow={linkedPerson ? "Profil personnel" : "Repère partagé"} onClose={onClose}><form className="real-form" onSubmit={submit}>{linkedPerson && <div className="linked-action-note"><RecordAvatar record={linkedPerson} /><span><b>Cette routine concerne {linkedPerson.title}</b><small>Elle restera visible dans ce profil.</small></span></div>}<label><span>Routine</span><input aria-label="Routine" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex. Médicament du soir" required autoFocus /></label><label><span>Personne concernée</span><select aria-label="Personne concernée" value={personId} onChange={(event) => setPersonId(event.target.value)} required><option value="all">Tout le foyer</option>{people.map((person) => <option key={person.id} value={person.id}>{person.title}</option>)}</select></label><div className="field-pair"><label><span>Heure</span><input aria-label="Heure" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label><label><span>Récurrence</span><select aria-label="Récurrence" value={recurrence} onChange={(event) => setRecurrence(event.target.value)}><option>Tous les jours</option><option>Chaque semaine</option><option>Jours d'école</option><option>À chaque garde</option></select></label></div><footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !title.trim() || !personId}>Enregistrer la routine</button></footer></form></OverlayFrame>;
}

const numberFromSchool = (value: unknown) => Number(String(value || "0").replace(",", ".")) || 0;

function ProfileSchoolBookingFlow({ child, records, onClose }: { child: CircleRecord; records: CircleRecord[]; onClose: () => void }) {
  const { addRecord, updateRecord, syncing } = useCircleData();
  const school = profileSection(child, "school");
  const existing = records.find((record) => record.kind === "school_booking" && record.payload.personId === child.id);
  const [weekStart, setWeekStart] = useState(String(existing?.payload.weekStart || nextSchoolWeekStart()));
  const [schedule, setSchedule] = useState<SchoolSchedule>(() => schoolScheduleFrom(existing));
  const [wednesdayBooked, setWednesdayBooked] = useState(Boolean(existing?.payload.wednesdayBooked));
  const [wednesdayArrival, setWednesdayArrival] = useState(String(existing?.payload.wednesdayArrival || school.wednesdayArrival || "08:00"));
  const [wednesdayDeparture, setWednesdayDeparture] = useState(String(existing?.payload.wednesdayDeparture || school.wednesdayDeparture || "18:00"));
  const [saved, setSaved] = useState(false);
  const officialRates = schoolTariffValues(String(school.city || child.payload.city || ""), String(school.familyQuotient || ""));
  const rate = (service: SchoolService | "wednesday") => numberFromSchool(school[`${service}Rate`] || officialRates[`${service}Rate`]);
  const toggle = (day: string, service: SchoolService) => setSchedule((current) => ({ ...current, [day]: (current[day] || []).includes(service) ? (current[day] || []).filter((item) => item !== service) : [...(current[day] || []), service] }));
  const weekly = schoolWeek.reduce((sum, [day]) => sum + (schedule[day] || []).reduce((daySum, service) => daySum + rate(service), 0), 0);
  const estimatedAmount = Math.round((weekly * 4.33 + (wednesdayBooked ? rate("wednesday") * 4 : 0)) * 100) / 100;
  const save = async () => {
    const payload = { personId: child.id, childName: child.title, weekStart, schedule, wednesdayBooked, wednesdayArrival, wednesdayDeparture, estimatedAmount, portalUrl: school.portalUrl || "", source: school.portalName || "Saisie du foyer" };
    if (existing) await updateRecord(existing.id, { title: `Accueils scolaires de ${child.title}`, status: "planned", startsAt: `${weekStart}T07:45:00`, payload });
    else await addRecord({ kind: "school_booking", title: `Accueils scolaires de ${child.title}`, status: "planned", startsAt: `${weekStart}T07:45:00`, payload });
    setSaved(true);
  };
  return <OverlayFrame title={saved ? "Semaine enregistrée" : `Semaine d’école de ${child.title}`} eyebrow={saved ? "Agenda et estimation mis à jour" : schoolWeekLabel(weekStart)} onClose={onClose} wide>{saved ? <div className="flow-success"><span><Check size={25} /></span><h3>La semaine est claire.</h3><p>{schoolWeekLabel(weekStart)} a été enregistrée. La réservation effective reste à confirmer sur le portail officiel de votre ville.</p>{Boolean(school.portalUrl) && <a className="secondary-button" href={String(school.portalUrl)} target="_blank" rel="noreferrer">Ouvrir {schoolText(school, "portalName", "le portail famille")} <ExternalLink size={15} /></a>}</div> : <div className="school-booking-flow school-booking-flow--live"><div className="booking-guidance"><CalendarClock size={20} /><span><b>{schoolWeekLabel(weekStart)}</b><small>{schoolText(school, "reservationRule", "Vérifiez ensuite les délais auprès de la ville.")}</small></span><label><span>Semaine du</span><input aria-label="Début de la semaine scolaire" type="date" value={weekStart} onChange={(event) => setWeekStart(event.target.value)} /></label></div><div className="booking-table"><header><span>Jour</span><span>Matin</span><span>Midi</span><span>Soir</span></header>{schoolWeek.map(([day, label]) => <div key={day}><b>{label}</b>{(["morning", "lunch", "evening"] as SchoolService[]).map((service) => <button key={service} aria-label={`${label} · ${service === "morning" ? "matin" : service === "lunch" ? "midi" : "soir"}`} aria-pressed={Boolean(schedule[day]?.includes(service))} className={schedule[day]?.includes(service) ? "active" : ""} type="button" onClick={() => toggle(day, service)}>{schedule[day]?.includes(service) ? <Check size={15} /> : <Plus size={15} />}</button>)}</div>)}</div><button className={wednesdayBooked ? "booking-wednesday active" : "booking-wednesday"} type="button" onClick={() => setWednesdayBooked((value) => !value)}><span className="tile-icon tile-icon--gold"><Trees size={20} /></span><span><small>Mercredi · centre de loisirs</small><b>{wednesdayBooked ? "Prévu" : "Non prévu"}</b></span><strong>{rate("wednesday") ? `${rate("wednesday").toFixed(2)} €` : "Tarif à confirmer"}</strong>{wednesdayBooked ? <Check size={18} /> : <Plus size={18} />}</button>{wednesdayBooked && <div className="field-pair"><label><span>Arrivée</span><input aria-label="Arrivée du mercredi" type="time" value={wednesdayArrival} onChange={(event) => setWednesdayArrival(event.target.value)} /></label><label><span>Départ</span><input aria-label="Départ du mercredi" type="time" value={wednesdayDeparture} onChange={(event) => setWednesdayDeparture(event.target.value)} /></label></div>}<div className="booking-price"><span><small>Estimation mensuelle</small><b>{estimatedAmount ? `${estimatedAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : "Tarifs à confirmer"}</b></span><span><small>Tranche</small><b>{schoolText(school, "quotientBand", officialRates.quotientBand || "À confirmer")}</b></span><em>Projection de ce rythme sur 4,33 semaines, avant facture officielle</em></div></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" type="button" disabled={syncing || !weekStart} onClick={() => void save()}>{syncing && <LoaderCircle className="spin" size={17} />} Enregistrer dans Circle</button>}</footer></OverlayFrame>;
}

function ProfileSchoolCostFlow({ child, records, onClose }: { child: CircleRecord; records: CircleRecord[]; onClose: () => void }) {
  const { updateRecord, syncing } = useCircleData();
  const school = profileSection(child, "school");
  const booking = records.find((record) => record.kind === "school_booking" && record.payload.personId === child.id);
  const [quotient, setQuotient] = useState(String(school.familyQuotient || ""));
  const [saved, setSaved] = useState(false);
  const calculated = schoolTariffValues(String(school.city || child.payload.city || ""), quotient);
  const rates = Object.keys(calculated).length ? calculated : Object.fromEntries(["morningRate", "lunchRate", "eveningRate", "wednesdayRate", "quotientBand"].map((key) => [key, String(school[key] || "")]));
  const schedule = schoolScheduleFrom(booking);
  const weekly = schoolWeek.reduce((sum, [day]) => sum + (schedule[day] || []).reduce((daySum, service) => daySum + numberFromSchool(rates[`${service}Rate`]), 0), 0);
  const estimate = Math.round((weekly * 4.33 + (booking?.payload.wednesdayBooked ? numberFromSchool(rates.wednesdayRate) * 4 : 0)) * 100) / 100;
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await updateRecord(child.id, { payload: { ...child.payload, school: { ...school, familyQuotient: quotient, ...rates } } });
    if (booking) await updateRecord(booking.id, { payload: { ...booking.payload, estimatedAmount: estimate } });
    setSaved(true);
  };
  return <OverlayFrame title={saved ? "Tarification mise à jour" : `Coût de l’école de ${child.title}`} eyebrow="Estimation expliquée" onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>{estimate.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € estimés par mois.</h3><p>Le calcul utilise maintenant la tranche correspondant au quotient indiqué. La facture municipale reste la référence.</p></div> : <form className="real-form school-cost-flow" onSubmit={save}><div className="school-cost-explainer"><ReceiptText size={21} /><span><b>{quotient ? "Le quotient ajuste automatiquement chaque tarif." : "Le plafond protège l’estimation."}</b><small>{quotient ? `Tranche appliquée : ${rates.quotientBand}` : "Aucun quotient renseigné : Circle utilise provisoirement la tranche rouennaise la plus élevée."}</small></span></div><label><span>Quotient familial</span><input aria-label="Quotient familial pour le calcul" type="number" min="0" value={quotient} onChange={(event) => setQuotient(event.target.value)} placeholder="Laisser vide pour le tarif maximal" /></label><div className="school-rate-grid"><span><small>Matin</small><b>{rates.morningRate || "—"} €</b></span><span><small>Midi</small><b>{rates.lunchRate || "—"} €</b></span><span><small>Soir</small><b>{rates.eveningRate || "—"} €</b></span><span><small>Mercredi</small><b>{rates.wednesdayRate || "—"} €</b></span></div><div className="booking-price"><span><small>Rythme enregistré</small><b>{schoolWeekLabel(booking?.payload.weekStart)}</b></span><span><small>Estimation mensuelle</small><b>{estimate ? `${estimate.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €` : "Aucune présence"}</b></span><em>4,33 semaines moyennes ; absences et présences exceptionnelles non incluses</em></div><div className="privacy-card"><ShieldCheck size={18} /><span><b>Le quotient reste une donnée du foyer</b><small>Il sert uniquement au calcul et n’est jamais envoyé à la Ville par Circle.</small></span></div><footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing}>Mettre à jour le calcul</button></footer></form>}</OverlayFrame>;
}

function ProfileSchoolMemoryFlow({ child, onClose }: { child: CircleRecord; onClose: () => void }) {
  const { updateRecord, syncing } = useCircleData();
  const school = profileSection(child, "school");
  const [bag, setBag] = useState(String(school.bag || ""));
  const [afterSchoolContact, setAfterSchoolContact] = useState(String(school.afterSchoolContact || ""));
  const [entrance, setEntrance] = useState(String(school.entrance || ""));
  const [pickupInstructions, setPickupInstructions] = useState(String(school.pickupInstructions || ""));
  const [saved, setSaved] = useState(false);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await updateRecord(child.id, { payload: { ...child.payload, school: { ...school, bag, afterSchoolContact, entrance, pickupInstructions } } });
    setSaved(true);
  };
  return <OverlayFrame title={saved ? "Repères enregistrés" : `Le quotidien d’école de ${child.title}`} eyebrow="Sac et récupération" onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>Les bonnes informations sont au bon endroit.</h3><p>Elles restent attachées au profil de {child.title} et pourront accompagner une récupération confiée à un proche.</p></div> : <form className="real-form" onSubmit={save}><div className="kindness-note"><NotebookTabs size={19} /><span><b>Un petit écran, quatre repères utiles</b><small>Pas besoin de rouvrir toute la fiche de l’école pour corriger un doudou ou un point de rendez-vous.</small></span></div><label><span>Dans son sac</span><textarea aria-label="Contenu du sac" value={bag} onChange={(event) => setBag(event.target.value)} placeholder="Change complet, pochette, doudou…" /></label><label><span>Référent périscolaire</span><input aria-label="Référent périscolaire" value={afterSchoolContact} onChange={(event) => setAfterSchoolContact(event.target.value)} placeholder="Nom et téléphone si connus" /></label><label><span>Entrée ou point de rendez-vous</span><input aria-label="Point de rendez-vous scolaire" value={entrance} onChange={(event) => setEntrance(event.target.value)} placeholder="Ex. portail côté jardin" /></label><label><span>Consigne de récupération</span><textarea aria-label="Consigne de récupération" value={pickupInstructions} onChange={(event) => setPickupInstructions(event.target.value)} placeholder="Ce qu’un adulte autorisé doit savoir" /></label><footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing}>Enregistrer</button></footer></form>}</OverlayFrame>;
}

function ProfileSchoolDocumentFlow({ child, onClose }: { child: CircleRecord; onClose: () => void }) {
  const { addRecord, uploadDocument } = useCircleData();
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("administrative");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const ready = (nextFile: File, nextExtraction: DocumentExtraction) => { setFile(nextFile); setExtraction(nextExtraction); setTitle(nextExtraction.title || nextFile.name); setDueDate(nextExtraction.dueDate || ""); };
  const save = async () => { if (!file || !extraction) return; setSaving(true); try { const storagePath = await uploadDocument(file); await addRecord({ kind: "document", title: title.trim(), status: "stored", dueAt: dueDate || undefined, payload: { context: "school", personId: child.id, childName: child.title, documentType, reminderDays: dueDate ? 2 : 0, storagePath, fileName: file.name, mimeType: file.type, extracted: { ...extraction, title, dueDate } } }); setSaved(true); } finally { setSaving(false); } };
  return <OverlayFrame title={saved ? "Document rangé" : `Dossier scolaire de ${child.title}`} eyebrow={saved ? "Le foyer est à jour" : "Document privé"} onClose={onClose} wide>{saved ? <div className="flow-success"><span><Check size={25} /></span><h3>{title} est à sa place.</h3><p>{dueDate ? "Circle gardera l’échéance visible dans le profil." : "Le document reste accessible aux membres autorisés du foyer."}</p></div> : <div className="document-workflow"><DocumentPicker domain="school" file={file} extraction={extraction} onReady={ready} compact={false} />{extraction && <div className="document-confirm"><ExtractionNotice extraction={extraction} /><label><span>Nom du document</span><input aria-label="Nom du document scolaire" value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="field-pair"><label><span>Type</span><select aria-label="Type de document scolaire" value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="administrative">Dossier administratif</option><option value="health">Fiche sanitaire ou PAI</option><option value="permission">Autorisation</option><option value="meeting">Réunion ou compte rendu</option><option value="invoice">Facture ou tarif</option><option value="other">Autre</option></select></label><label><span>Échéance facultative</span><input aria-label="Échéance du document scolaire" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div></div>}</div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" type="button" disabled={saving || !file || !extraction || !title.trim()} onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />} Ranger dans son dossier</button>}</footer></OverlayFrame>;
}

function ProfileSchoolDocumentDetailFlow({ child, document, onClose }: { child: CircleRecord; document: CircleRecord; onClose: () => void }) {
  const { updateRecord, deleteRecord, deleteStoredFile, syncing } = useCircleData();
  const [title, setTitle] = useState(document.title);
  const [documentType, setDocumentType] = useState(String(document.payload.documentType || "administrative"));
  const [dueDate, setDueDate] = useState(document.due_at?.slice(0, 10) || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saved, setSaved] = useState(false);
  const save = async (event: React.FormEvent) => { event.preventDefault(); await updateRecord(document.id, { title: title.trim(), dueAt: dueDate || null, payload: { ...document.payload, documentType } }); setSaved(true); };
  const remove = async () => { const path = String(document.payload.storagePath || ""); await deleteRecord(document.id); if (path) await deleteStoredFile(path).catch(() => undefined); onClose(); };
  return <OverlayFrame title={saved ? "Document mis à jour" : document.title} eyebrow={`Dossier scolaire de ${child.title}`} onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>Le dossier est à jour.</h3><p>Le nouveau nom, le type et l’échéance sont enregistrés.</p></div> : <form className="real-form" onSubmit={save}><div className="privacy-card"><FileCheck2 size={18} /><span><b>{String(document.payload.fileName || "Document conservé")}</b><small>Ce fichier reste dans le stockage privé du foyer.</small></span></div><label><span>Nom du document</span><input aria-label="Nom du document scolaire" value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label><span>Type</span><select aria-label="Type de document scolaire" value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="administrative">Dossier administratif</option><option value="health">Fiche sanitaire ou PAI</option><option value="permission">Autorisation</option><option value="meeting">Réunion ou compte rendu</option><option value="invoice">Facture ou tarif</option><option value="other">Autre</option></select></label><label><span>Échéance facultative</span><input aria-label="Échéance du document scolaire" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label><section className="profile-delete"><Trash2 size={19} /><span><b>Supprimer ce document</b><small>Le fichier et son rappel disparaîtront du dossier de {child.title}.</small></span>{confirmDelete ? <button className="danger-button" type="button" onClick={() => void remove()}>Confirmer la suppression</button> : <button className="danger-text" type="button" onClick={() => setConfirmDelete(true)}>Supprimer</button>}</section><footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !title.trim()}>Enregistrer</button></footer></form>}</OverlayFrame>;
}

function ProfileSchoolHolidayFlow({ child, records, onClose }: { child: CircleRecord; records: CircleRecord[]; onClose: () => void }) {
  const { addRecord, updateRecord, deleteRecord, syncing } = useCircleData();
  const holidays = records.filter((record) => record.kind === "event" && record.payload.context === "school_holiday" && record.payload.personId === child.id);
  const [selected, setSelected] = useState<CircleRecord | null>(null);
  const [title, setTitle] = useState("Vacances scolaires");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [coverage, setCoverage] = useState("");
  const [missing, setMissing] = useState("");
  const [saved, setSaved] = useState(false);
  const edit = (record: CircleRecord) => { setSelected(record); setTitle(record.title); setStart(record.starts_at?.slice(0, 10) || ""); setEnd(record.due_at?.slice(0, 10) || ""); setCoverage(String(record.payload.coverage || "")); setMissing(String(record.payload.missing || "")); };
  const reset = () => { setSelected(null); setTitle("Vacances scolaires"); setStart(""); setEnd(""); setCoverage(""); setMissing(""); };
  const save = async (event: React.FormEvent) => { event.preventDefault(); const input = { title, status: missing.trim() ? "to_complete" : "planned", startsAt: start ? new Date(`${start}T08:00`).toISOString() : null, dueAt: end || null, payload: { context: "school_holiday", personId: child.id, childName: child.title, coverage, missing } }; if (selected) await updateRecord(selected.id, input); else await addRecord({ kind: "event", ...input, startsAt: input.startsAt || undefined, dueAt: input.dueAt || undefined }); setSaved(true); };
  const remove = async () => { if (!selected) return; await deleteRecord(selected.id); reset(); };
  return <OverlayFrame title={saved ? "Vacances préparées" : `Vacances de ${child.title}`} eyebrow="Anticiper sans remplir tout l’agenda" onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>La période est visible.</h3><p>{missing ? "Les jours encore découverts pourront devenir une demande d’aide." : "La solution de garde est enregistrée."}</p></div> : <form className="real-form" onSubmit={save}>{holidays.length > 0 && <section className="school-holiday-list"><header><span><b>Périodes enregistrées</b><small>Ouvrez une période pour la corriger.</small></span>{selected && <button className="text-button" type="button" onClick={reset}><Plus size={15} /> Nouvelle</button>}</header>{holidays.map((record) => <button className={selected?.id === record.id ? "active" : ""} type="button" key={record.id} onClick={() => edit(record)}><CalendarDays size={18} /><span><b>{record.title}</b><small>{record.starts_at ? new Intl.DateTimeFormat("fr-FR").format(new Date(record.starts_at)) : "Début à préciser"} · {record.payload.missing ? "reste à organiser" : "préparé"}</small></span><ChevronRight size={16} /></button>)}</section>}<label><span>Nom de la période</span><input aria-label="Nom des vacances" value={title} onChange={(event) => setTitle(event.target.value)} required /></label><div className="field-pair"><label><span>Début</span><input aria-label="Début des vacances" type="date" value={start} onChange={(event) => setStart(event.target.value)} required /></label><label><span>Fin</span><input aria-label="Fin des vacances" type="date" value={end} onChange={(event) => setEnd(event.target.value)} required /></label></div><label><span>Ce qui est déjà couvert</span><textarea aria-label="Couverture des vacances" value={coverage} onChange={(event) => setCoverage(event.target.value)} placeholder="Ex. lundi avec maman, mardi au centre…" /></label><label><span>Ce qui reste à organiser</span><textarea aria-label="Jours à organiser" value={missing} onChange={(event) => setMissing(event.target.value)} placeholder="Ex. mercredi 21 toute la journée" /></label><div className="kindness-note"><HandHeart size={18} /><span><b>Circle n’envoie rien automatiquement</b><small>Les jours non couverts deviennent une proposition que les parents peuvent ajuster.</small></span></div>{selected && <button className="danger-text" type="button" onClick={() => void remove()}>Supprimer cette période</button>}<footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !title.trim() || !start || !end}>{selected ? "Mettre à jour" : "Enregistrer"}</button></footer></form>}</OverlayFrame>;
}

function ProfileSchoolHelpFlow({ child, onClose }: { child: CircleRecord; onClose: () => void }) {
  const { addRecord, syncing } = useCircleData();
  const school = profileSection(child, "school");
  const [need, setNeed] = useState("Récupérer à l’école");
  const [when, setWhen] = useState("");
  const [details, setDetails] = useState("");
  const [saved, setSaved] = useState(false);
  const save = async (event: React.FormEvent) => { event.preventDefault(); await addRecord({ kind: "care_need", title: `${need} · ${child.title}`, status: "draft", startsAt: when ? new Date(when).toISOString() : undefined, payload: { personId: child.id, person: child.title, context: "school", place: school.schoolName || "École", details } }); setSaved(true); };
  return <OverlayFrame title={saved ? "Demande préparée" : `Un coup de main pour ${child.title}`} eyebrow="École et garde" onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>La demande reste en brouillon.</h3><p>Vous pourrez choisir les proches sollicités depuis l’Entourage. Rien n’a été envoyé sans votre accord.</p></div> : <form className="real-form" onSubmit={save}><fieldset><legend>Besoin</legend>{["Déposer à l’école", "Récupérer à l’école", "Garder quelques heures", "Garder une journée"].map((label) => <button className={need === label ? "active" : ""} type="button" key={label} onClick={() => setNeed(label)}>{label}</button>)}</fieldset><label><span>Quand ?</span><input aria-label="Date de la demande d'aide" type="datetime-local" value={when} onChange={(event) => setWhen(event.target.value)} required /></label><label><span>Détail utile</span><textarea aria-label="Détail de la demande d'aide" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Point de rendez-vous, durée, retour attendu…" /></label><div className="privacy-card"><LockKeyhole size={18} /><span><b>Seulement ce qui concerne cette demande</b><small>Le proche ne reçoit ni le dossier scolaire ni les autres informations du foyer.</small></span></div><footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !when}>Préparer la demande</button></footer></form>}</OverlayFrame>;
}

function TodayPanel({ onHandoff, onSchool, onCalendar }: { onHandoff: () => void; onSchool: () => void; onCalendar: () => void }) {
  return <>
    <section className="today-strip">
      <article><span className="tile-icon tile-icon--blue"><School size={20} /></span><div><small>Maintenant</small><strong>Yemaya est à l'école</strong><p>Sortie à 17:00 · Ludiviane la récupère</p></div><button className="text-button" type="button" onClick={onSchool}>Ouvrir <ChevronRight size={16} /></button></article>
      <article className="attention"><span className="date-tile"><b>11</b>SEP</span><div><small>À préparer</small><strong>Sortie à la ferme</strong><p>Autorisation et tenue avant jeudi soir</p></div><button className="text-button" type="button">Préparer <ChevronRight size={16} /></button></article>
      <article><span className="tile-icon"><Clock3 size={20} /></span><div><small>En attente</small><strong>Centre de loisirs</strong><p>Circle relance demain si nécessaire</p></div><span className="quiet-pill">Rien à faire</span></article>
    </section>
    <section className="week-preview">
      <div><span className="eyebrow">La semaine</span><h3>Les prochains passages</h3></div>
      <button type="button" onClick={onHandoff}><Repeat2 size={19} /><span><small>Vendredi · 17:00</small><strong>Relais à l'école</strong></span><ChevronRight size={17} /></button>
      <button type="button" onClick={onCalendar}><Trees size={19} /><span><small>Samedi · 10:00</small><strong>Musée puis nature</strong></span><ChevronRight size={17} /></button>
    </section>
  </>;
}

function Profiles({ person, onPerson, onHelp, onHoliday, onDocument, onSchoolBooking }: { person: Person; onPerson: (person: Person) => void; onHelp: () => void; onHoliday: () => void; onDocument: () => void; onSchoolBooking: () => void }) {
  const [profileMode, setProfileMode] = useState<ProfileMode>(initialProfileMode);
  const child = person === "daughter";
  const dog = person === "dog";
  const name = child ? "Yemaya" : dog ? "Koda" : "Ludiviane";
  return <>
    <div className="profile-switcher"><button className={!child && !dog ? "active" : ""} type="button" onClick={() => { onPerson("mother"); setProfileMode("overview"); }}><Avatar person="mother" /><span><b>Ludiviane</b><small>Maman</small></span></button><button className={child ? "active" : ""} type="button" onClick={() => { onPerson("daughter"); setProfileMode("overview"); }}><Avatar person="daughter" /><span><b>Yemaya</b><small>Fille</small></span></button><button className={dog ? "active" : ""} type="button" onClick={() => { onPerson("dog"); setProfileMode("overview"); }}><Avatar person="dog" /><span><b>Koda</b><small>Chien</small></span></button></div>
    <section className={profileMode === "overview" ? "profile-banner" : "profile-banner profile-banner--detail"}>
      <div className="profile-photo"><Avatar person={person} size="large" /><span><small>{child ? "2 ans" : dog ? "4 ans" : "32 ans"}</small><strong>{name}</strong></span><IconButton label="Modifier le profil"><Pencil size={17} /></IconButton></div>
      <div className="profile-now"><span className="eyebrow"><SunMedium size={15} /> Maintenant</span><h2>{child ? "À l'école jusqu'à 17:00" : dog ? "À la maison" : "Au travail jusqu'à 17:00"}</h2><p>{child ? "Chez Ludiviane ce soir." : dog ? "Prochaine sortie à 18:30." : "Disponible à partir de 17:30."}</p><div className="profile-nav"><button className={profileMode === "overview" ? "active" : ""} onClick={() => setProfileMode("overview")} type="button">Repères</button>{child && <button className={profileMode === "school" ? "active" : ""} onClick={() => setProfileMode("school")} type="button">École <i>2</i></button>}<button className={profileMode === "health" ? "active" : ""} onClick={() => setProfileMode("health")} type="button">Santé</button></div></div>
      <div className="profile-links"><QuickLink icon={dog ? <PawPrint size={18} /> : <MapPin size={18} />} label={dog ? "Ses sorties" : "Ses lieux"} value={child ? "Maison · École" : dog ? "Matin · Midi · Soir" : "Maison · Travail"} /><QuickLink icon={dog ? <Stethoscope size={18} /> : <Car size={18} />} label={dog ? "Vétérinaire" : "Ses biens"} value={child ? "Aucun suivi" : dog ? "Vaccins à jour" : "Peugeot 208"} /><QuickLink icon={<CalendarDays size={18} />} label="À venir" value={child ? "Ferme · 11 sept." : dog ? "Rappel vaccin · 8 oct." : "Contrôle technique"} /></div>
    </section>
    {profileMode === "overview" && <ProfileOverview child={child} dog={dog} onSchool={() => setProfileMode("school")} onHelp={onHelp} />}
    {profileMode === "school" && child && <SchoolHub onHoliday={onHoliday} onDocument={onDocument} onHelp={onHelp} onBooking={onSchoolBooking} />}
    {profileMode === "health" && <HealthHub child={child} dog={dog} />}
  </>;
}

function QuickLink({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <button type="button"><span>{icon}</span><span><small>{label}</small><strong>{value}</strong></span><ChevronRight size={17} /></button>; }

function ProfileOverview({ child, dog, onSchool, onHelp }: { child: boolean; dog: boolean; onSchool: () => void; onHelp: () => void }) {
  return <section className="profile-grid">
    <article><span className="eyebrow">Rythme</span><h3>{child ? "Sa journée" : dog ? "Ses sorties" : "Ses disponibilités"}</h3><div className="routine-line"><time>{child ? "06:10" : dog ? "07:00" : "08:30"}</time><i /><span>{child ? "Réveil" : dog ? "3 sorties" : "Travail"}</span><time>{child ? "19:30" : dog ? "21:30" : "17:30"}</time></div><button className="text-button" type="button">Voir le rythme <ChevronRight size={16} /></button></article>
    <article><span className="eyebrow">Organisation</span><h3>{child ? "Garde alternée" : dog ? "Qui s'en occupe" : "Cette semaine"}</h3><div className="custody-bar"><span style={{ width: dog ? "58%" : "72%" }}>Ludiviane</span><span style={{ width: dog ? "42%" : "28%" }}>Aimé</span></div><button className="text-button" type="button" onClick={dog ? onHelp : undefined}>{dog ? "Prévoir une aide" : "Voir les relais"} <ChevronRight size={16} /></button></article>
    {child && <article className="school-card"><img src="/art/circle-school-life-v1.png" alt="" /><div><span className="eyebrow">École</span><h3>La semaine est prête</h3><p>Un document attend une signature.</p><button className="primary-button primary-button--forest" type="button" onClick={onSchool}>Ouvrir l'école</button></div></article>}
    {dog && <article className="school-card pet-card"><img src="/art/circle-koda-avatar-v1.png" alt="" /><div><span className="eyebrow">À anticiper</span><h3>Mercredi midi</h3><p>Personne n'est disponible pour sa sortie.</p><button className="primary-button primary-button--forest" type="button" onClick={onHelp}>Trouver quelqu'un</button></div></article>}
  </section>;
}

function SchoolHub({ onHoliday, onDocument, onHelp, onBooking }: { onHoliday: () => void; onDocument: () => void; onHelp: () => void; onBooking: () => void }) {
  const { records } = useCircleData();
  const booking = records.find((record) => record.kind === "school_booking");
  const documents = records.filter((record) => record.kind === "document" && record.payload.context === "school");
  const fridayEvening = Boolean(booking?.payload.fridayEvening);
  const schoolAmount = Number(booking?.payload.estimatedAmount || 90.24);
  return <section className="school-hub school-hub--rich">
    <header className="school-identity"><div><span className="eyebrow"><School size={15} /> Petite section</span><h2>Pépinières Saint-Julien</h2><p>Jenny Langevin · Fatma Yilmaz · entrée côté jardin</p></div><button className="secondary-button" type="button"><Phone size={17} /> Appeler l'école</button></header>
    <div className="school-today">
      <div><span className="eyebrow">Aujourd'hui</span><h3>Une journée simple à suivre.</h3><p>Les horaires importants, sans afficher tout l'emploi du temps.</p></div>
      <div className="school-day"><SchoolStep time="07:45" title="Accueil" tone="blue" /><SchoolStep time="08:20" title="Classe" tone="green" /><SchoolStep time="12:00" title="Midi" tone="gold" /><SchoolStep time="16:30" title="Goûter" tone="coral" /><SchoolStep time="17:05" title="1re sortie" tone="ink" /></div>
      <aside><CalendarClock size={19} /><span><small>Ce soir</small><b>Récupération entre 17:30 et 18:00</b></span></aside>
    </div>
    <div className="school-columns">
      <article className="school-services"><div className="block-heading"><div><small>Cette semaine</small><h3>Réservations</h3></div><IconButton label="Modifier les réservations" onClick={onBooking}><Pencil size={16} /></IconButton></div><ServiceLine day="Lun" values="Matin · Midi · Soir" /><ServiceLine day="Mar" values="Midi · Soir" /><ServiceLine day="Jeu" values="Matin · Midi · Soir" /><ServiceLine day="Ven" values={fridayEvening ? "Midi · Soir" : "Midi"} /><button className="text-button" type="button" onClick={onBooking}>Modifier la semaine <ChevronRight size={16} /></button><small className="school-deadline">{booking ? "Dernière modification enregistrée" : "Modifiable jusqu'à J-2 · selon le jour de garde"}</small></article>
      <article className="school-wednesday"><div className="block-heading"><div><small>Mercredi 16</small><h3>Centre de loisirs</h3></div><span className="sync-pill"><Check size={14} /> Réservé</span></div><div className="wednesday-times"><span><Clock3 size={17} /><small>Arrivée</small><b>08:00 - 09:00</b></span><span><Clock3 size={17} /><small>Départ</small><b>17:00 - 18:00</b></span></div><p>Journée et repas · 13,14 €</p><button className="text-button" type="button" onClick={onBooking}>Voir les mercredis <ChevronRight size={16} /></button><small className="school-deadline">Annulation jusqu'à 15 jours avant</small></article>
      <article className="school-documents"><div className="block-heading"><div><small>Dossier</small><h3>L'essentiel</h3></div><IconButton label="Ajouter un document" onClick={onDocument}><Plus size={16} /></IconButton></div>{documents.map((record) => <DocumentLine key={record.id} title={record.title} status="Ajouté à Circle · à jour" />)}<DocumentLine title="Fiche sanitaire" status="École + centre · valide" /><DocumentLine title="Vaccins" status="À jour" /><DocumentLine title="Personnes autorisées" status="3 personnes" /><DocumentLine title="Réunion de rentrée" status="10 sept. · 17:30" urgent /><button className="text-button" type="button" onClick={onDocument}>Tout le dossier <ChevronRight size={16} /></button></article>
    </div>
    <div className="school-cost">
      <span className="tile-icon tile-icon--gold"><ReceiptText size={20} /></span><div><small>Estimation de septembre</small><strong>{schoolAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</strong><p>4 matins · 12 midis · {fridayEvening ? 9 : 8} soirs · 2 mercredis</p></div><div className="school-cost__rule"><small>Quotient enregistré</small><b>851 - 1 150</b><em>{booking ? "Prévision synchronisée" : "Facture vers le 15 octobre"}</em></div><button className="secondary-button" type="button" onClick={onBooking}>Voir le calcul</button>
    </div>
    <div className="school-memory"><button type="button"><span className="tile-icon"><NotebookTabs size={18} /></span><span><small>Dans son sac</small><b>Change complet · pochette · doudou</b></span><ChevronRight size={16} /></button><button type="button"><span className="tile-icon"><Phone size={18} /></span><span><small>Référent périscolaire</small><b>Laurent Ledemé</b></span><ChevronRight size={16} /></button><button type="button" onClick={onHoliday}><span className="tile-icon"><Trees size={18} /></span><span><small>Prochaine coupure</small><b>Toussaint · 17 oct. au 2 nov.</b></span><ChevronRight size={16} /></button></div>
    <div className="school-footer"><div><span className="tile-icon tile-icon--blue"><UsersRound size={20} /></span><span><small>Un imprévu ?</small><strong>Préparer une récupération ou une garde</strong></span></div><button className="secondary-button" type="button" onClick={onHelp}>Demander à un proche</button></div>
  </section>;
}

function SchoolStep({ time, title, tone }: { time: string; title: string; tone: string }) { return <div className={`school-step school-step--${tone}`}><time>{time}</time><i /><strong>{title}</strong></div>; }
function ServiceLine({ day, values, active = true }: { day: string; values: string; active?: boolean }) { return <div className={active ? "service-line" : "service-line service-line--empty"}><b>{day}</b><span>{values}</span>{active ? <Check size={16} /> : <Plus size={16} />}</div>; }
function DocumentLine({ title, status, urgent, onClick }: { title: string; status: string; urgent?: boolean; onClick?: () => void }) { return <button className={urgent ? "document-line urgent" : "document-line"} type="button" onClick={onClick} aria-label={onClick ? `Ouvrir ${title}` : undefined}><FileText size={17} /><span><b>{title}</b><small>{status}</small></span><ChevronRight size={16} /></button>; }

function HealthHub({ child, dog }: { child: boolean; dog: boolean }) { return <section className="health-hub"><article><span className="tile-icon tile-icon--coral">{dog ? <Stethoscope size={21} /> : <HeartPulse size={21} />}</span><div><small>Prochain rendez-vous</small><h3>{child ? "Pédiatre · 12 septembre" : dog ? "Vaccin · 8 octobre" : "Aucun rendez-vous"}</h3><p>{child ? "Carnet de santé à emporter." : dog ? "Carnet vétérinaire prêt." : "Rien à préparer."}</p></div></article><article><span className="tile-icon"><ShieldCheck size={21} /></span><div><small>{dog ? "Protection" : "Traitement"}</small><h3>{dog ? "Antiparasitaire à jour" : "Aucun traitement en cours"}</h3><p>Les informations sensibles restent privées.</p></div></article></section>; }

function FamilyCalendar({ onHandoff, onHelp }: { onHandoff: () => void; onHelp: () => void }) {
  const [day, setDay] = useState("ven");
  const days = [["lun", "Lun", "7"], ["mar", "Mar", "8"], ["mer", "Mer", "9"], ["jeu", "Jeu", "10"], ["ven", "Ven", "11"], ["sam", "Sam", "12"], ["dim", "Dim", "13"]];
  return <section className="calendar-shell"><header><div><span className="eyebrow">7 - 13 septembre</span><h2>Agenda familial</h2></div><div><IconButton label="Semaine précédente"><ChevronLeft size={18} /></IconButton><IconButton label="Semaine suivante"><ChevronRight size={18} /></IconButton></div></header><div className="calendar-tools"><span><Avatar person="daughter" size="tiny" /> Yemaya</span><span><Avatar person="mother" size="tiny" /> Ludiviane</span><span><i className="avatar-initial">A</i> Aimé</span><button className="secondary-button" type="button"><Search size={17} /> Trouver un créneau</button></div><div className="week-picker">{days.map(([id, label, date]) => <button key={id} className={day === id ? "active" : ""} type="button" onClick={() => setDay(id)}><small>{label}</small><b>{date}</b>{id === "ven" && <i />}</button>)}</div><div className="agenda-list"><AgendaRow person="daughter" name="Yemaya" text={day === "sam" ? "Musée · déjeuner · sieste · nature" : "École · relais 17:00"} tone="coral" /><AgendaRow person="mother" name="Ludiviane" text={day === "sam" ? "Disponible après 14:00" : "Travail jusqu'à 17:00"} tone="blue" /><AgendaRow name="Aimé" text={day === "sam" ? "Avec Yemaya" : "Récupère Yemaya à 17:00"} tone="green" /></div><footer><div><span className="date-tile"><b>11</b>SEP</span><span><small>Prochain point commun</small><strong>Relais à l'école · 17:00</strong></span></div><div><button className="text-button" type="button" onClick={onHelp}>Demander de l'aide</button><button className="primary-button primary-button--forest" type="button" onClick={onHandoff}>Préparer</button></div></footer></section>;
}

function AgendaRow({ person, name, text, tone }: { person?: Person; name: string; text: string; tone: string }) { return <article><span>{person ? <Avatar person={person} size="tiny" /> : <i className="avatar-initial">A</i>}<b>{name}</b></span><div className={`agenda-line agenda-line--${tone}`}><Clock3 size={15} />{text}</div></article>; }

function TrustedCircle({ onOverlay }: { onOverlay: (overlay: Overlay) => void }) {
  const [mode, setMode] = useState<CircleMode>("needs");
  const { records } = useCircleData();
  const openNeeds = records.filter((record) => record.kind === "care_need" && record.status !== "completed").length;
  const modes: Array<[CircleMode, string, React.ReactNode]> = [
    ["needs", "Besoins", <HandHeart size={17} />],
    ["people", "Mon cercle", <UsersRound size={17} />],
    ["availability", "Disponibilités", <CalendarClock size={17} />],
    ["services", "Services", <BriefcaseBusiness size={17} />],
  ];
  return <section className="circle-hub">
    <header className="circle-hub__hero">
      <div><span className="eyebrow">Entourage</span><h2>L'aide arrive avant l'urgence.</h2><p>Circle cherche d'abord dans votre cercle de confiance.</p><div><button className="primary-button" type="button" onClick={() => onOverlay("need")}><Plus size={18} /> Définir un besoin</button><button className="text-button" type="button" onClick={() => onOverlay("helper-space")}>Voir l'espace d'un proche <ChevronRight size={16} /></button></div></div>
      <img src="/art/circle-help-network-v2.png" alt="Le foyer entouré de proches disponibles pour aider" />
    </header>
    <nav className="circle-hub__tabs" aria-label="Organisation de l'entourage">{modes.map(([id, label, icon]) => <button key={id} className={mode === id ? "active" : ""} type="button" onClick={() => setMode(id)}>{icon}<span>{label}</span>{id === "needs" && <i>{2 + openNeeds}</i>}</button>)}</nav>
    {mode === "needs" && <NeedsBoard onNeed={() => onOverlay("need")} onHelp={() => onOverlay("help")} onProposal={() => onOverlay("visit-request")} />}
    {mode === "people" && <CirclePeople onHelper={() => onOverlay("helper-space")} onHelp={() => onOverlay("help")} onMap={() => onOverlay("circle-map")} />}
    {mode === "availability" && <CircleAvailability onEdit={() => onOverlay("availability")} />}
    {mode === "services" && <CircleServices onNeed={() => onOverlay("need")} />}
  </section>;
}

function NeedsBoard({ onNeed, onHelp, onProposal }: { onNeed: () => void; onHelp: () => void; onProposal: () => void }) {
  const { records } = useCircleData();
  const liveNeeds = records.filter((record) => record.kind === "care_need");
  return <div className="needs-board">
    <section className="needs-main">
      <header className="block-heading"><div><span className="eyebrow">Les 7 prochains jours</span><h3>Ce qui se prépare autour du foyer.</h3></div><button className="secondary-button" type="button" onClick={onNeed}><Plus size={17} /> Ajouter</button></header>
      <button className="incoming-proposal" type="button" onClick={onProposal}><span className="helper-avatar">MM</span><span><small>Marie propose un moment</small><b>« J’aimerais voir Yemaya ce week-end. »</b><em>Circle a trouvé un créneau qui respecte sa sieste.</em></span><span className="need-status need-status--coral">À décider</span><ChevronRight size={18} /></button>
      {liveNeeds.map((record) => <NeedCard key={record.id} icon={<HandHeart size={19} />} person={String(record.payload.person || "Le foyer")} title={record.title} meta={record.starts_at ? "Demande datée · visible dans l'agenda" : "Demande enregistrée"} helper={record.status === "sent" ? "Envoyée" : "Recherche en cours"} tone="gold" />)}
      <NeedCard icon={<School size={19} />} person="Yemaya" title="Récupération à l'école" meta="Vendredi · 17:00" helper="Marie a accepté" tone="green" />
      <NeedCard icon={<PawPrint size={19} />} person="Koda" title="Sortie du midi" meta="Mercredi · 12:30 · 30 min" helper="À trouver" tone="gold" action="Chercher" onClick={onHelp} />
      <NeedCard icon={<Leaf size={19} />} person="Le logement" title="Arroser les plantes" meta="Dimanche · passage libre" helper="Sarah a accepté" tone="green" />
    </section>
    <aside className="circle-suggestion">
      <span className="suggestion-mark"><WandSparkles size={22} /></span><span className="eyebrow">Circle a repéré</span><h3>Mercredi matin reste découvert.</h3><p>Yemaya n'a pas classe et les deux parents travaillent.</p><button className="primary-button primary-button--forest" type="button" onClick={onNeed}>Préparer une demande</button><button className="text-button" type="button">Pas cette fois</button>
      <small><ShieldCheck size={14} /> Rien n'est envoyé sans votre accord.</small>
    </aside>
    <footer className="coverage-rule"><span><LockKeyhole size={17} /></span><div><b>Du plus proche au plus adapté</b><small>Famille, amis, puis professionnel si vous le choisissez.</small></div><span className="coverage-steps"><i className="done">1</i><em /><i>2</i><em /><i>3</i></span></footer>
  </div>;
}

function NeedCard({ icon, person, title, meta, helper, tone, action, onClick }: { icon: React.ReactNode; person: string; title: string; meta: string; helper: string; tone: string; action?: string; onClick?: () => void }) {
  return <article className="need-card"><span className={`tile-icon tile-icon--${tone}`}>{icon}</span><span><small>{person}</small><b>{title}</b><em>{meta}</em></span><span className={`need-status need-status--${tone}`}>{tone === "green" && <Check size={14} />}{helper}</span>{action ? <button className="text-button" type="button" onClick={onClick}>{action}<ChevronRight size={15} /></button> : <IconButton label={`Ouvrir ${title}`}><ChevronRight size={16} /></IconButton>}</article>;
}

function CirclePeople({ onHelper, onHelp, onMap }: { onHelper: () => void; onHelp: () => void; onMap: () => void }) {
  return <div className="circle-people">
    <header><div><span className="eyebrow">Votre cercle</span><h3>Chacun aide à sa manière.</h3></div><button className="secondary-button" type="button"><Plus size={17} /> Inviter</button></header>
    <div className="people-rings"><span>Foyer</span><strong>Famille</strong><em>Proches</em></div>
    <div className="helper-grid"><TrustedPerson initials="MM" name="Marie" relation="Grand-mère" access="Vendredis · sorties d'école" onClick={onHelper} status="Disponible" /><TrustedPerson initials="JB" name="Jean-Baptiste" relation="Oncle" access="Week-ends · sur demande" onClick={onHelper} status="À confirmer" /><TrustedPerson initials="SA" name="Sarah" relation="Amie" access="Maison et Koda" onClick={onHelper} status="Disponible" /></div>
    <button className="circle-map-preview" type="button" onClick={onMap}><img src="/art/circle-entourage-map-v1.png" alt="Carte illustrée des lieux de vie de l'entourage" /><span><small>À proximité</small><b>Votre entourage, autour de vous.</b><em><MapPin size={15} /> Marie 12 min · Jean-Baptiste 18 min · Sarah 9 min</em></span><span className="map-open"><MapPinned size={19} /> Voir la carte</span></button>
    <aside><ShieldCheck size={21} /><div><b>Une demande, un accès temporaire.</b><small>Le proche voit l'heure, le lieu et les consignes utiles. Aucun dossier du foyer.</small></div><button className="text-button" type="button" onClick={onHelp}>Tester une demande <ChevronRight size={16} /></button></aside>
  </div>;
}

function TrustedPerson({ initials, name, relation, access, status, onClick }: { initials: string; name: string; relation: string; access: string; status: string; onClick: () => void }) { return <button className="trusted-person" type="button" onClick={onClick}><i>{initials}</i><span><small>{relation}</small><b>{name}</b><em>{access}</em></span><span className="availability-dot"><i />{status}</span><ChevronRight size={17} /></button>; }

function CircleAvailability({ onEdit }: { onEdit: () => void }) {
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const { records } = useCircleData();
  const saved = records.find((record) => record.kind === "event" && record.payload.context === "availability");
  return <div className="availability-board"><header><div><span className="eyebrow">Semaine habituelle</span><h3>Qui peut aider, et quand.</h3></div><button className="secondary-button" type="button" onClick={onEdit}><Pencil size={17} /> Mes disponibilités</button></header><div className="availability-grid"><span /><>{days.map(day => <b key={day}>{day}</b>)}</><AvailabilityRow initials="LD" name="Vous" slots={saved ? [1,0,0,0,1,1,0] : [0,0,0,0,0,0,0]} /><AvailabilityRow initials="MM" name="Marie" slots={[0,0,1,0,1,1,0]} /><AvailabilityRow initials="JB" name="J.-B." slots={[0,0,0,0,0,1,1]} /><AvailabilityRow initials="SA" name="Sarah" slots={[0,1,1,0,0,0,1]} /></div><footer><CalendarClock size={19} /><span><small>{saved ? "Vos disponibilités sont prises en compte" : "Meilleur créneau commun"}</small><b>{saved ? "Préavis · la veille" : "Samedi · 10:00 - 12:00"}</b></span><button className="text-button" type="button">Voir les exceptions <ChevronRight size={16} /></button></footer></div>;
}

function AvailabilityRow({ initials, name, slots }: { initials: string; name: string; slots: number[] }) { return <><span className="availability-person"><i>{initials}</i><b>{name}</b></span>{slots.map((slot, index) => <span className={slot ? "slot available" : "slot"} key={`${name}-${index}`}>{slot ? <Check size={14} /> : "–"}</span>)}</>; }

function CircleServices({ onNeed }: { onNeed: () => void }) {
  return <div className="services-market"><header><div><span className="eyebrow">En dernier recours</span><h3>Un professionnel, seulement si besoin.</h3><p>Circle propose une solution quand votre entourage n'est pas disponible.</p></div><span><ShieldCheck size={16} /> Partenaires vérifiés</span></header><div className="service-cards"><MarketService icon={<UserCheck size={21} />} title="Garde d'enfants" meta="Dès 2 heures · profils vérifiés" price="à partir de 22 € / h" /><MarketService icon={<Dog size={21} />} title="Promenade de Koda" meta="30 ou 60 minutes" price="à partir de 12 €" /><MarketService icon={<Sparkles size={21} />} title="Aide à la maison" meta="Ménage ou linge" price="à partir de 26 € / h" /></div><footer><Info size={17} /><span>Les offres sponsorisées sont signalées et ne passent jamais devant un proche disponible.</span><button className="primary-button primary-button--forest" type="button" onClick={onNeed}>Décrire mon besoin</button></footer></div>;
}

function MarketService({ icon, title, meta, price }: { icon: React.ReactNode; title: string; meta: string; price: string }) { return <button type="button"><span className="tile-icon tile-icon--blue">{icon}</span><span><b>{title}</b><small>{meta}</small><em>{price}</em></span><ChevronRight size={17} /></button>; }

function HomeView({ onOverlay }: { onOverlay: (overlay: Overlay) => void }) {
  const [mode, setMode] = useState<HomeMode>(initialHomeMode);
  const { records } = useCircleData();
  const maintenanceRecords = records.filter((record) => record.kind === "maintenance");
  const maintenanceCount = Math.max(1, maintenanceRecords.length);
  const modes: Array<[HomeMode, string, React.ReactNode]> = [["contracts", "Contrats", <FileText size={17} />], ["equipment", "Équipements", <PackageCheck size={17} />], ["maintenance", "Maintenance", <Wrench size={17} />], ["improvements", "Améliorations", <Sparkles size={17} />]];
  const action: [string, React.ReactNode, Overlay] = mode === "contracts" ? ["Ajouter un document", <Upload size={18} />, "contract-document"] : mode === "equipment" ? ["Ajouter un équipement", <Plus size={18} />, "add-equipment"] : mode === "maintenance" ? ["Planifier", <CalendarClock size={18} />, "plan-care"] : ["Nouveau projet", <Plus size={18} />, "improvement-flow"];
  return <main className="view">
    <div className="section-toolbar home-toolbar"><div className="segmented">{modes.map(([id, label, icon]) => <button className={mode === id ? "active" : ""} aria-label={label} title={label} onClick={() => setMode(id)} type="button" key={id}>{icon}<span>{label}</span>{id === "maintenance" && <i className="tab-alert">{maintenanceCount} à traiter</i>}</button>)}</div><button className="secondary-button" type="button" aria-label={action[0]} title={action[0]} onClick={() => onOverlay(action[2])}>{action[1]}<span>{action[0]}</span></button></div>
    <HomeStage mode={mode} onAction={() => onOverlay(mode === "contracts" ? "add-contract" : mode === "equipment" ? "add-equipment" : mode === "maintenance" ? "report-issue" : "improvement-flow")} />
    {mode === "contracts" && <Contracts onDocument={() => onOverlay("contract-document")} onAdd={() => onOverlay("add-contract")} />}
    {mode === "equipment" && <EquipmentHub onDetail={() => onOverlay("equipment-detail")} onAdd={() => onOverlay("add-equipment")} />}
    {mode === "maintenance" && <HomeCare records={maintenanceRecords} onReport={() => onOverlay("report-issue")} onPlan={() => onOverlay("plan-care")} />}
    {mode === "improvements" && <ImprovementsHub onCreate={() => onOverlay("improvement-flow")} />}
  </main>;
}

function HomeStage({ mode, onAction }: { mode: HomeMode; onAction: () => void }) {
  const data = mode === "contracts" ? { eyebrow: "Contrats", title: "La maison est prête.", note: "Cinq essentiels, suivis sans y penser.", action: "Ajouter un contrat", art: "/art/circle-home-contracts-hero-v1.png", icon: <Plus size={18} /> } : mode === "equipment" ? { eyebrow: "Équipements", title: "Tout ce qui fait la maison.", note: "Garanties et entretien, au bon moment.", action: "Ajouter un équipement", art: "/art/circle-home-equipment-v1.png", icon: <PackageCheck size={18} /> } : mode === "maintenance" ? { eyebrow: "Maintenance", title: "La maison reste sereine.", note: "Un sujet à traiter. Le reste suit son rythme.", action: "Signaler un problème", art: "/art/circle-home-life-hero-v1.png", icon: <Wrench size={18} /> } : { eyebrow: "Améliorations", title: "Le confort avance.", note: "Des idées aux travaux, sans perdre le fil.", action: "Imaginer une amélioration", art: "/art/circle-home-improvement-cutout-v2.png", icon: <Sparkles size={18} /> };
  return <section className={`context-stage context-stage--home context-stage--home-${mode}`}>
    <div className="context-stage__copy"><span className="eyebrow">{data.eyebrow}</span><h2>{data.title}</h2><p>{data.note}</p><button className="primary-button" type="button" onClick={onAction}>{data.icon}{data.action}</button></div>
    <div className="context-stage__art"><img src={data.art} alt="" /></div>
  </section>;
}

type ContractId = "bail" | "electricity" | "gas" | "water" | "insurance";
type ContractReading = { id: ContractId; label: string; provider: string; amount: string; image: string; icon: React.ReactNode; split: string; next: string; nextMeta: string; metrics: Array<{ label: string; value: string; note: string; tone?: string }>; bars: number[]; chartLabel: string };

const contractReadings: ContractReading[] = [
  { id: "bail", label: "Bail", provider: "Mon Saint André Immobilier", amount: "911,46 €", image: "/art/circle-contract-lease-v1.png", icon: <House size={19} />, split: "826,46 € de loyer · 85 € de provisions", next: "Révision du loyer", nextMeta: "15 avril 2027", metrics: [{ label: "Depuis avril 2024", value: "+2,1 %", note: "+18,54 € par mois", tone: "warm" }, { label: "Loyer hors charges", value: "826,46 €", note: "Stable depuis avril" }, { label: "Provisions", value: "85 €", note: "Régularisation annuelle" }], bars: [72, 72, 77, 77, 84], chartLabel: "Évolution du loyer sur cinq périodes" },
  { id: "electricity", label: "Électricité", provider: "happ-e", amount: "96,20 €", image: "/art/circle-contract-electricity-v1.png", icon: <Bolt size={19} />, split: "Mensualité ajustée sur la consommation réelle", next: "Prochain prélèvement", nextMeta: "12 septembre", metrics: [{ label: "Ce mois-ci", value: "214 kWh", note: "Dans votre rythme habituel" }, { label: "Face à l'an dernier", value: "-8 %", note: "18 kWh de moins", tone: "good" }, { label: "Projection annuelle", value: "1 154 €", note: "Mensualité cohérente" }], bars: [70, 58, 62, 51, 48, 44], chartLabel: "Consommation électrique des six derniers mois" },
  { id: "gas", label: "Gaz", provider: "happ-e", amount: "58,40 €", image: "/art/circle-contract-gas-v1.png", icon: <Flame size={19} />, split: "Chauffage et eau chaude", next: "Relevé conseillé", nextMeta: "30 septembre", metrics: [{ label: "Ce mois-ci", value: "386 kWh", note: "Le chauffage reste éteint" }, { label: "À météo comparable", value: "+4 %", note: "À observer cet hiver", tone: "warm" }, { label: "Repère annuel", value: "6 800 kWh", note: "Objectif du contrat" }], bars: [88, 70, 51, 24, 16, 19], chartLabel: "Consommation de gaz des six derniers mois" },
  { id: "water", label: "Eau", provider: "Métropole Rouen Normandie", amount: "24,80 €", image: "/art/circle-contract-water-v1.png", icon: <Droplets size={19} />, split: "Estimation mensuelle · facture trimestrielle", next: "Transmettre le compteur", nextMeta: "28 septembre", metrics: [{ label: "Ce mois-ci", value: "7,8 m³", note: "Pour le foyer" }, { label: "Face au mois dernier", value: "-0,6 m³", note: "Usage en baisse", tone: "good" }, { label: "Dernier relevé", value: "1 284 m³", note: "31 août" }], bars: [62, 69, 64, 58, 55, 49], chartLabel: "Consommation d'eau des six derniers mois" },
  { id: "insurance", label: "Assurance habitation", provider: "MAIF", amount: "17,30 €", image: "/art/circle-contract-insurance-v1.png", icon: <ShieldCheck size={19} />, split: "Appartement et responsabilité civile", next: "Renouvellement", nextMeta: "1 janvier 2027", metrics: [{ label: "Cotisation annuelle", value: "207,60 €", note: "Paiement mensuel" }, { label: "Évolution 2026", value: "+4,20 €", note: "Sur l'année", tone: "warm" }, { label: "Franchise", value: "150 €", note: "Dégât des eaux" }], bars: [54, 54, 54, 58, 58], chartLabel: "Évolution de la cotisation sur cinq périodes" },
];

function Contracts({ onDocument, onAdd }: { onDocument: () => void; onAdd: () => void }) {
  const [selected, setSelected] = useState<ContractId>("bail");
  const { records } = useCircleData();
  const addedContracts = records.filter((record) => record.kind === "contract");
  const current = contractReadings.find(row => row.id === selected)!;
  const latestDocument = records.find((record) => record.kind === "document" && record.payload.context === "contract" && record.payload.contractType === selected);
  const extracted = (latestDocument?.payload.extracted || {}) as Partial<DocumentExtraction>;
  const displayedAmount = typeof extracted.amount === "number" ? formatDocumentAmount(extracted.amount) : current.amount;
  const displayedProvider = extracted.provider || current.provider;
  const displayedDueDate = extracted.dueDate || current.nextMeta;
  const labels = current.id === "bail" ? ["Avr. 24", "Oct. 24", "Avr. 25", "Oct. 25", "Avr. 26"] : current.id === "insurance" ? ["2022", "2023", "2024", "2025", "2026"] : ["Mars", "Avr.", "Mai", "Juin", "Juil.", "Août"];
  const values = current.id === "bail" ? ["892 €", "892 €", "899 €", "899 €", "911 €"] : current.id === "electricity" ? ["338", "280", "299", "247", "232", "214 kWh"] : current.id === "gas" ? ["1 780", "1 420", "990", "470", "320", "386 kWh"] : current.id === "water" ? ["9,8", "10,6", "10,1", "9,2", "8,4", "7,8 m³"] : ["191 €", "191 €", "194 €", "203 €", "207 €"];
  const insight = latestDocument ? `Mis à jour depuis ${latestDocument.title}. Les valeurs extraites restent modifiables.` : current.id === "bail" ? "Le dernier changement ajoute 18,54 € par mois. Prochaine révision en avril 2027." : current.id === "electricity" ? "La consommation baisse depuis trois mois. La mensualité reste adaptée." : current.id === "gas" ? "La petite hausse d'août reste sans alerte. Circle surveillera l'hiver." : current.id === "water" ? "La consommation revient sous 8 m³. Aucun signe de fuite détecté." : "La hausse reste limitée à 4,20 € cette année. Les garanties n'ont pas changé.";
  return <section className="contract-shell contract-shell--rich"><aside><header><small>{5 + addedContracts.length} contrats suivis</small><b>1 108,16 € / mois</b></header>{contractReadings.map(row => <button key={row.id} className={selected === row.id ? "active" : ""} type="button" onClick={() => setSelected(row.id)}><img className="contract-thumb" src={row.image} alt="" /><span><b>{row.label}</b><small>{row.id === selected ? displayedAmount : row.amount} / mois</small></span><ChevronRight size={16} /></button>)}{addedContracts.map((record) => { const type = String(record.payload.contractType || "bail") as ContractId; const visual = contractReadings.find((row) => row.id === type) || contractReadings[0]; return <button key={record.id} type="button" onClick={() => setSelected(type)}><img className="contract-thumb" src={visual.image} alt="" /><span><b>{record.title}</b><small>{String(record.payload.amount || "Montant à préciser")}</small></span><Check size={16} /></button>; })}<button className="contract-add" type="button" onClick={onAdd}><span><Plus size={18} /></span><span><b>Ajouter un contrat</b><small>Un autre essentiel</small></span></button></aside><article className="contract-focus"><header><span className="tile-icon">{current.icon}</span><div><small>{current.label}</small><h2>{current.label}</h2><p>{displayedProvider}</p></div><span className="sync-pill"><Check size={14} /> {latestDocument ? "Document lu" : "À jour"}</span></header><div className="contract-main"><div><small>Chaque mois</small><strong>{displayedAmount}</strong><p>{current.split}</p></div><img src={current.image} alt="" /></div><div className="contract-reading"><header><span><Gauge size={17} /> Repères utiles</span><small>{current.chartLabel}</small></header><div className="contract-metrics">{current.metrics.map(metric => <article className={metric.tone ? `metric-${metric.tone}` : ""} key={metric.label}><small>{metric.label}</small><strong>{metric.value}</strong><span>{metric.note}</span></article>)}</div><div className="history-chart" aria-label={current.chartLabel}>{current.bars.map((height, index) => <span key={`${current.id}-${index}`}><em>{values[index]}</em><i style={{ height: `${height}%` }} /><small>{labels[index]}</small></span>)}</div><p className="chart-insight"><Sparkles size={15} />{insight}</p></div><button className="contract-next" type="button" onClick={onDocument}><CalendarDays size={19} /><span><small>À venir</small><b>{current.next}</b><em>{displayedDueDate}</em></span><ChevronRight size={17} /></button><footer><button className="secondary-button" type="button" onClick={onDocument}><Upload size={17} /> Ajouter un document</button><button className="text-button" type="button" onClick={onDocument}><FileText size={16} /> Contrat et historique</button></footer></article></section>;
}

function HomeCare({ records, onReport, onPlan }: { records: CircleRecord[]; onReport: () => void; onPlan: () => void }) {
  const issueCount = Math.max(1, records.length);
  return <section className="care-shell care-shell--rich"><div className="home-status-strip"><article><span className="tile-icon tile-icon--coral"><Lightbulb size={19} /></span><span><small>À traiter</small><b>{issueCount} {issueCount > 1 ? "sujets ouverts" : "avant vendredi"}</b></span></article><article><span className="tile-icon"><CalendarClock size={19} /></span><span><small>Passages prévus</small><b>2 cette semaine</b></span></article><article><span className="tile-icon tile-icon--gold"><Repeat2 size={19} /></span><span><small>Routines actives</small><b>3 en rythme</b></span></article></div><article className="care-lead"><span className="tile-icon tile-icon--gold"><Lightbulb size={22} /></span><div><small>Aujourd'hui · 18:30</small><h2>Aimé remplace l'ampoule de la cuisine</h2><p>Ludiviane est prévenue de son passage.</p></div><button className="secondary-button" type="button"><ChevronRight size={17} /> Voir le passage</button></article><div className="care-columns"><section><header><div><span className="eyebrow">À traiter</span><h3>Les petits sujets, clairement.</h3></div><IconButton label="Signaler un problème" onClick={onReport}><Plus size={17} /></IconButton></header><div className="care-rows">{records.map((record) => <CareRow key={record.id} icon={record.title.toLowerCase().includes("fuite") ? <Droplets size={18} /> : <Wrench size={18} />} title={record.title} detail={String(record.payload.room || "Pièce à préciser")} date="À planifier" status="Nouveau" />)}<CareRow icon={<Lightbulb size={18} />} title="Ampoule de la cuisine" detail="Remplacement simple" date="Aujourd'hui · 18:30" status="Aimé" /><CareRow icon={<Droplets size={18} />} title="Siphon à vérifier" detail="Salle de bain" date="À choisir" status="Non attribué" /></div></section><section><header><div><span className="eyebrow">Planning</span><h3>Qui vient, et quand.</h3></div><IconButton label="Planifier un passage" onClick={onPlan}><Plus size={17} /></IconButton></header><div className="care-rows"><CareRow icon={<Sparkles size={18} />} title="Ménage" detail="Entrée et séjour" date="Vendredi · 18:30" status="Aimé · confirmé" /><CareRow icon={<Wrench size={18} />} title="Installer le lave-vaisselle" detail="Cuisine" date="19 sept. · 14:00" status="Aimé · prévu" /></div></section></div><section className="routine-band"><header><div><span className="eyebrow">Routines</span><h3>Ce qui revient, sans y repenser.</h3></div><IconButton label="Ajouter une routine" onClick={onPlan}><Plus size={17} /></IconButton></header><div className="routine-cards"><RoutineCard icon={<Leaf size={18} />} title="Plantes" rhythm="Tous les 6 jours" next="Dimanche" /><RoutineCard icon={<Sparkles size={18} />} title="Ménage" rhythm="Mardi et vendredi" next="Vendredi" /><RoutineCard icon={<Repeat2 size={18} />} title="Repassage" rhythm="Chaque semaine" next="Samedi" /></div></section><footer className="care-footer"><div><Wrench size={18} /><span><b>Un problème dans le logement ?</b><small>La pièce et une photo suffisent pour prévenir les bonnes personnes.</small></span></div><button className="secondary-button" type="button" onClick={onReport}>Signaler</button></footer></section>;
}
function CareRow({ icon, title, detail, date, status }: { icon: React.ReactNode; title: string; detail: string; date: string; status: string }) { return <button type="button"><span className="tile-icon">{icon}</span><span><b>{title}</b><small>{detail}</small></span><span className="row-when"><time>{date}</time><small>{status}</small></span><ChevronRight size={16} /></button>; }
function RoutineCard({ icon, title, rhythm, next }: { icon: React.ReactNode; title: string; rhythm: string; next: string }) { return <button type="button"><span className="tile-icon">{icon}</span><span><b>{title}</b><small>{rhythm}</small></span><span className="row-when"><time>{next}</time><small>Prochain passage</small></span><ChevronRight size={16} /></button>; }

function EquipmentHub({ onDetail, onAdd }: { onDetail: () => void; onAdd: () => void }) { const { records } = useCircleData(); const added = records.filter((record) => record.kind === "equipment"); return <section className="home-hub equipment-hub"><div className="hub-summary"><article><small>Suivis</small><b>{8 + added.length} équipements</b></article><article><small>Garanties</small><b>{3 + added.filter((record) => record.payload.warrantyEnd).length} actives</b></article><article><small>À venir</small><b>Chaudière · 18 oct.</b></article></div><div className="equipment-layout"><section><header><div><span className="eyebrow">À garder à l'œil</span><h3>Les prochains gestes utiles.</h3></div></header><button className="equipment-priority" type="button" onClick={onDetail}><span className="tile-icon tile-icon--gold"><Wrench size={19} /></span><span><small>Dans 45 jours</small><b>Entretien de la chaudière</b><em>Devis, certificat et dernier passage réunis.</em></span><ChevronRight size={17} /></button><div className="equipment-list">{added.map((record) => <EquipmentRow key={record.id} icon={<PackageCheck size={18} />} title={record.title} meta={`${String(record.payload.room || "Pièce à préciser")} · ajouté au foyer`} status="Suivi actif" onClick={onDetail} />)}<EquipmentRow icon={<Bolt size={18} />} title="Chaudière Saunier Duval" meta="Cuisine · installée en 2022" status="Entretien bientôt" onClick={onDetail} /><EquipmentRow icon={<Droplets size={18} />} title="Lave-vaisselle Bosch" meta="Cuisine · garantie jusqu'en 2028" status="À jour" onClick={onDetail} /><EquipmentRow icon={<SnowflakeIcon />} title="Réfrigérateur Samsung" meta="Cuisine · acheté en 2021" status="À jour" onClick={onDetail} /><EquipmentRow icon={<Home size={18} />} title="Canapé Oslo" meta="Séjour · tissu et facture conservés" status="À jour" onClick={onDetail} /></div></section><aside><span className="eyebrow">Passeport équipement</span><h3>Tout retrouver au bon moment.</h3><p>Facture, garantie, modèle, réparations et prochaine attention.</p><div className="passport-list"><span><ReceiptText size={17} /> Preuve d'achat</span><span><ShieldCheck size={17} /> Garantie</span><span><FileText size={17} /> Notice</span><span><Wrench size={17} /> Historique</span></div><button className="secondary-button" type="button" onClick={onAdd}><Plus size={17} /> Ajouter</button></aside></div></section>; }
function SnowflakeIcon() { return <span aria-hidden="true" className="text-icon">❄</span>; }
function EquipmentRow({ icon, title, meta, status, onClick }: { icon: React.ReactNode; title: string; meta: string; status: string; onClick: () => void }) { return <button type="button" onClick={onClick}><span className="tile-icon">{icon}</span><span><b>{title}</b><small>{meta}</small></span><em>{status}</em><ChevronRight size={16} /></button>; }

function ImprovementsHub({ onCreate }: { onCreate: () => void }) { const { records } = useCircleData(); const added = records.filter((record) => record.kind === "improvement"); return <section className="home-hub improvements-hub"><div className="improvement-feature"><div><span className="eyebrow">À décider ensemble</span><h2>{added[0]?.title || "Un coin lecture dans le séjour"}</h2><p>{added[0] ? "Cette idée est partagée avec le foyer." : "Plus de lumière, un fauteuil et des rangements bas."}</p><div className="decision-people"><span><Avatar person="mother" /> Ludiviane est partante</span><span><i className="avatar-initial">A</i> Avis d'Aimé attendu</span></div></div><aside><small>Budget indicatif</small><strong>{String(added[0]?.payload.budget || "380 €")}</strong><span>{String(added[0]?.payload.moment || "Un samedi")} · peu de gêne</span><button className="primary-button primary-button--forest" type="button" onClick={onCreate}>Décider <ChevronRight size={16} /></button></aside></div><div className="improvement-pipeline"><section><header><span className="eyebrow">Idées simples</span><b>À regarder plus tard</b></header>{added.slice(1).map((record) => <ImprovementRow key={record.id} title={record.title} room="Projet du foyer" value={String(record.payload.budget || "À chiffrer")} onClick={onCreate} />)}<ImprovementRow title="Rideaux occultants" room="Chambre de Yemaya" value="80 € · confort sommeil" onClick={onCreate} /><ImprovementRow title="Rangements bas" room="Entrée" value="120 € · quotidien" onClick={onCreate} /></section><section><header><span className="eyebrow">Planifié</span><b>Ce qui va changer</b></header><ImprovementRow title="Éclairage du séjour" room="2 points lumineux" value="Samedi · Aimé" onClick={onCreate} /><ImprovementRow title="Étagère du balcon" room="Plantes et arrosoir" value="26 sept. · 65 €" onClick={onCreate} /></section><aside><Sparkles size={20} /><b>Suggestion Circle</b><p>Commencer par l'éclairage apporte le plus de confort avec le moins de travaux.</p></aside></div><footer><span><Check size={17} /> Une idée ne devient un projet qu'après accord du foyer.</span><button className="secondary-button" type="button" onClick={onCreate}><Plus size={17} /> Ajouter une idée</button></footer></section>; }
function ImprovementRow({ title, room, value, onClick }: { title: string; room: string; value: string; onClick: () => void }) { return <button type="button" onClick={onClick}><span><b>{title}</b><small>{room}</small></span><em>{value}</em><ChevronRight size={16} /></button>; }

function SubscriptionsView({ onOverlay }: { onOverlay: (overlay: Overlay) => void }) { const { records } = useCircleData(); const added = records.filter((record) => record.kind === "subscription" && record.payload.entryType === "subscription"); const monthly = added.reduce((sum, record) => sum + Number(record.payload.amount || 0), 52.97); return <main className="view"><div className="section-toolbar"><div><span className="eyebrow">{3 + added.length} services actifs · {monthly.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € / mois</span></div><button className="secondary-button" type="button" onClick={() => onOverlay("add-subscription")}><Plus size={18} /> Ajouter un abonnement</button></div><section className="context-stage context-stage--subscriptions"><div className="context-stage__copy"><span className="eyebrow">Abonnements</span><h2>Seulement l'utile.</h2><p>Prix, renouvellements et personnes concernées.</p><button className="primary-button" type="button" onClick={() => onOverlay("add-subscription")}><Plus size={17} /> Ajouter un abonnement</button></div><div className="context-stage__art"><img src="/art/circle-subscriptions-cutout-v3.png" alt="" /></div></section><section className="subscription-dashboard"><article className="subscription-watch"><span className="tile-icon tile-icon--gold"><Sparkles size={19} /></span><div><small>À regarder avant le 18</small><h3>Netflix augmente de 2 €.</h3><p>Ludiviane et Aimé l'utilisent. Résilier reste possible jusqu'au 17.</p></div><button className="secondary-button" type="button" onClick={() => onOverlay("subscription-detail")}>Décider</button></article><div className="subscription-grid"><section><header><span className="eyebrow">Le foyer utilise</span><b>{3 + added.length} services</b></header>{added.map((record) => <Service key={record.id} icon={<CreditCard size={20} />} name={record.title} detail={`${String(record.payload.payer || "Payeur à préciser")} · ajouté à Circle`} amount={`${Number(record.payload.amount || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`} onClick={() => onOverlay("subscription-detail")} />)}<Service icon={<Wifi size={20} />} name="Internet" detail="Bouygues · Ludiviane paie" amount="31,99 €" onClick={() => onOverlay("subscription-detail")} /><Service icon={<Sparkles size={20} />} name="Netflix" detail="2 adultes · hausse annoncée" amount="13,49 €" onClick={() => onOverlay("subscription-detail")} /><Service icon={<ReceiptText size={20} />} name="Spotify" detail="Ludiviane · formule individuelle" amount="7,49 €" onClick={() => onOverlay("subscription-detail")} /></section><aside><span className="eyebrow">Ce que Circle surveille</span><h3>Sans suivre votre vie.</h3><ul><li><CalendarDays size={17} /> Prochaine échéance</li><li><WalletCards size={17} /> Changement de prix</li><li><UsersRound size={17} /> Qui en bénéficie</li><li><FileText size={17} /> Délai de résiliation</li></ul><p>L'usage reste facultatif. Circle ne lit aucun historique de contenu.</p></aside></div></section></main>; }
function Service({ icon, name, detail, amount, onClick }: { icon: React.ReactNode; name: string; detail: string; amount: string; onClick?: () => void }) { return <button type="button" onClick={onClick}><span className="tile-icon">{icon}</span><span><b>{name}</b><small>{detail}</small></span><strong>{amount}</strong><ChevronRight size={17} /></button>; }

function FinanceView({ onOverlay }: { onOverlay: (overlay: Overlay) => void }) {
  const { records } = useCircleData();
  const booking = records.find((record) => record.kind === "school_booking");
  const allocation = records.find((record) => record.kind === "expense" && record.payload.entryType === "allocation");
  const importedExpenses = records.filter((record) => record.kind === "expense" && record.payload.entryType === "document_expense");
  const importedTotal = importedExpenses.reduce((sum, record) => sum + Number(record.payload.amount || 0), 0);
  const schoolAmount = Number(booking?.payload.estimatedAmount || 90.24);
  const rule = String(allocation?.payload.methodLabel || "50 / 50");
  return <main className="view">
    <div className="section-toolbar"><div><span className="eyebrow">Septembre 2026</span></div><div className="section-toolbar__actions"><button className="secondary-button" type="button" onClick={() => onOverlay("payment-search")}><Search size={18} /> Retrouver</button><button className="secondary-button" type="button" onClick={() => onOverlay("expense-document")}><Upload size={18} /> Importer une facture</button></div></div>
    <ContextStage tab="finance" onAction={() => onOverlay("payment-search")} />
    <section className="finance-balance"><div><span className="eyebrow">Après les paiements du mois</span><h2>Aimé doit {(399.24 + importedTotal / 2).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € à Ludiviane.</h2><p>{importedExpenses.length ? `${importedExpenses.length} dépense${importedExpenses.length > 1 ? "s" : ""} importée${importedExpenses.length > 1 ? "s" : ""} incluse${importedExpenses.length > 1 ? "s" : ""}.` : "L'accueil de Yemaya est inclus dans la prévision."}</p></div><button className="primary-button primary-button--forest" type="button" onClick={() => onOverlay("allocation-flow")}><WalletCards size={17} /> Voir et ajuster</button></section>
    <section className="finance-detail"><div className="finance-payers"><header><div><span className="eyebrow">Adultes du foyer</span><h3>Ce que chacun a payé.</h3></div><button className="text-button" type="button" onClick={() => onOverlay("allocation-flow")}>Règle {rule} <ChevronRight size={16} /></button></header><article><Avatar person="mother" /><span><b>Ludiviane</b><small>Réel + école estimée</small></span><strong>{(1079.8 + importedTotal).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</strong></article><article><i className="avatar-initial">A</i><span><b>Aimé</b><small>Payé réellement ce mois-ci</small></span><strong>146,77 €</strong></article><article className="not-eligible"><Avatar person="daughter" /><span><b>Yemaya</b><small>Mineure · jamais sollicitée</small></span><LockKeyhole size={17} /></article></div><aside className="finance-next"><span className="eyebrow">À venir</span><h3>Trois échéances</h3><div><span className="date-tile"><b>12</b>SEP</span><span><b>Énergie</b><small>154,60 € · Aimé</small></span></div><div><span className="date-tile"><b>18</b>SEP</span><span><b>Netflix</b><small>13,49 € · Ludiviane</small></span></div><div><span className="date-tile date-tile--coral"><b>15</b>OCT</span><span><b>École & accueils</b><small>≈ {schoolAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} € · Ludiviane</small></span></div></aside><div className="expense-ledger"><header><div><span className="eyebrow">Détail du mois</span><h3>Qui paie quoi.</h3></div><small>Réel, prévision et règle restent séparés.</small></header><div className="expense-ledger__grid">{importedExpenses.map((record) => <ExpenseCard key={record.id} name={record.title} payer={String(record.payload.payer || "À confirmer")} amount={formatDocumentAmount(Number(record.payload.amount || 0))} share={rule} onClick={() => onOverlay("payment-search")} />)}<ExpenseCard name="Bail" payer="Ludiviane" amount="911,46 €" share="455,73 € chacun" onClick={() => onOverlay("payment-search")} /><ExpenseCard name="Électricité" payer="Aimé" amount="96,20 €" share="48,10 € chacun" onClick={() => onOverlay("payment-search")} /><ExpenseCard name="Gaz" payer="Aimé" amount="50,57 €" share="25,29 € chacun" onClick={() => onOverlay("payment-search")} /><ExpenseCard name="Eau + assurance" payer="Ludiviane" amount="42,10 €" share="21,05 € chacun" onClick={() => onOverlay("payment-search")} /><ExpenseCard name="Abonnements" payer="Ludiviane" amount="35,17 €" share="Selon les bénéficiaires" onClick={() => onOverlay("payment-search")} /><ExpenseCard name="École & accueils" payer="Ludiviane" amount={`≈ ${schoolAmount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €`} share="45,12 € chacun" estimate onClick={() => onOverlay("payment-search")} /></div></div></section>
  </main>;
}
function ExpenseCard({ name, payer, amount, share, estimate, onClick }: { name: string; payer: string; amount: string; share: string; estimate?: boolean; onClick: () => void }) { return <button className={estimate ? "expense-card expense-card--estimate" : "expense-card"} type="button" onClick={onClick}><span><small>{estimate ? "Prévision" : "Dépense"}</small><b>{name}</b><strong>{amount}</strong></span><span><small>Payé par</small><b>{payer}</b></span><span><small>Part prévue</small><b>{share}</b></span><ChevronRight size={17} /></button>; }
function ExpenseLine({ name, payer, amount, share }: { name: string; payer: string; amount: string; share: string }) { return <button type="button"><span><b>{name}</b><small>{amount}</small></span><span>{payer}</span><span>{share}</span><ChevronRight size={15} /></button>; }

function OverlayFrame({ title, eyebrow, children, onClose, wide = false }: { title: string; eyebrow: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) { return <div className="overlay" role="dialog" aria-modal="true" aria-label={title}><button className="overlay__scrim" type="button" onClick={onClose} aria-label="Fermer" /><section className={wide ? "overlay__panel overlay__panel--wide" : "overlay__panel"}><header><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><IconButton label="Fermer" onClick={onClose}><X size={19} /></IconButton></header>{children}</section></div>; }

function DocumentPicker({ domain, file, extraction, onReady, compact = true }: { domain: DocumentDomain; file: File | null; extraction: DocumentExtraction | null; onReady: (file: File, extraction: DocumentExtraction) => void; compact?: boolean }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (selected.size > 15 * 1024 * 1024) { setError("Ce fichier dépasse 15 Mo."); return; }
    setAnalyzing(true);
    setError("");
    try { onReady(selected, await analyzeDocument(selected, domain)); }
    catch { setError("Circle n'a pas pu lire ce fichier. Vous pouvez en choisir un autre."); }
    finally { setAnalyzing(false); }
  };
  return <label className={compact ? "upload-zone upload-zone--small document-picker" : "upload-zone document-picker"}>
    <input aria-label="Fichier à analyser" type="file" accept=".pdf,.txt,.csv,.json,image/jpeg,image/png,image/heic,image/heif" onChange={(event) => void choose(event)} />
    {analyzing ? <LoaderCircle className="spin" size={24} /> : extraction ? <FileCheck2 size={24} /> : <Upload size={24} />}
    <b>{analyzing ? "Lecture en cours…" : file ? file.name : "Choisir un fichier"}</b>
    <small>{error || (extraction ? extraction.textLength ? "Informations repérées · à confirmer" : "Fichier prêt · informations à confirmer" : "PDF, photo ou fichier texte · 15 Mo maximum")}</small>
  </label>;
}

function ExtractionNotice({ extraction }: { extraction: DocumentExtraction }) {
  return <div className={extraction.confidence === "review" ? "extraction-notice extraction-notice--review" : "extraction-notice"}>
    {extraction.confidence === "review" ? <Info size={17} /> : <Sparkles size={17} />}
    <span><b>{extraction.confidence === "review" ? "À vérifier avec attention" : "Circle a préparé l'essentiel"}</b><small>{extraction.textLength ? "Le texte du document a été lu. Confirmez les champs avant de ranger." : "Cette image est conservée, mais Circle n'invente pas ce qu'il ne peut pas lire."}</small></span>
  </div>;
}

function Notifications({ onClose }: { onClose: () => void }) { const { records } = useCircleData(); const recent = records.filter((record) => record.status === "pending" || record.status === "action_required").slice(0, 8); return <OverlayFrame title="Notifications" eyebrow={recent.length ? `${recent.length} à regarder` : "Tout est calme"} onClose={onClose}>{recent.length ? <div className="notification-list">{recent.map((record) => <Notification key={record.id} tone={record.status === "pending" ? "gold" : "coral"} icon={record.kind === "maintenance" ? <Wrench size={18} /> : record.kind === "document" ? <FileText size={18} /> : record.kind === "care_need" ? <HandHeart size={18} /> : <Check size={18} />} label={recordKindLabel(record.kind)} title={record.title} meta="Une action est attendue dans ce foyer" />)}</div> : <div className="notification-empty"><span><Bell size={24} /></span><h3>Rien à signaler.</h3><p>Les notifications apparaîtront ici uniquement lorsqu'une action vous concerne.</p></div>}<footer className="panel-footer"><span className="privacy-note"><ShieldCheck size={15} /> Uniquement ce qui vous concerne</span><button className="primary-button primary-button--forest" type="button" onClick={onClose}>Fermer</button></footer></OverlayFrame>; }
function recordKindLabel(kind: CircleRecord["kind"]) { return ({ maintenance: "Maintenance", contract: "Contrat", equipment: "Équipement", improvement: "Amélioration", subscription: "Abonnement", expense: "Finances", document: "Document", school_booking: "École", care_need: "Demande d'aide", routine: "Routine", event: "Agenda", person: "Personne" } as Record<CircleRecord["kind"], string>)[kind]; }
function Notification({ tone, icon, label, title, meta }: { tone: string; icon: React.ReactNode; label: string; title: string; meta: string }) { return <button className="notification" type="button"><span className={`tile-icon tile-icon--${tone}`}>{icon}</span><span><small>{label}</small><b>{title}</b><em>{meta}</em></span><ChevronRight size={17} /></button>; }

function AddContractFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<ContractId>("water");
  const [provider, setProvider] = useState("Métropole Rouen Normandie");
  const [amount, setAmount] = useState("24,80");
  const [debitDay, setDebitDay] = useState("12");
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [saving, setSaving] = useState(false);
  const { addRecord, uploadDocument } = useCircleData();
  const contract = contractReadings.find(item => item.id === selected)!;
  const selectContract = (id: ContractId) => { const next = contractReadings.find((item) => item.id === id)!; setSelected(id); setProvider(next.provider); setAmount(next.amount.replace(" €", "")); };
  const documentReady = (nextFile: File, nextExtraction: DocumentExtraction) => { setFile(nextFile); setExtraction(nextExtraction); if (nextExtraction.provider) setProvider(nextExtraction.provider); if (nextExtraction.amount !== null) setAmount(String(nextExtraction.amount).replace(".", ",")); };
  const advance = async () => {
    if (step === 1) { setStep(2); return; }
    setSaving(true);
    try {
      const storagePath = file ? await uploadDocument(file) : "";
      await addRecord({ kind: "contract", title: contract.label, payload: { provider, amount: `${amount} €`, debitDay: Number(debitDay), contractType: selected, storagePath, extracted: extraction } });
      if (file) await addRecord({ kind: "document", title: file.name, status: "stored", dueAt: extraction?.dueDate || undefined, payload: { context: "contract", contractType: selected, storagePath, fileName: file.name, mimeType: file.type, extracted: extraction } });
      setStep(3);
    } finally { setSaving(false); }
  };
  return <OverlayFrame title={step === 3 ? "Contrat ajouté" : "Ajouter un contrat"} eyebrow={step === 1 ? "1 · Type de contrat" : step === 2 ? "2 · Les informations utiles" : "C'est prêt"} onClose={onClose} wide>{step === 1 && <div className="contract-picker">{contractReadings.map(item => <button className={selected === item.id ? "active" : ""} type="button" key={item.id} onClick={() => selectContract(item.id)}><img src={item.image} alt="" /><span><b>{item.label}</b><small>{item.id === "bail" ? "Loyer et charges" : item.id === "insurance" ? "Couverture du logement" : "Contrat et consommation"}</small></span><Check size={17} /></button>)}</div>}{step === 2 && <div className="contract-form"><div className="contract-form__visual"><img src={contract.image} alt="" /><span><small>Contrat choisi</small><b>{contract.label}</b></span></div><label><span>Fournisseur</span><input value={provider} onChange={(event) => setProvider(event.target.value)} /></label><div className="field-pair"><label><span>Montant mensuel</span><input value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label><span>Prélèvement</span><select value={debitDay} onChange={(event) => setDebitDay(event.target.value)}><option value="5">Le 5 du mois</option><option value="12">Le 12 du mois</option><option value="20">Le 20 du mois</option></select></label></div><DocumentPicker domain="contract" file={file} extraction={extraction} onReady={documentReady} />{extraction && <ExtractionNotice extraction={extraction} />}</div>}{step === 3 && <div className="flow-success"><span><Check size={26} /></span><h3>{contract.label} est maintenant suivi.</h3><p>{file ? "Le document et les informations confirmées sont rangés ensemble." : "Les prochaines échéances et les évolutions utiles apparaîtront ici."}</p><div><img src={contract.image} alt="" /><span><small>Chaque mois</small><b>{amount} €</b></span></div></div>}<footer className="panel-footer">{step < 3 ? <button className="text-button" type="button" onClick={step === 1 ? onClose : () => setStep(1)}>{step === 1 ? "Annuler" : "Retour"}</button> : <span />}{step < 3 ? <button className="primary-button primary-button--forest" type="button" disabled={saving || !provider.trim() || !amount.trim()} onClick={() => void advance()}>{saving && <LoaderCircle className="spin" size={17} />}{step === 1 ? "Continuer" : "Ajouter ce contrat"} <ChevronRight size={17} /></button> : <button className="primary-button primary-button--forest" type="button" onClick={onClose}>Terminer</button>}</footer></OverlayFrame>;
}

function ContractDocumentFlow({ onClose }: { onClose: () => void }) {
  const [added, setAdded] = useState(false);
  const [contractId, setContractId] = useState<ContractId>("bail");
  const [documentType, setDocumentType] = useState("notice");
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { addRecord, uploadDocument } = useCircleData();
  const documentReady = (nextFile: File, nextExtraction: DocumentExtraction) => { setFile(nextFile); setExtraction(nextExtraction); if (nextExtraction.contractType !== "other") setContractId(nextExtraction.contractType); setProvider(nextExtraction.provider); setAmount(nextExtraction.amount === null ? "" : String(nextExtraction.amount).replace(".", ",")); setDueDate(nextExtraction.dueDate); };
  const save = async () => { if (!file || !extraction) return; setSaving(true); try { const contract = contractReadings.find((item) => item.id === contractId)!; const storagePath = await uploadDocument(file); const confirmedExtraction = { ...extraction, provider, amount: amount ? Number(amount.replace(",", ".")) : null, dueDate, contractType: contractId }; await addRecord({ kind: "document", title: `${documentType === "invoice" ? "Facture" : documentType === "certificate" ? "Attestation" : "Document"} · ${contract.label}`, status: "stored", dueAt: dueDate || undefined, payload: { context: "contract", contractType: contractId, documentType, storagePath, fileName: file.name, mimeType: file.type, extracted: confirmedExtraction } }); setAdded(true); } finally { setSaving(false); } };
  return <OverlayFrame title={added ? "Document rangé" : "Ajouter un document"} eyebrow={added ? "Contrat mis à jour" : "À un contrat existant"} onClose={onClose}>{added ? <div className="flow-success compact"><span><Check size={24} /></span><h3>Le document est au bon endroit.</h3><p>Le montant et la prochaine date confirmés sont déjà repris dans le contrat.</p></div> : <div className="contract-form"><label><span>Contrat concerné</span><select value={contractId} onChange={(event) => setContractId(event.target.value as ContractId)}>{contractReadings.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label><span>Type de document</span><select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option value="notice">Avis d'échéance</option><option value="invoice">Facture</option><option value="review">Révision ou régularisation</option><option value="certificate">Attestation</option><option value="other">Autre document</option></select></label><DocumentPicker domain="contract" file={file} extraction={extraction} onReady={documentReady} />{extraction && <><ExtractionNotice extraction={extraction} /><div className="field-pair"><label><span>Fournisseur</span><input value={provider} onChange={(event) => setProvider(event.target.value)} /></label><label><span>Montant</span><input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="À confirmer" /></label></div><label><span>Prochaine date utile</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></>}</div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{added ? "Fermer" : "Annuler"}</button>{!added && <button className="primary-button primary-button--forest" disabled={saving || !file || !extraction} type="button" onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Confirmer et ranger</button>}</footer></OverlayFrame>;
}

function ReportIssueFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [issue, setIssue] = useState("Fuite d'eau");
  const [room, setRoom] = useState("Cuisine");
  const [photo, setPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const issues = [["Fuite d'eau", <Droplets size={20} />], ["Évier bouché", <Wrench size={20} />], ["Ampoule", <Lightbulb size={20} />], ["Autre chose", <MoreHorizontal size={20} />]] as const;
  const rooms = ["Cuisine", "Salle de bain", "Séjour", "Chambre", "Entrée", "Autre"];
  const saveIssue = async () => { setSaving(true); try { await addRecord({ kind: "maintenance", title: issue, status: "to_plan", payload: { room, photoAdded: photo, urgency: "tomorrow" } }); onClose(); } finally { setSaving(false); } };
  return <OverlayFrame title={step === 3 ? "Signalement prêt" : "Signaler un problème"} eyebrow={step === 1 ? "1 · Ce qui ne va pas" : step === 2 ? "2 · Pièce et détail" : "Aucune surprise"} onClose={onClose} wide>{step === 1 && <div className="issue-picker"><p>Choisissez simplement ce qui ressemble le plus au problème.</p><div>{issues.map(([label, icon]) => <button className={issue === label ? "active" : ""} type="button" key={label} onClick={() => setIssue(label)}><span>{icon}</span><b>{label}</b><Check size={17} /></button>)}</div></div>}{step === 2 && <div className="issue-details"><div><span className="eyebrow">Pièce concernée</span><div className="room-picker">{rooms.map(item => <button className={room === item ? "active" : ""} type="button" key={item} onClick={() => setRoom(item)}>{item}</button>)}</div></div><label><span>Un détail utile <small>facultatif</small></span><textarea defaultValue="L'eau coule doucement sous l'évier depuis ce matin." /></label><button className={photo ? "photo-button added" : "photo-button"} type="button" onClick={() => setPhoto(true)}><Camera size={20} /><span><b>{photo ? "Photo ajoutée" : "Ajouter une photo"}</b><small>{photo ? "photo-cuisine.jpg" : "Facultatif · aide à comprendre"}</small></span>{photo ? <Check size={18} /> : <Plus size={18} />}</button><div className="urgency-choice"><span><small>Urgence</small><b>Peut attendre demain</b></span><ChevronRight size={17} /></div></div>}{step === 3 && <div className="issue-review"><div className="issue-review__visual"><img src="/art/circle-home-life-hero-v1.png" alt="" /></div><div><span className="eyebrow">{room}</span><h3>{issue}</h3><p>Circle prévient Ludiviane et propose un créneau à Aimé. Rien n'est envoyé à un professionnel sans accord.</p><span className="quiet-pill"><Check size={14} /> Peut attendre demain</span></div></div>}<footer className="panel-footer">{step < 3 ? <button className="text-button" type="button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Annuler" : "Retour"}</button> : <button className="text-button" type="button" onClick={onClose}>Fermer</button>}{step < 3 ? <button className="primary-button primary-button--forest" type="button" onClick={() => setStep(step + 1)}>Continuer <ChevronRight size={17} /></button> : <button className="primary-button primary-button--forest" type="button" disabled={saving} onClick={() => void saveIssue()}>{saving ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />} Prévenir le foyer</button>}</footer></OverlayFrame>;
}

function PlanCareFlow({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [kind, setKind] = useState("passage");
  const [title, setTitle] = useState("Ménage de l'entrée et du séjour");
  const [when, setWhen] = useState("friday");
  const [who, setWho] = useState("aime");
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const save = async () => { setSaving(true); try { await addRecord({ kind: kind === "routine" ? "routine" : "event", title, status: "planned", startsAt: when === "saturday" ? "2026-09-19T10:00:00+02:00" : "2026-09-18T18:30:00+02:00", payload: { context: "home_care", kind, when, assignedTo: who } }); setSaved(true); } finally { setSaving(false); } };
  return <OverlayFrame title={saved ? "C'est planifié" : "Organiser la maison"} eyebrow={saved ? "Tout le monde est prévenu" : "Passage ou routine"} onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>{when === "saturday" ? "Samedi à 10:00." : "Vendredi à 18:30."}</h3><p>Les membres concernés voient désormais ce passage dans leur agenda.</p></div> : <div className="contract-form"><div className="plan-kind"><button className={kind === "passage" ? "active" : ""} type="button" onClick={() => { setKind("passage"); setTitle("Ménage de l'entrée et du séjour"); }}><CalendarClock size={19} /><span><b>Un passage</b><small>Une fois, à une date précise</small></span></button><button className={kind === "routine" ? "active" : ""} type="button" onClick={() => { setKind("routine"); setTitle("Arroser les plantes"); }}><Repeat2 size={19} /><span><b>Une routine</b><small>Revient automatiquement</small></span></button></div><label><span>Quoi ?</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="field-pair"><label><span>Quand ?</span><select value={when} onChange={(event) => setWhen(event.target.value)}><option value="friday">Vendredi · 18:30</option><option value="saturday">Samedi · 10:00</option><option value="choose">Choisir un autre moment</option></select></label><label><span>Qui ?</span><select value={who} onChange={(event) => setWho(event.target.value)}><option value="aime">Aimé</option><option value="ludiviane">Ludiviane</option><option value="wecasa">Wecasa</option></select></label></div><div className="kindness-note"><Bell size={17} /><span><b>Visibilité partagée</b><small>Les membres concernés savent qui vient, pourquoi et à quelle heure.</small></span></div></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" disabled={saving || !title.trim()} type="button" onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Planifier</button>}</footer></OverlayFrame>;
}

function EquipmentDetail({ onClose }: { onClose: () => void }) { return <OverlayFrame title="Chaudière Saunier Duval" eyebrow="Passeport équipement" onClose={onClose} wide><div className="equipment-detail"><div className="equipment-detail__visual"><img src="/art/circle-home-equipment-v1.png" alt="" /></div><div className="equipment-detail__main"><span className="sync-pill"><Check size={14} /> Fonctionne normalement</span><h3>La prochaine attention est déjà prévue.</h3><p>Entretien annuel le 18 octobre avec Thermo Rouen.</p><div className="equipment-facts"><span><small>Installée</small><b>Septembre 2022</b></span><span><small>Modèle</small><b>ThemaPlus Condens</b></span><span><small>Garantie</small><b>Jusqu'en 2027</b></span><span><small>Pièce</small><b>Cuisine</b></span></div><button className="portal-line" type="button"><FileText size={18} /><span><b>Notice et certificat</b><small>3 documents rangés</small></span></button><button className="portal-line" type="button"><Wrench size={18} /><span><b>Historique d'entretien</b><small>Dernier passage · 21 octobre 2025</small></span></button></div></div><footer className="panel-footer"><button className="text-button" type="button">Modifier</button><button className="primary-button primary-button--forest" type="button" onClick={onClose}>C'est bon</button></footer></OverlayFrame>; }

function AddEquipmentFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Lave-vaisselle Bosch");
  const [room, setRoom] = useState("Cuisine");
  const [purchasedAt, setPurchasedAt] = useState("12 août 2026");
  const [warrantyEnd, setWarrantyEnd] = useState("12 août 2028");
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const advance = async () => {
    if (step === 1) { setStep(2); return; }
    setSaving(true);
    try {
      await addRecord({ kind: "equipment", title: name, status: "active", payload: { room, purchasedAt, warrantyEnd, category: "appliance" } });
      setStep(3);
    } finally { setSaving(false); }
  };
  return <OverlayFrame title={step === 3 ? "Équipement ajouté" : "Ajouter un équipement"} eyebrow={step === 1 ? "1 · Le reconnaître" : step === 2 ? "2 · Ce qui sera utile" : "C'est prêt"} onClose={onClose}>{step === 1 && <div className="contract-form"><div className="plan-kind"><button className="active" type="button"><Droplets size={19} /><span><b>Électroménager</b><small>Cuisine et linge</small></span></button><button type="button"><Home size={19} /><span><b>Mobilier</b><small>Meubles et confort</small></span></button></div><label><span>Nom</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Pièce</span><select value={room} onChange={(event) => setRoom(event.target.value)}><option>Cuisine</option><option>Séjour</option><option>Salle de bain</option></select></label><button className="photo-button" type="button"><Camera size={20} /><span><b>Prendre une photo</b><small>Circle pourra reconnaître le modèle</small></span><Plus size={18} /></button></div>}{step === 2 && <div className="contract-form"><div className="kindness-note"><Sparkles size={17} /><span><b>Trois informations suffisent</b><small>Circle demandera le reste seulement quand cela deviendra utile.</small></span></div><div className="field-pair"><label><span>Date d'achat</span><input value={purchasedAt} onChange={(event) => setPurchasedAt(event.target.value)} /></label><label><span>Fin de garantie</span><input value={warrantyEnd} onChange={(event) => setWarrantyEnd(event.target.value)} /></label></div><button className="upload-inline" type="button"><ReceiptText size={18} /><span><b>Ajouter la facture</b><small>Facultatif</small></span><Plus size={17} /></button><button className="upload-inline" type="button"><FileText size={18} /><span><b>Ajouter la notice</b><small>Facultatif</small></span><Plus size={17} /></button></div>}{step === 3 && <div className="flow-success compact"><span><Check size={24} /></span><h3>{name} est suivi.</h3><p>Garantie, notice et entretien seront retrouvables ici.</p></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Annuler" : "Retour"}</button><button className="primary-button primary-button--forest" disabled={saving || !name.trim()} type="button" onClick={step === 3 ? onClose : () => void advance()}>{saving && <LoaderCircle className="spin" size={17} />}{step === 3 ? "Terminer" : "Continuer"}</button></footer></OverlayFrame>;
}

function ImprovementFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [project, setProject] = useState("Créer un coin lecture dans le séjour");
  const [budget, setBudget] = useState("400 €");
  const [moment, setMoment] = useState("Un samedi");
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const advance = async () => {
    if (step < 3) { setStep(step + 1); return; }
    setSaving(true);
    try { await addRecord({ kind: "improvement", title: project, status: "pending", payload: { budget, moment, approval: "aime_pending" } }); setStep(4); }
    finally { setSaving(false); }
  };
  return <OverlayFrame title={step === 4 ? "Projet partagé" : "Imaginer une amélioration"} eyebrow={step < 4 ? `${step} · ${step === 1 ? "Le besoin" : step === 2 ? "L'effort" : "L'accord"}` : "Rien ne démarre sans accord"} onClose={onClose} wide><div className="flow-progress"><i className="done" /><i className={step >= 2 ? "done" : ""} /><i className={step >= 3 ? "done" : ""} /><i className={step >= 4 ? "done" : ""} /></div>{step === 1 && <div className="choice-grid"><Choice icon={<Lightbulb size={20} />} title="Mieux éclairer" meta="Voir et se sentir mieux" selected /><Choice icon={<PackageCheck size={20} />} title="Mieux ranger" meta="Simplifier le quotidien" /><Choice icon={<Leaf size={20} />} title="Plus de confort" meta="Température, bruit, repos" /><Choice icon={<MessageCircle size={20} />} title="Une autre idée" meta="La décrire librement" /></div>}{step === 2 && <div className="contract-form"><label><span>Projet</span><input value={project} onChange={(event) => setProject(event.target.value)} /></label><div className="field-pair"><label><span>Budget maximum</span><input value={budget} onChange={(event) => setBudget(event.target.value)} /></label><label><span>Moment idéal</span><select value={moment} onChange={(event) => setMoment(event.target.value)}><option>Un samedi</option><option>Plus tard</option></select></label></div><div className="kindness-note"><Sparkles size={17} /><span><b>Impact doux</b><small>Une journée, peu de poussière, aucun déplacement de Yemaya.</small></span></div></div>}{step === 3 && <div className="proposal-review"><div className="parent-check"><span><Avatar person="mother" /><i className="avatar-initial">A</i></span><span><small>Décision du foyer</small><b>Ludiviane est partante · avis d'Aimé attendu</b></span></div><div className="calendar-fit"><CalendarDays size={21} /><div><small>Créneau compatible</small><h3>Samedi 26 septembre</h3><p>Aucun relais, passage ou rendez-vous ce jour-là.</p></div></div></div>}{step === 4 && <div className="flow-success"><span><Check size={25} /></span><h3>L'idée est prête à être décidée.</h3><p>Aucun achat ni réservation ne sera fait avant l'accord des deux adultes.</p></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Annuler" : "Retour"}</button><button className="primary-button primary-button--forest" disabled={saving || !project.trim()} type="button" onClick={step === 4 ? onClose : () => void advance()}>{saving && <LoaderCircle className="spin" size={17} />}{step === 4 ? "Terminer" : "Continuer"}</button></footer></OverlayFrame>;
}

function AllocationFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState("equal");
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const labels: Record<string, string> = { equal: "50 / 50", income: "Selon les revenus", custom: "Au cas par cas" };
  const advance = async () => {
    if (step < 3) { setStep(step + 1); return; }
    setSaving(true);
    try { await addRecord({ kind: "expense", title: "Répartition des frais", status: "active", payload: { entryType: "allocation", method, methodLabel: labels[method] } }); setStep(4); }
    finally { setSaving(false); }
  };
  return <OverlayFrame title={step === 4 ? "Répartition mise à jour" : "Répartir les frais"} eyebrow={step < 4 ? `${step} · ${step === 1 ? "Qui peut contribuer" : step === 2 ? "La règle" : "Les paiements réels"}` : "Septembre 2026"} onClose={onClose} wide><div className="flow-progress"><i className="done" /><i className={step >= 2 ? "done" : ""} /><i className={step >= 3 ? "done" : ""} /><i className={step >= 4 ? "done" : ""} /></div>{step === 1 && <div className="allocation-members"><button className="active" type="button"><Avatar person="mother" /><span><b>Ludiviane</b><small>32 ans · peut contribuer</small></span><Check size={17} /></button><button className="active" type="button"><i className="avatar-initial">A</i><span><b>Aimé</b><small>30 ans · peut contribuer</small></span><Check size={17} /></button><button className="disabled" type="button" disabled><Avatar person="daughter" /><span><b>Yemaya</b><small>2 ans · exclue automatiquement</small></span><LockKeyhole size={17} /></button><p><ShieldCheck size={16} /> Seuls les membres âgés de 18 ans ou plus peuvent prendre en charge des frais.</p></div>}{step === 2 && <div className="allocation-methods"><button className={method === "equal" ? "active" : ""} type="button" onClick={() => setMethod("equal")}><span><b>À parts égales</b><small>50 % chacun</small></span><Check size={17} /></button><button className={method === "income" ? "active" : ""} type="button" onClick={() => setMethod("income")}><span><b>Selon les revenus</b><small>Une proportion stable et ajustable</small></span><Check size={17} /></button><button className={method === "custom" ? "active" : ""} type="button" onClick={() => setMethod("custom")}><span><b>Au cas par cas</b><small>Une règle différente par dépense</small></span><Check size={17} /></button><div className="kindness-note"><Info size={17} /><span><b>Cette règle calcule l'équilibre</b><small>Elle ne change jamais qui a réellement payé sur son compte.</small></span></div></div>}{step === 3 && <div className="allocation-review"><header><span>Dépense</span><span>Payé par</span><span>Contribution</span></header><ExpenseLine name="Bail" payer="Ludiviane" amount="911,46 €" share={labels[method]} /><ExpenseLine name="Électricité" payer="Aimé" amount="96,20 €" share={labels[method]} /><ExpenseLine name="Netflix" payer="Ludiviane" amount="13,49 €" share={labels[method]} /><aside><span><small>Solde du mois</small><b>Aimé verse 354,12 € à Ludiviane</b></span><button className="secondary-button" type="button">Marquer comme versé</button></aside></div>}{step === 4 && <div className="flow-success"><span><Check size={25} /></span><h3>Tout le monde voit la même chose.</h3><p>La règle, les paiements réels et le solde restent visibles aux deux adultes.</p></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={step === 1 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Annuler" : "Retour"}</button><button className="primary-button primary-button--forest" disabled={saving} type="button" onClick={step === 4 ? onClose : () => void advance()}>{saving && <LoaderCircle className="spin" size={17} />}{step === 4 ? "Terminer" : "Continuer"}</button></footer></OverlayFrame>;
}

function SubscriptionDetail({ onClose }: { onClose: () => void }) {
  const [decision, setDecision] = useState<"kept" | "cancelled" | null>(null);
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const decide = async (action: "kept" | "cancelled") => { setSaving(true); try { await addRecord({ kind: "subscription", title: "Netflix", status: action, payload: { entryType: "decision", action, amount: 15.49 } }); setDecision(action); } finally { setSaving(false); } };
  return <OverlayFrame title="Netflix" eyebrow="Abonnement du foyer" onClose={onClose}>{decision ? <div className="flow-success compact"><span><Check size={24} /></span><h3>{decision === "kept" ? "Netflix reste dans le foyer." : "La résiliation est notée."}</h3><p>{decision === "kept" ? "Le nouveau prix est intégré aux prochaines dépenses." : "Circle gardera la date limite visible jusqu'à la confirmation."}</p></div> : <div className="subscription-detail"><div className="subscription-detail__price"><span><small>Nouveau prix le 18</small><b>15,49 € / mois</b></span><em>+2 €</em></div><div className="portal-line"><UsersRound size={18} /><span><b>Ludiviane et Aimé</b><small>Deux bénéficiaires</small></span></div><div className="portal-line"><WalletCards size={18} /><span><b>Payé par Ludiviane</b><small>Réparti à parts égales</small></span></div><div className="portal-line"><CalendarDays size={18} /><span><b>Résiliation possible jusqu'au 17</b><small>Sans frais</small></span></div><div className="kindness-note"><ShieldCheck size={17} /><span><b>Votre usage reste privé</b><small>Circle conserve seulement les personnes concernées et les dates utiles.</small></span></div></div>}<footer className="panel-footer"><button className="text-button" disabled={saving} type="button" onClick={decision ? onClose : () => void decide("cancelled")}>{decision ? "Fermer" : "Résilier"}</button>{!decision && <button className="primary-button primary-button--forest" disabled={saving} type="button" onClick={() => void decide("kept")}>{saving && <LoaderCircle className="spin" size={17} />}Garder l'abonnement</button>}</footer></OverlayFrame>;
}

function AddSubscriptionFlow({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("Disney+");
  const [amount, setAmount] = useState("8,99");
  const [payer, setPayer] = useState("Ludiviane");
  const [renewal, setRenewal] = useState("Le 22 du mois");
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [saving, setSaving] = useState(false);
  const { addRecord, uploadDocument } = useCircleData();
  const documentReady = (nextFile: File, nextExtraction: DocumentExtraction) => { setFile(nextFile); setExtraction(nextExtraction); if (nextExtraction.provider || nextExtraction.title) setName(nextExtraction.provider || nextExtraction.title); if (nextExtraction.amount !== null) setAmount(String(nextExtraction.amount).replace(".", ",")); if (nextExtraction.dueDate) setRenewal(nextExtraction.dueDate); };
  const save = async () => { setSaving(true); try { const storagePath = file ? await uploadDocument(file) : ""; await addRecord({ kind: "subscription", title: name, status: "active", dueAt: extraction?.dueDate || undefined, payload: { entryType: "subscription", amount: Number(amount.replace(",", ".")), payer, renewal, storagePath, extracted: extraction } }); if (file) await addRecord({ kind: "document", title: file.name, status: "stored", dueAt: extraction?.dueDate || undefined, payload: { context: "subscription", subscriptionName: name, storagePath, fileName: file.name, mimeType: file.type, extracted: extraction } }); setSaved(true); } finally { setSaving(false); } };
  return <OverlayFrame title={saved ? "Abonnement ajouté" : "Ajouter un abonnement"} eyebrow={saved ? "Le foyer est à jour" : "Saisie ou document"} onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>{name} est suivi.</h3><p>{file ? "Le document, le prix et la prochaine date sont rangés ensemble." : "Le prix et la prochaine échéance sont maintenant visibles."}</p></div> : <div className="contract-form"><DocumentPicker domain="subscription" file={file} extraction={extraction} onReady={documentReady} />{extraction && <ExtractionNotice extraction={extraction} />}<label><span>Service</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><div className="field-pair"><label><span>Prix mensuel</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label><span>Payé par</span><select value={payer} onChange={(event) => setPayer(event.target.value)}><option>Ludiviane</option><option>Aimé</option></select></label></div><label><span>Renouvellement</span><input value={renewal} onChange={(event) => setRenewal(event.target.value)} /></label><div className="kindness-note"><ShieldCheck size={17} /><span><b>Pas d'historique d'usage</b><small>Circle conserve le prix, l'échéance et les bénéficiaires, rien de plus.</small></span></div></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" disabled={saving || !name.trim() || !amount.trim()} type="button" onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Ajouter l'abonnement</button>}</footer></OverlayFrame>;
}

function ExpenseDocumentFlow({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("Ludiviane");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const { addRecord, uploadDocument } = useCircleData();
  const documentReady = (nextFile: File, nextExtraction: DocumentExtraction) => { setFile(nextFile); setExtraction(nextExtraction); setTitle(nextExtraction.title); setAmount(nextExtraction.amount === null ? "" : String(nextExtraction.amount).replace(".", ",")); setDueDate(nextExtraction.dueDate); };
  const save = async () => {
    if (!file || !extraction) return;
    setSaving(true);
    try {
      const storagePath = await uploadDocument(file);
      const numericAmount = Number(amount.replace(",", "."));
      const confirmedExtraction = { ...extraction, title, amount: numericAmount, dueDate };
      await addRecord({ kind: "expense", title, status: dueDate ? "planned" : "paid", dueAt: dueDate || undefined, payload: { entryType: "document_expense", amount: numericAmount, payer, storagePath, extracted: confirmedExtraction } });
      await addRecord({ kind: "document", title: file.name, status: "stored", dueAt: dueDate || undefined, payload: { context: "finance", storagePath, fileName: file.name, mimeType: file.type, extracted: confirmedExtraction } });
      setSaved(true);
    } finally { setSaving(false); }
  };
  return <OverlayFrame title={saved ? "Dépense ajoutée" : "Importer une facture"} eyebrow={saved ? "Finances mises à jour" : "Un document, puis confirmation"} onClose={onClose} wide>
    {saved ? <div className="flow-success"><span><Check size={25} /></span><h3>{title} est pris en compte.</h3><p>Le paiement réel, la répartition et le document sont maintenant reliés.</p></div> : <div className="document-workflow"><DocumentPicker domain="expense" file={file} extraction={extraction} onReady={documentReady} compact={false} />{extraction && <div className="document-confirm"><ExtractionNotice extraction={extraction} /><label><span>Dépense</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="field-pair"><label><span>Montant</span><input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label><span>Payé par</span><select value={payer} onChange={(event) => setPayer(event.target.value)}><option>Ludiviane</option><option>Aimé</option></select></label></div><label><span>Échéance <small>facultative</small></span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div>}</div>}
    <footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" type="button" disabled={saving || !file || !extraction || !title.trim() || !amount.trim()} onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Confirmer la dépense</button>}</footer>
  </OverlayFrame>;
}

function PaymentSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { records } = useCircleData();
  const imported = records.filter((record) => record.kind === "expense" && record.payload.entryType === "document_expense" && record.title.toLowerCase().includes(query.toLowerCase()));
  const defaults = [{ title: "Bail", amount: "911,46 €", payer: "Ludiviane" }, { title: "Électricité", amount: "96,20 €", payer: "Aimé" }, { title: "Gaz", amount: "50,57 €", payer: "Aimé" }, { title: "Netflix", amount: "13,49 €", payer: "Ludiviane" }].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
  return <OverlayFrame title="Retrouver un paiement" eyebrow="Réel et prévision restent distincts" onClose={onClose} wide><div className="payment-search"><label><Search size={18} /><input aria-label="Rechercher un paiement" placeholder="Bail, énergie, fournisseur…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="payment-results">{imported.map((record) => <article key={record.id}><span className="tile-icon"><FileCheck2 size={18} /></span><span><small>Importé depuis un document</small><b>{record.title}</b><em>{String(record.payload.payer || "À confirmer")}</em></span><strong>{formatDocumentAmount(Number(record.payload.amount || 0))}</strong><Check size={17} /></article>)}{defaults.map((item) => <article key={item.title}><span className="tile-icon"><ReceiptText size={18} /></span><span><small>Paiement du mois</small><b>{item.title}</b><em>{item.payer}</em></span><strong>{item.amount}</strong><ChevronRight size={17} /></article>)}</div></div><footer className="panel-footer"><span className="privacy-note"><ShieldCheck size={15} /> Documents privés au foyer</span><button className="primary-button primary-button--forest" type="button" onClick={onClose}>Terminer</button></footer></OverlayFrame>;
}

function CreateMenu({ tab, onClose, onDocument, onHelp, onSubscription }: { tab: Tab; onClose: () => void; onDocument: () => void; onHelp: () => void; onSubscription: () => void }) { const items = tab === "people" ? [[<UserRound size={19} />, "Une personne", "Ajouter un membre du foyer"], [<CalendarDays size={19} />, "Un rendez-vous", "Pour une ou plusieurs personnes"], [<UsersRound size={19} />, "Une demande d'aide", "Solliciter un proche"]] : tab === "subscriptions" ? [[<CreditCard size={19} />, "Un abonnement", "Saisir les informations"], [<Upload size={19} />, "Depuis un document", "Circle extrait l'essentiel"]] : [[<Upload size={19} />, "Un document", "Analyser et ranger"], [<Wrench size={19} />, "Un besoin", "Réparer ou entretenir"]]; return <OverlayFrame title="Que voulez-vous créer ?" eyebrow={navItems.find(item => item.id === tab)?.label ?? "Circle"} onClose={onClose}><div className="create-list">{items.map(([icon, title, meta]) => <button type="button" key={String(title)} onClick={() => { if (String(title).includes("aide")) onHelp(); else if (String(title) === "Un abonnement" || (tab === "subscriptions" && String(title).includes("Depuis"))) onSubscription(); else if (String(title).includes("document")) onDocument(); else onClose(); }}><span className="tile-icon">{icon}</span><span><b>{title}</b><small>{meta}</small></span><ChevronRight size={17} /></button>)}</div></OverlayFrame>; }

function Handoff({ onClose }: { onClose: () => void }) { const [ready, setReady] = useState(false); return <OverlayFrame title="Relais de vendredi" eyebrow="17:00 · École" onClose={onClose} wide><div className="handoff-lead"><img src="/art/luce-shared-custody-v1.png" alt="" /><div><span className="eyebrow">Seulement ce qui a changé</span><h3>Aimé reçoit l'essentiel.</h3><p>Aucune information privée inutile n'est partagée.</p></div></div><div className="handoff-deltas"><Delta icon={<HeartPulse size={18} />} title="Santé" value="Rhume léger · aucun traitement" /><Delta icon={<School size={18} />} title="École" value="Autorisation à signer" /><Delta icon={<PackageCheck size={18} />} title="À emporter" value="Manteau bleu et doudou" /><Delta icon={<CalendarDays size={18} />} title="À venir" value="Pédiatre mercredi" /></div><footer className="panel-footer"><span className="privacy-note"><ShieldCheck size={15} /> Visible par les deux parents</span><button className="primary-button primary-button--forest" type="button" onClick={() => setReady(true)}>{ready ? <><Check size={17} /> Relais prêt</> : <><Repeat2 size={17} /> Préparer le relais</>}</button></footer></OverlayFrame>; }
function Delta({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <article><span className="tile-icon">{icon}</span><div><small>{title}</small><b>{value}</b></div></article>; }

function HelpFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const advance = async () => { if (step === 1) { setStep(2); return; } setSaving(true); try { await addRecord({ kind: "care_need", title: "Récupérer Yemaya", status: "sent", startsAt: "2026-09-18T17:00:00+02:00", payload: { person: "Yemaya", place: "École", helper: "Marie", route: ["Marie", "Jean-Baptiste"] } }); setStep(3); } finally { setSaving(false); } };
  return <OverlayFrame title={step === 1 ? "Demander un coup de main" : step === 2 ? "Choisir les proches" : "Votre demande est prête"} eyebrow={`Étape ${step} sur 3`} onClose={onClose}><div className="flow-progress"><i className="done" /><i className={step >= 2 ? "done" : ""} /><i className={step >= 3 ? "done" : ""} /></div>{step === 1 && <div className="choice-list"><Choice icon={<School size={20} />} title="Récupérer Yemaya" meta="École · vendredi à 17:00" selected /><Choice icon={<Trees size={20} />} title="Garde pendant les vacances" meta="Choisir les jours" /><Choice icon={<Leaf size={20} />} title="Passage au logement" meta="Plantes, livraison, réparation" /></div>}{step === 2 && <div className="helper-list"><Helper initials="MM" name="Marie" meta="Grand-mère · disponible" checked /><Helper initials="JB" name="Jean-Baptiste" meta="Oncle · à confirmer" /><div className="share-box"><LockKeyhole size={18} /><span><b>Ce qui sera partagé</b><small>Prénom de Yemaya, école, horaire et personne à prévenir. Rien d'autre.</small></span></div></div>}{step === 3 && <div className="success-state"><span><Check size={28} /></span><h3>Demande envoyée à Marie</h3><p>Vous serez prévenus dès qu'elle répond.</p></div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={step === 1 ? onClose : step === 3 ? onClose : () => setStep(step - 1)}>{step === 1 ? "Annuler" : step === 3 ? "Fermer" : "Retour"}</button>{step < 3 && <button className="primary-button primary-button--forest" disabled={saving} type="button" onClick={() => void advance()}>{saving && <LoaderCircle className="spin" size={17} />}Continuer</button>}</footer></OverlayFrame>;
}
function Choice({ icon, title, meta, selected }: { icon: React.ReactNode; title: string; meta: string; selected?: boolean }) { return <button className={selected ? "choice active" : "choice"} type="button"><span className="tile-icon">{icon}</span><span><b>{title}</b><small>{meta}</small></span>{selected ? <Check size={17} /> : <ChevronRight size={17} />}</button>; }
function Helper({ initials, name, meta, checked }: { initials: string; name: string; meta: string; checked?: boolean }) { return <label className="helper"><i>{initials}</i><span><b>{name}</b><small>{meta}</small></span><input type="checkbox" defaultChecked={checked} /></label>; }

function NeedBuilder({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const titles = ["Qui a besoin d'aide ?", "Que faut-il faire ?", "Quand faut-il aider ?", "Qui peut recevoir la demande ?"];
  const advance = async () => { if (step < 4) { setStep(step + 1); return; } setSaving(true); try { await addRecord({ kind: "care_need", title: "Garder Yemaya", status: "searching", startsAt: "2026-09-16T08:00:00+02:00", dueAt: "2026-09-16T13:00:00+02:00", payload: { person: "Yemaya", action: "childcare", route: ["Marie", "Jean-Baptiste", "Service de garde"], note: "Déjeuner préparé. Doudou dans le sac bleu." } }); setSent(true); } finally { setSaving(false); } };
  return <OverlayFrame title={sent ? "La recherche est lancée" : titles[step - 1]} eyebrow={sent ? "Circle s'en occupe" : `Besoin · ${step} sur 4`} onClose={onClose} wide>
    <div className="flow-progress"><i className="done" /><i className={step >= 2 ? "done" : ""} /><i className={step >= 3 ? "done" : ""} /><i className={step >= 4 ? "done" : ""} /></div>
    {sent ? <div className="need-success"><span><Check size={28} /></span><h3>Marie reçoit la demande en premier.</h3><p>Sans réponse demain à 12:00, Circle proposera Jean-Baptiste. Vous gardez la main avant tout recours professionnel.</p><div><Avatar person="daughter" /><span><small>Mercredi · 08:00 - 13:00</small><b>Garder Yemaya</b></span></div></div> : <>
      {step === 1 && <div className="choice-grid"><Choice icon={<UserRound size={20} />} title="Yemaya" meta="École, garde, trajet" selected /><Choice icon={<PawPrint size={20} />} title="Koda" meta="Sortie, garde, vétérinaire" /><Choice icon={<Home size={20} />} title="Le logement" meta="Passage, plante, réparation" /><Choice icon={<UsersRound size={20} />} title="Tout le foyer" meta="Courses, transport, imprévu" /></div>}
      {step === 2 && <div className="choice-grid"><Choice icon={<School size={20} />} title="Déposer ou récupérer" meta="École ou centre de loisirs" selected /><Choice icon={<Clock3 size={20} />} title="Garder un moment" meta="Quelques heures ou une journée" /><Choice icon={<Trees size={20} />} title="Pendant les vacances" meta="Un ou plusieurs jours" /><Choice icon={<MessageCircle size={20} />} title="Décrire librement" meta="Circle organisera votre demande" /></div>}
      {step === 3 && <div className="need-when"><div className="date-choice"><CalendarDays size={22} /><span><small>Jour</small><b>Mercredi 16 septembre</b></span><ChevronRight size={17} /></div><div className="time-pair"><label><span>De</span><input type="time" defaultValue="08:00" /></label><label><span>À</span><input type="time" defaultValue="13:00" /></label></div><div className="frequency-choice"><button className="active" type="button">Une fois</button><button type="button">Chaque semaine</button><button type="button">À définir</button></div><label className="note-field"><span>Une précision utile</span><textarea defaultValue="Déjeuner préparé. Doudou dans le sac bleu." /></label></div>}
      {step === 4 && <div className="request-route"><div className="request-summary"><Avatar person="daughter" /><span><small>Mercredi · 08:00 - 13:00</small><b>Garder Yemaya</b></span><IconButton label="Modifier"><Pencil size={16} /></IconButton></div><h3>Circle sollicitera dans cet ordre</h3><RouteStep number="1" title="Marie" meta="Grand-mère · disponible le mercredi" active /><RouteStep number="2" title="Jean-Baptiste" meta="Oncle · si Marie ne répond pas" /><RouteStep number="3" title="Service de garde" meta="Uniquement avec votre accord · estimation 110 €" optional /><div className="share-box"><LockKeyhole size={18} /><span><b>Informations partagées</b><small>Prénom, horaire, adresse et consignes. Santé seulement si vous l'ajoutez.</small></span></div></div>}
    </>}
    <footer className="panel-footer"><button className="text-button" type="button" onClick={sent ? onClose : step === 1 ? onClose : () => setStep(step - 1)}>{sent || step === 1 ? "Fermer" : "Retour"}</button>{!sent && <button className="primary-button primary-button--forest" disabled={saving} type="button" onClick={() => void advance()}>{saving && <LoaderCircle className="spin" size={17} />}{step === 4 ? "Lancer la recherche" : "Continuer"}<ChevronRight size={16} /></button>}</footer>
  </OverlayFrame>;
}

function RouteStep({ number, title, meta, active, optional }: { number: string; title: string; meta: string; active?: boolean; optional?: boolean }) { return <div className={active ? "route-step active" : "route-step"}><i>{number}</i><span><b>{title}</b><small>{meta}</small></span>{optional ? <em>Optionnel</em> : active ? <Check size={17} /> : <Clock3 size={17} />}</div>; }

function HelperSpace({ onClose, onPropose }: { onClose: () => void; onPropose: () => void }) {
  const [accepted, setAccepted] = useState(false);
  return <OverlayFrame title="Bonjour Marie" eyebrow="Votre espace Circle" onClose={onClose} wide>
    <div className="helper-portal-lead"><span className="helper-avatar">MM</span><div><small>Une demande vous attend</small><h3>Récupérer Yemaya vendredi</h3><p>École maternelle · 17:00</p></div></div>
    <div className="helper-portal-grid"><section><span className="eyebrow">Ce qu'il faut savoir</span><h3>Une sortie d'école simple.</h3><PortalLine icon={<MapPin size={18} />} title="École" value="Entrée rue des Tilleuls" /><PortalLine icon={<UserCheck size={18} />} title="Autorisation" value="Votre nom est déjà enregistré" /><PortalLine icon={<Phone size={18} />} title="En cas de besoin" value="Ludiviane · 06 •• •• 24 18" /></section><section><span className="eyebrow">Vos disponibilités</span><h3>Circle s'appuie sur vos habitudes.</h3><PortalLine icon={<CalendarClock size={18} />} title="Vendredi" value="Disponible après 16:30" /><PortalLine icon={<Trees size={18} />} title="Week-end" value="Sur demande" /><button className="text-button" type="button">Modifier mes disponibilités <ChevronRight size={16} /></button></section></div>
    <button className="helper-offer" type="button" onClick={onPropose}><span className="tile-icon tile-icon--coral"><HandHeart size={19} /></span><span><small>Une envie à partager ?</small><b>Proposer un moment avec Yemaya</b><em>Les parents vérifient tranquillement leurs impératifs.</em></span><ChevronRight size={18} /></button>
    <div className="portal-privacy"><LockKeyhole size={18} /><span><b>Votre espace reste personnel.</b><small>Vous ne voyez que les demandes qui vous sont adressées et vos propres propositions.</small></span></div>
    <footer className="panel-footer"><button className="text-button" type="button">Je ne peux pas</button><button className="primary-button primary-button--forest" type="button" onClick={() => setAccepted(true)}>{accepted ? <><Check size={17} /> C'est confirmé</> : "Je peux m'en charger"}</button></footer>
  </OverlayFrame>;
}

function ProposeTime({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [sent, setSent] = useState(false);
  return <OverlayFrame title={sent ? "Proposition envoyée" : step === 1 ? "Avec qui aimeriez-vous passer du temps ?" : step === 2 ? "Quel moment vous ferait plaisir ?" : "Votre proposition"} eyebrow={sent ? "Les parents vont regarder" : `Depuis l'espace de Marie · ${step} sur 3`} onClose={onClose} wide>
    <div className="flow-progress"><i className="done" /><i className={step >= 2 ? "done" : ""} /><i className={step >= 3 ? "done" : ""} /></div>
    {sent ? <div className="proposal-success"><span><Send size={27} /></span><h3>C’est proposé, sans pression.</h3><p>Ludiviane et Aimé verront ensemble si ce moment convient à Yemaya et à leur organisation.</p><div><Avatar person="daughter" /><span><small>Dimanche · après la sieste</small><b>Un après-midi chez Marie</b></span></div><small><Bell size={14} /> Marie sera prévenue dès qu’ils auront décidé.</small></div> : <>
      {step === 1 && <div className="proposal-who"><button className="proposal-person active" type="button"><Avatar person="daughter" /><span><b>Yemaya</b><small>Passer un moment ensemble</small></span><Check size={18} /></button><button className="proposal-person" type="button"><Avatar person="dog" /><span><b>Koda</b><small>Le promener ou l'accueillir</small></span><ChevronRight size={18} /></button><button className="proposal-person" type="button"><span className="tile-icon"><UsersRound size={19} /></span><span><b>Le foyer</b><small>Proposer un repas ou un coup de main</small></span><ChevronRight size={18} /></button></div>}
      {step === 2 && <div className="proposal-when"><span className="eyebrow">Pas besoin de connaître tout l'agenda</span><h3>Circle ne montre que les moments envisageables.</h3><button className="time-option active" type="button"><span className="date-tile"><b>20</b>SEP</span><span><b>Dimanche après la sieste</b><small>15:45 - 18:15 · chez Marie</small></span><Check size={17} /></button><button className="time-option" type="button"><span className="date-tile"><b>27</b>SEP</span><span><b>Dimanche matin</b><small>09:30 - 12:00 · promenade possible</small></span><ChevronRight size={17} /></button><label className="note-field"><span>Ou proposer simplement</span><textarea defaultValue="J'aimerais passer un après-midi avec Yemaya bientôt." /></label></div>}
      {step === 3 && <div className="proposal-review"><div className="proposal-note"><span className="helper-avatar">MM</span><span><small>Marie propose</small><b>Un après-midi avec Yemaya</b><em>Dimanche 20 septembre · 15:45 - 18:15</em></span></div><div className="kindness-note"><HeartPulse size={18} /><span><b>Une proposition, jamais une obligation.</b><small>Les parents peuvent accepter, ajuster ou décliner sans avoir à se justifier.</small></span></div><label className="note-field"><span>Un petit mot</span><textarea defaultValue="J'aimerais l'accueillir pour faire un gâteau et aller au parc s'il fait beau." /></label></div>}
    </>}
    <footer className="panel-footer"><button className="text-button" type="button" onClick={sent || step === 1 ? onClose : () => setStep(step - 1)}>{sent || step === 1 ? "Fermer" : "Retour"}</button>{!sent && <button className="primary-button primary-button--forest" type="button" onClick={() => step === 3 ? setSent(true) : setStep(step + 1)}>{step === 3 ? "Proposer ce moment" : "Continuer"}<ChevronRight size={16} /></button>}</footer>
  </OverlayFrame>;
}

function VisitRequest({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  return <OverlayFrame title={accepted ? "Le moment est organisé" : step === 1 ? "Marie aimerait voir Yemaya" : "Préparer ce qui l'accompagne"} eyebrow={accepted ? "Dimanche · 15:45" : `Proposition reçue · ${step} sur 2`} onClose={onClose} wide>
    <div className="flow-progress"><i className="done" /><i className={step >= 2 ? "done" : ""} /></div>
    {accepted ? <div className="visit-confirmed"><div className="family-pair"><span className="helper-avatar">MM</span><i><Check size={17} /></i><Avatar person="daughter" /></div><h3>Dimanche chez Marie.</h3><p>Le moment est dans l'agenda familial. Les consignes s'ouvriront deux heures avant et disparaîtront après le retour.</p><div className="confirmed-details"><PortalLine icon={<Clock3 size={18} />} title="Horaire" value="15:45 - 18:15" /><PortalLine icon={<Navigation size={18} />} title="Trajet" value="12 min à vélo · Aimé accompagne" /><PortalLine icon={<Bell size={18} />} title="À confirmer" value="Météo et goûter samedi soir" /></div></div> : step === 1 ? <div className="visit-review"><div className="visit-message"><span className="helper-avatar">MM</span><span><small>Marie · grand-mère</small><b>« J’aimerais passer un après-midi avec elle. »</b><em>Faire un gâteau puis aller au parc.</em></span></div><div className="calendar-fit"><span><WandSparkles size={20} /></span><div><small>Circle a rapproché les agendas</small><h3>Dimanche après la sieste fonctionne bien.</h3><p>Pas d'école le lendemain matin, aucun trajet prévu et retour avant la routine du soir.</p></div></div><div className="parent-check"><span><Avatar person="mother" /><i className="avatar-initial">A</i></span><span><small>Décision des parents</small><b>Ludiviane est disponible · avis d'Aimé attendu</b></span></div><div className="visit-options"><button className="active" type="button"><Check size={16} /><span><b>Dimanche · 15:45 - 18:15</b><small>Après la sieste · retour avant le repas</small></span></button><button type="button"><CalendarClock size={16} /><span><b>Proposer un autre moment</b><small>Circle cherche sans dévoiler vos agendas</small></span></button></div></div> : <div className="care-pass"><header><div><span className="eyebrow">Prérempli depuis le profil de Yemaya</span><h3>Seulement ce qui compte dimanche.</h3></div><span className="sync-pill"><ShieldCheck size={14} /> Accès temporaire</span></header><CareInstruction icon={<UtensilsCrossed size={18} />} title="Goûter" value="À 16:00 · compote et eau" checked /><CareInstruction icon={<MoonStar size={18} />} title="Retour" value="18:15 au plus tard · repas à la maison" checked /><CareInstruction icon={<NotebookTabs size={18} />} title="Repères" value="Toilettes avant de sortir · doudou dans le sac" checked /><CareInstruction icon={<HeartPulse size={18} />} title="Santé" value="Aucun traitement · allergie non signalée" checked /><CareInstruction icon={<Phone size={18} />} title="Contacts" value="Ludiviane puis Aimé en cas de besoin" checked /><label className="note-field"><span>Ajustement pour ce jour</span><textarea defaultValue="S'il pleut, rester chez Marie. Prévenir avant toute autre sortie." /></label><div className="care-access"><LockKeyhole size={18} /><span><b>Marie ne reçoit pas le dossier de Yemaya.</b><small>Cette fiche seule sera visible de 13:45 à 18:45, puis archivée pour les parents.</small></span></div></div>}
    <footer className="panel-footer"><button className="text-button" type="button" onClick={accepted ? onClose : step === 1 ? onClose : () => setStep(1)}>{accepted ? "Fermer" : step === 1 ? "Décliner avec douceur" : "Retour"}</button>{!accepted && <button className="primary-button primary-button--forest" type="button" onClick={() => step === 1 ? setStep(2) : setAccepted(true)}>{step === 1 ? "Préparer ce moment" : "Confirmer et partager"}<ChevronRight size={16} /></button>}</footer>
  </OverlayFrame>;
}

function CareInstruction({ icon, title, value, checked }: { icon: React.ReactNode; title: string; value: string; checked?: boolean }) { return <label className="care-instruction"><span>{icon}</span><span><b>{title}</b><small>{value}</small></span><input type="checkbox" defaultChecked={checked} /></label>; }

function CircleMap({ onClose }: { onClose: () => void }) {
  return <OverlayFrame title="Les lieux de votre cercle" eyebrow="Proximité utile, vie privée préservée" onClose={onClose} wide><div className="circle-map"><div className="circle-map__visual"><img src="/art/circle-entourage-map-v1.png" alt="Carte illustrée des lieux de vie de l'entourage" /><span className="map-label map-label--home"><Home size={13} /> Votre foyer</span><span className="map-label map-label--marie">Marie · 12 min</span><span className="map-label map-label--jb">J.-B. · 18 min</span><span className="map-label map-label--sarah">Sarah · 9 min</span></div><aside><span className="eyebrow">Autour du foyer</span><h3>La distance aide à choisir, elle ne décide pas.</h3><p>Circle tient compte du trajet, du moyen de transport et du préavis souhaité.</p><MapPerson initials="MM" name="Marie" relation="Grand-mère" trip="12 min à vélo" area="Quartier Saint-Sever" /><MapPerson initials="SA" name="Sarah" relation="Amie" trip="9 min à pied" area="Jardin des Plantes" /><MapPerson initials="JB" name="Jean-Baptiste" relation="Oncle" trip="18 min en bus" area="Centre-ville" /><div className="care-access"><LockKeyhole size={17} /><span><b>Adresse approximative par défaut.</b><small>L'adresse exacte et l'itinéraire ne sont partagés que pour un moment confirmé.</small></span></div></aside></div><footer className="panel-footer"><span className="privacy-note"><MapPinned size={15} /> Temps de trajet recalculés selon le besoin</span><button className="primary-button primary-button--forest" type="button" onClick={onClose}>Terminer</button></footer></OverlayFrame>;
}

function MapPerson({ initials, name, relation, trip, area }: { initials: string; name: string; relation: string; trip: string; area: string }) { return <button className="map-person" type="button"><i>{initials}</i><span><small>{relation} · {area}</small><b>{name}</b></span><em>{trip}</em><ChevronRight size={16} /></button>; }

function PortalLine({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) { return <div className="portal-line"><span>{icon}</span><span><small>{title}</small><b>{value}</b></span></div>; }

function AvailabilityEditor({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [noticeHours, setNoticeHours] = useState("24");
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const save = async () => { setSaving(true); try { await addRecord({ kind: "event", title: "Disponibilités de Ludiviane", status: "active", payload: { context: "availability", monday: "after_18", friday: "after_16_30", saturday: "morning", noticeHours: Number(noticeHours) } }); setSaved(true); } finally { setSaving(false); } };
  return <OverlayFrame title="Mes disponibilités" eyebrow="Ludiviane" onClose={onClose}><div className="availability-editor"><p>Indiquez seulement les moments où Circle peut vous proposer une aide.</p><AvailabilityDay day="Lundi" value="Après 18:00" active /><AvailabilityDay day="Mercredi" value="Indisponible" /><AvailabilityDay day="Vendredi" value="Après 16:30" active /><AvailabilityDay day="Samedi" value="Matin" active /><label><span>Prévenir au moins</span><select value={noticeHours} onChange={(event) => setNoticeHours(event.target.value)}><option value="2">2 heures avant</option><option value="24">La veille</option><option value="48">2 jours avant</option></select></label><div className="share-box"><Bell size={18} /><span><b>Pas de sollicitations inutiles</b><small>Circle vous contacte uniquement si votre disponibilité correspond vraiment.</small></span></div></div><footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" disabled={saving} type="button" onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Enregistrer</button>}</footer></OverlayFrame>;
}

function AvailabilityDay({ day, value, active }: { day: string; value: string; active?: boolean }) { return <button className={active ? "availability-day active" : "availability-day"} type="button"><span><b>{day}</b><small>{value}</small></span><i>{active ? <Check size={14} /> : <Plus size={14} />}</i></button>; }

function HolidayFlow({ onClose }: { onClose: () => void }) { const [saved, setSaved] = useState(false); const [saving, setSaving] = useState(false); const { addRecord } = useCircleData(); const save = async () => { setSaving(true); try { await addRecord({ kind: "event", title: "Vacances de la Toussaint", status: "to_complete", startsAt: "2026-10-17T08:00:00+02:00", dueAt: "2026-11-02T18:00:00+01:00", payload: { context: "school_holiday", child: "Yemaya", uncovered: ["Mercredi 21"], coverage: { monday: "Ludiviane", tuesday: "Centre de loisirs", thursday: "Aimé", friday: "Marie" } } }); setSaved(true); } finally { setSaving(false); } }; return <OverlayFrame title="Vacances de la Toussaint" eyebrow="17 octobre - 2 novembre" onClose={onClose} wide><div className="holiday-intro"><img src="/art/circle-school-life-v1.png" alt="" /><div><h3>10 jours à organiser</h3><p>Circle regroupe les solutions sans remplir le calendrier à votre place.</p></div></div><div className="holiday-week"><DayChoice day="Lun 19" owner="Ludiviane" /><DayChoice day="Mar 20" owner="Centre de loisirs" /><DayChoice day="Mer 21" owner="À couvrir" alert /><DayChoice day="Jeu 22" owner="Aimé" /><DayChoice day="Ven 23" owner="Marie" /></div><div className="deadline-note"><Info size={17} /><span><b>Centre de loisirs</b><small>L'inscription se fait depuis le Portail Famille. La fiche sanitaire doit être à jour.</small></span></div><footer className="panel-footer"><button className="text-button" type="button" onClick={saved ? onClose : undefined}>{saved ? "Fermer" : "Semaine suivante"}</button>{!saved && <button className="primary-button primary-button--forest" disabled={saving} type="button" onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Enregistrer la semaine</button>}</footer></OverlayFrame>; }
function DayChoice({ day, owner, alert }: { day: string; owner: string; alert?: boolean }) { return <button className={alert ? "day-choice alert" : "day-choice"} type="button"><b>{day}</b><span>{owner}</span>{alert ? <Plus size={16} /> : <Check size={16} />}</button>; }

function SchoolBookingFlow({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [fridayEvening, setFridayEvening] = useState(false);
  const [saving, setSaving] = useState(false);
  const { addRecord } = useCircleData();
  const saveBooking = async () => {
    setSaving(true);
    try {
      await addRecord({ kind: "school_booking", title: "Accueils scolaires de Yemaya", status: "planned", startsAt: "2026-09-14T07:45:00+02:00", payload: { week: "2026-09-14", fridayEvening, estimatedAmount: fridayEvening ? 91.83 : 90.24, source: "Portail Famille Rouen" } });
      setSaved(true);
    } finally { setSaving(false); }
  };
  return <OverlayFrame title={saved ? "Semaine mise à jour" : "Organiser les accueils"} eyebrow={saved ? "Agenda et finances synchronisés" : "Semaine du 14 septembre"} onClose={onClose} wide>
    {saved ? <div className="flow-success"><span><Check size={25} /></span><h3>Vendredi soir est réservé.</h3><p>L'agenda de Yemaya et la prévision d'octobre ont été ajustés. Le Portail Famille reste la source officielle.</p></div> : <div className="school-booking-flow">
      <div className="booking-guidance"><CalendarClock size={20} /><span><b>Circle montre uniquement ce qui change.</b><small>Les jours de garde de chaque parent sont déjà pris en compte.</small></span><span className="quiet-pill">J-2</span></div>
      <div className="booking-table"><header><span>Jour</span><span>Matin</span><span>Midi</span><span>Soir</span></header><BookingDay day="Lundi 14" morning lunch evening /><BookingDay day="Mardi 15" lunch evening /><BookingDay day="Jeudi 17" morning lunch evening /><BookingDay day="Vendredi 18" lunch evening={fridayEvening} onEvening={() => setFridayEvening(!fridayEvening)} /></div>
      <div className="booking-wednesday"><span className="tile-icon tile-icon--gold"><Trees size={20} /></span><span><small>Mercredi 16 · journée</small><b>08:00 - 18:00 · repas inclus</b></span><strong>13,14 €</strong><Check size={18} /></div>
      <div className="booking-price"><span><small>Prévision de septembre</small><b>{fridayEvening ? "91,83 €" : "90,24 €"}</b></span><span><small>Prochaine facture</small><b>Vers le 15 octobre</b></span><em>Selon le quotient 851 - 1 150</em></div>
    </div>}
    <footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" type="button" disabled={saving} onClick={() => void saveBooking()}>{saving && <LoaderCircle className="spin" size={17} />}Enregistrer les changements</button>}</footer>
  </OverlayFrame>;
}

function BookingDay({ day, morning, lunch, evening, onEvening }: { day: string; morning?: boolean; lunch?: boolean; evening?: boolean; onEvening?: () => void }) {
  const BookingCell = ({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) => <button aria-label={`${day} · ${label}`} aria-pressed={Boolean(active)} className={active ? "active" : ""} type="button" onClick={onClick}>{active ? <Check size={15} /> : <Plus size={15} />}</button>;
  return <div><b>{day}</b><BookingCell label="matin" active={morning} /><BookingCell label="midi" active={lunch} /><BookingCell label="soir" active={evening} onClick={onEvening} /></div>;
}

function DocumentFlow({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);
  const [title, setTitle] = useState("Autorisation de sortie scolaire");
  const [dueDate, setDueDate] = useState("2026-09-15");
  const [saving, setSaving] = useState(false);
  const { addRecord, uploadDocument } = useCircleData();
  const documentReady = (nextFile: File, nextExtraction: DocumentExtraction) => { setFile(nextFile); setExtraction(nextExtraction); if (nextExtraction.title) setTitle(nextExtraction.title); if (nextExtraction.dueDate) setDueDate(nextExtraction.dueDate); };
  const save = async () => { if (!file || !extraction) return; setSaving(true); try { const storagePath = await uploadDocument(file); await addRecord({ kind: "document", title, status: "stored", dueAt: dueDate || undefined, payload: { context: "school", child: "Yemaya", documentType: "permission", reminderDays: 2, storagePath, fileName: file.name, mimeType: file.type, extracted: { ...extraction, title, dueDate } } }); setSaved(true); } finally { setSaving(false); } };
  return <OverlayFrame title={saved ? "Document rangé" : "Ajouter un document"} eyebrow={saved ? "Dossier de Yemaya à jour" : "Dossier de Yemaya"} onClose={onClose}>{saved ? <div className="flow-success compact"><span><Check size={24} /></span><h3>{title} est rangé.</h3><p>Circle vous le rappellera deux jours avant l'échéance.</p></div> : <div className="document-workflow"><DocumentPicker domain="school" file={file} extraction={extraction} onReady={documentReady} compact={false} />{extraction && <div className="document-confirm"><ExtractionNotice extraction={extraction} /><label><span>Type</span><input value={title} onChange={(event) => setTitle(event.target.value)} /></label><div className="field-pair"><label><span>Concerne</span><input value="Yemaya" readOnly /></label><label><span>Échéance</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label></div><label className="checkbox-line"><input type="checkbox" defaultChecked /> Me rappeler deux jours avant</label></div>}</div>}<footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>{saved ? "Fermer" : "Annuler"}</button>{!saved && <button className="primary-button primary-button--forest" disabled={saving || !file || !extraction || !title.trim()} type="button" onClick={() => void save()}>{saving && <LoaderCircle className="spin" size={17} />}Confirmer et ranger</button>}</footer></OverlayFrame>;
}

function AccountMenu({ onClose }: { onClose: () => void; onOnboarding?: () => void }) { const { profileName, session, signOut } = useCircleData(); return <OverlayFrame title={profileName} eyebrow="Mon compte" onClose={onClose}><div className="account-identity"><span><UserRound size={23} /></span><div><b>{profileName}</b><small>{session.user.email}</small></div></div><div className="account-menu"><button type="button" onClick={() => void signOut()}><LogOut size={19} /><span><b>Se déconnecter</b><small>Vos données restent dans leurs foyers respectifs</small></span><ChevronRight size={17} /></button></div></OverlayFrame>; }

function Onboarding({ onClose }: { onClose: () => void }) { const [step, setStep] = useState(1); const pages = [{ title: "Bienvenue dans votre Circle.", text: "Votre famille, son rythme, et seulement ce qui compte aujourd'hui." }, { title: "À quoi ressemble votre famille ?", text: "Il n'y a pas de modèle par défaut. Circle s'adapte aux personnes et aux foyers." }, { title: "Un ou plusieurs lieux de vie ?", text: "Ajoutez les lieux utiles. Chaque personne garde son propre rythme." }, { title: "Qui peut donner un coup de main ?", text: "Les proches sont invités pour un besoin précis, jamais à tout voir." }, { title: "Votre Circle est prêt.", text: "Commencez par la prochaine chose à organiser. Le reste viendra au bon moment." }]; const page = pages[step - 1]; return <div className="onboarding" role="dialog" aria-modal="true"><header><Brand /><button type="button" onClick={onClose}>Passer</button></header><main><div className="onboarding-copy"><span className="eyebrow">{step} / {pages.length}</span><h2>{page.title}</h2><p>{page.text}</p>{step === 2 && <div className="onboarding-options"><button className="active" type="button">Deux parents, deux foyers</button><button type="button">Un seul foyer</button><button type="button">Famille recomposée</button><button type="button">Autre organisation</button></div>}{step === 3 && <div className="onboarding-options"><button className="active" type="button"><Home size={18} /> Chez Ludiviane</button><button type="button"><Plus size={18} /> Ajouter un lieu</button></div>}{step === 4 && <div className="onboarding-options"><button className="active" type="button">Marie · grand-mère</button><button type="button">Jean-Baptiste · oncle</button><button type="button"><Plus size={18} /> Ajouter plus tard</button></div>}<div className="onboarding-actions">{step > 1 && <button className="text-button" type="button" onClick={() => setStep(step - 1)}>Retour</button>}<button className="primary-button primary-button--forest" type="button" onClick={step === pages.length ? onClose : () => setStep(step + 1)}>{step === pages.length ? "Entrer dans Circle" : "Continuer"} <ChevronRight size={17} /></button></div></div><div className="onboarding-art"><img src={step === 4 ? "/art/circle-trusted-ring-v1.png" : step === 3 ? "/art/luce-household-paper-home-v1.png" : "/art/circle-school-life-v1.png"} alt="" /></div></main></div>; }

function LandingPage({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) { const footerLinks = ["Mentions légales", "Conditions générales", "Confidentialité", "Cookies", "Contact"]; return <main className="landing"><header><Brand /><nav><button type="button" onClick={onLogin}>Se connecter</button><button className="secondary-button" type="button" onClick={onStart}>Créer mon Circle</button></nav></header><section className="landing-hero"><img src="/art/circle-landing-family-v2.png" alt="Une famille et ses proches réunis autour de deux lieux de vie" /><div><span className="eyebrow">L'organisation familiale qui respire</span><h1>Circle.</h1><h2>La famille, sans tout porter seul.</h2><p>Les personnes, les lieux et les coups de main utiles. Au même endroit, seulement quand ils comptent.</p><div><button className="landing-primary" type="button" onClick={onStart}>Créer mon Circle <ChevronRight size={18} /></button><button type="button" onClick={onLogin}>J'ai déjà un compte</button></div><small><ShieldCheck size={15} /> Chaque proche ne voit que ce qui le concerne.</small></div></section><footer className="landing-footer"><span>© 2026 Circle</span><nav aria-label="Informations légales">{footerLinks.map((label) => <a href="#" key={label} onClick={(event) => event.preventDefault()}>{label}</a>)}</nav><span>Conçu pour alléger le quotidien.</span></footer></main>; }

function HouseholdsPage({ onOpen, onBack, onCreate }: { onOpen: (id: string) => void; onBack: () => void; onCreate: () => void }) {
  const { households, profileName, overviewRecords } = useCircleData();
  const [panel, setPanel] = useState<"notifications" | "account" | null>(null);
  const [deleting, setDeleting] = useState<CircleHousehold | null>(null);
  const initials = profileName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <main className="households-page"><header><Brand onClick={onBack} /><div><IconButton label="Notifications" onClick={() => setPanel("notifications")}><Bell size={19} /></IconButton><button className="account-icon" type="button" aria-label="Mon compte" title="Mon compte" onClick={() => setPanel("account")}>{initials}</button></div></header><section className="households-intro"><span className="eyebrow">Bonjour {profileName}</span><h1>Où voulez-vous entrer ?</h1><p>Chaque foyer garde son rythme, ses membres et ses accès.</p></section><section className="household-cards">{households.map((household, index) => { const householdRecords = overviewRecords.filter((record) => record.household_id === household.id); const people = sortHouseholdPeople(householdRecords.filter((record) => record.kind === "person" && personScope(record) === "household")); const next = householdRecords.filter((record) => record.kind === "event" && record.starts_at && new Date(record.starts_at).getTime() >= Date.now()).sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)))[0]; return <div className="household-card-wrap" key={household.id}><button className={index === 0 ? "household-card household-card--primary" : "household-card"} type="button" onClick={() => onOpen(household.id)}><img src={household.cover_art || "/art/circle-trusted-ring-v1.png"} alt="" /><div><span className="eyebrow"><i className="live-dot" /> {household.membership_role === "owner" ? "Vous gérez ce foyer" : "Vous êtes membre"}</span><h2>{household.name}</h2><p>{household.city || "Lieu à préciser"}</p><div className="household-mini-family">{people.length ? people.slice(0, 5).map((record) => <RecordAvatar key={record.id} record={record} size="tiny" />) : <small>Aucune personne ajoutée</small>}</div><aside><small>Prochaine chose</small><b>{next ? `${next.title} · ${eventDate(next)}` : "Rien de prévu"}</b></aside></div><ChevronRight size={22} /></button>{household.membership_role === "owner" && <button className="household-delete-button" type="button" aria-label={`Supprimer le foyer ${household.name}`} title="Supprimer ce foyer" onClick={() => setDeleting(household)}><Trash2 size={17} /></button>}</div>; })}<button className="household-create" type="button" onClick={onCreate}><Plus size={22} /><span><b>Créer un autre foyer</b><small>Un espace neuf, sans donnée d'exemple</small></span></button></section><footer><ShieldCheck size={17} /><span>Deux foyers peuvent porter le même nom : leurs identifiants et leurs données restent séparés.</span></footer>{panel === "notifications" && <Notifications onClose={() => setPanel(null)} />}{panel === "account" && <AccountMenu onClose={() => setPanel(null)} />}{deleting && <DeleteHouseholdFlow household={deleting} onClose={() => setDeleting(null)} />}</main>;
}

function DeleteHouseholdFlow({ household, onClose }: { household: CircleHousehold; onClose: () => void }) {
  const { deleteHousehold, syncing } = useCircleData();
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const remove = async () => { setError(""); try { await deleteHousehold(household.id); onClose(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de supprimer ce foyer."); } };
  return <OverlayFrame title={`Supprimer ${household.name} ?`} eyebrow="Action définitive" onClose={onClose}><div className="household-delete-flow"><span className="household-delete-flow__icon"><Trash2 size={24} /></span><h3>Tout ce foyer sera supprimé.</h3><p>Profils, agenda, documents, contrats et organisation disparaîtront pour tous ses membres. Cette action ne supprime pas votre compte ni vos autres foyers.</p><label><span>Écrivez le nom du foyer pour confirmer</span><input aria-label="Nom du foyer à supprimer" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder={household.name} autoComplete="off" /></label>{error && <div className="auth-error">{error}</div>}<div className="privacy-card"><ShieldCheck size={18} /><span><b>Réservé au propriétaire</b><small>Un administrateur ou un membre ne peut pas supprimer le foyer.</small></span></div></div><footer className="panel-footer"><button className="text-button" type="button" onClick={onClose}>Conserver le foyer</button><button className="danger-button" type="button" disabled={syncing || confirmation.trim() !== household.name} onClick={() => void remove()}>{syncing && <LoaderCircle className="spin" size={17} />} Supprimer définitivement</button></footer></OverlayFrame>;
}

function NewHouseholdFlow({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const { createHousehold, syncing } = useCircleData();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [familyShape, setFamilyShape] = useState("single_home");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); try { const id = await createHousehold({ name: name.trim(), city: city.trim(), familyShape }); onCreated(id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de créer ce foyer."); } };
  return <OverlayFrame title="Créer un autre foyer" eyebrow="Un nouvel espace séparé" onClose={onClose}><form className="real-form" onSubmit={submit}><label><span>Nom du foyer</span><input aria-label="Nom du nouveau foyer" value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></label><label><span>Ville</span><input aria-label="Ville du nouveau foyer" value={city} onChange={(event) => setCity(event.target.value)} /></label><fieldset><legend>Organisation</legend><button className={familyShape === "single_home" ? "active" : ""} type="button" onClick={() => setFamilyShape("single_home")}>Un foyer principal</button><button className={familyShape === "shared_custody" ? "active" : ""} type="button" onClick={() => setFamilyShape("shared_custody")}>Garde alternée</button><button className={familyShape === "other" ? "active" : ""} type="button" onClick={() => setFamilyShape("other")}>Autre</button></fieldset><div className="privacy-card"><ShieldCheck size={18} /><span><b>Un identifiant unique sera créé</b><small>Le nom sert uniquement à l'affichage et ne relie jamais deux foyers.</small></span></div>{error && <div className="auth-error">{error}</div>}<footer className="real-form__footer"><button className="text-button" type="button" onClick={onClose}>Annuler</button><button className="primary-button primary-button--forest" type="submit" disabled={syncing || !name.trim()}>{syncing && <LoaderCircle className="spin" size={17} />} Créer ce foyer</button></footer></form></OverlayFrame>;
}

function CircleSetup() {
  const { createHousehold, syncing, profileName } = useCircleData();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [familyShape, setFamilyShape] = useState("shared_custody");
  const [error, setError] = useState("");
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    try { await createHousehold({ name, city, familyShape }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de créer le foyer."); }
  };
  return <main className="setup-page"><header><Brand /><span>Bonjour {profileName}</span></header><section className="setup-copy"><span className="eyebrow">Votre premier Circle</span><h1>Commençons par votre foyer.</h1><p>Un nom, une ville et votre organisation. Votre profil de co-parent sera déjà prêt.</p><form onSubmit={submit}><label><span>Nom du foyer</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label><label><span>Ville</span><input value={city} onChange={(event) => setCity(event.target.value)} /></label><fieldset><legend>Votre organisation</legend><button className={familyShape === "shared_custody" ? "active" : ""} type="button" onClick={() => setFamilyShape("shared_custody")}>Deux parents, deux foyers</button><button className={familyShape === "single_home" ? "active" : ""} type="button" onClick={() => setFamilyShape("single_home")}>Un foyer principal</button><button className={familyShape === "other" ? "active" : ""} type="button" onClick={() => setFamilyShape("other")}>Autre organisation</button></fieldset>{error && <div className="auth-error">{error}</div>}<button className="landing-primary" type="submit" disabled={syncing}>{syncing && <LoaderCircle className="spin" size={18} />}Créer mon Circle<ChevronRight size={18} /></button></form></section><section className="setup-art"><img src="/art/circle-trusted-ring-v1.png" alt="Un foyer entouré de ses proches" /></section></main>;
}

function App() {
  const { selectHousehold } = useCircleData();
  const [screen, setScreen] = useState<Screen>(qaScreen === "household" ? "household" : "households");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [overlay, setOverlay] = useState<Overlay>(initialOverlay);
  const [creatingHousehold, setCreatingHousehold] = useState(false);
  const close = () => setOverlay(null);
  if (screen === "households") return <><HouseholdsPage onOpen={(id) => { selectHousehold(id); setScreen("household"); }} onBack={() => void supabase.auth.signOut()} onCreate={() => setCreatingHousehold(true)} />{creatingHousehold && <NewHouseholdFlow onClose={() => setCreatingHousehold(false)} onCreated={(id) => { selectHousehold(id); setCreatingHousehold(false); setScreen("household"); }} />}</>;
  return <div className="app-shell"><AppHeader active={tab} onTab={setTab} onOverlay={setOverlay} onHouseholds={() => setScreen("households")} onHome={() => setScreen("landing")} />{tab === "people" && <PeopleView onOverlay={setOverlay} />}{tab === "home" && <HomeView onOverlay={setOverlay} />}{tab === "subscriptions" && <SubscriptionsView onOverlay={setOverlay} />}{tab === "finance" && <FinanceView onOverlay={setOverlay} />}{overlay === "notifications" && <Notifications onClose={close} />}{overlay === "create" && <CreateMenu tab={tab} onClose={close} onDocument={() => setOverlay("document")} onHelp={() => setOverlay("help")} onSubscription={() => setOverlay("add-subscription")} />}{overlay === "handoff" && <Handoff onClose={close} />}{overlay === "help" && <HelpFlow onClose={close} />}{overlay === "need" && <NeedBuilder onClose={close} />}{overlay === "helper-space" && <HelperSpace onClose={close} onPropose={() => setOverlay("propose-time")} />}{overlay === "availability" && <AvailabilityEditor onClose={close} />}{overlay === "visit-request" && <VisitRequest onClose={close} />}{overlay === "propose-time" && <ProposeTime onClose={close} />}{overlay === "circle-map" && <CircleMap onClose={close} />}{overlay === "holiday" && <HolidayFlow onClose={close} />}{overlay === "school-booking" && <SchoolBookingFlow onClose={close} />}{overlay === "document" && <DocumentFlow onClose={close} />}{overlay === "contract-document" && <ContractDocumentFlow onClose={close} />}{overlay === "add-contract" && <AddContractFlow onClose={close} />}{overlay === "report-issue" && <ReportIssueFlow onClose={close} />}{overlay === "plan-care" && <PlanCareFlow onClose={close} />}{overlay === "equipment-detail" && <EquipmentDetail onClose={close} />}{overlay === "add-equipment" && <AddEquipmentFlow onClose={close} />}{overlay === "improvement-flow" && <ImprovementFlow onClose={close} />}{overlay === "allocation-flow" && <AllocationFlow onClose={close} />}{overlay === "subscription-detail" && <SubscriptionDetail onClose={close} />}{overlay === "add-subscription" && <AddSubscriptionFlow onClose={close} />}{overlay === "expense-document" && <ExpenseDocumentFlow onClose={close} />}{overlay === "payment-search" && <PaymentSearch onClose={close} />}{overlay === "menu" && <AccountMenu onClose={close} onOnboarding={() => setOverlay("onboarding")} />}{overlay === "onboarding" && <Onboarding onClose={close} />}</div>;
}

function AuthenticatedProduct() {
  const { loading, households } = useCircleData();
  if (loading) return <main className="app-loading"><img src="/art/circle-logo-mark-v1.png" alt="" /><LoaderCircle className="spin" size={24} /><span>Circle se prépare…</span></main>;
  if (!households.length) return <CircleSetup />;
  return <App />;
}

function Root() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    const theme = !session && !authMode ? "#0d3b32" : "#fffefa";
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme);
  }, [authMode, session]);
  if (session === undefined) return <main className="app-loading"><img src="/art/circle-logo-mark-v1.png" alt="" /><LoaderCircle className="spin" size={24} /><span>Circle se prépare…</span></main>;
  if (session) return <CircleDataProvider session={session}><AuthenticatedProduct /></CircleDataProvider>;
  if (authMode) return <AuthScreen initialMode={authMode} onBack={() => setAuthMode(null)} />;
  return <LandingPage onStart={() => setAuthMode("signup")} onLogin={() => setAuthMode("login")} />;
}

createRoot(document.getElementById("root")!).render(<Root />);
