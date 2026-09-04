import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type CircleRecordKind =
  | "person"
  | "event"
  | "routine"
  | "care_need"
  | "maintenance"
  | "contract"
  | "equipment"
  | "improvement"
  | "subscription"
  | "expense"
  | "document"
  | "school_booking";

export interface CircleHousehold {
  id: string;
  name: string;
  city: string;
  family_shape: string;
  cover_art: string;
  created_at: string;
}

export interface CircleRecord {
  id: string;
  household_id: string;
  kind: CircleRecordKind;
  title: string;
  status: string;
  starts_at: string | null;
  due_at: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface CircleDataValue {
  session: Session;
  loading: boolean;
  syncing: boolean;
  profileName: string;
  households: CircleHousehold[];
  activeHousehold: CircleHousehold | null;
  records: CircleRecord[];
  overviewRecords: CircleRecord[];
  selectHousehold: (id: string) => void;
  createHousehold: (input: { name: string; city: string; familyShape: string }) => Promise<string>;
  addRecord: (input: { kind: CircleRecordKind; title: string; status?: string; startsAt?: string; dueAt?: string; payload?: Record<string, unknown> }) => Promise<CircleRecord>;
  updateRecord: (id: string, input: { title?: string; status?: string; startsAt?: string | null; dueAt?: string | null; payload?: Record<string, unknown> }) => Promise<CircleRecord>;
  deleteRecord: (id: string) => Promise<void>;
  uploadDocument: (file: File) => Promise<string>;
  uploadProfileImage: (file: File) => Promise<string>;
  deleteStoredFile: (path: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const CircleDataContext = createContext<CircleDataValue | null>(null);

export function CircleDataProvider({ session, children }: PropsWithChildren<{ session: Session }>) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [profileName, setProfileName] = useState(session.user.user_metadata.full_name || "Mon compte");
  const [households, setHouseholds] = useState<CircleHousehold[]>([]);
  const [activeId, setActiveId] = useState(() => localStorage.getItem("circle:active-household"));
  const [records, setRecords] = useState<CircleRecord[]>([]);
  const [overviewRecords, setOverviewRecords] = useState<CircleRecord[]>([]);

  const activeHousehold = households.find((item) => item.id === activeId) || households[0] || null;

  const load = useCallback(async () => {
    const [{ data: profile }, { data: memberships, error }] = await Promise.all([
      supabase.from("circle_profiles").select("display_name,avatar_url").eq("id", session.user.id).maybeSingle(),
      supabase.from("circle_household_members").select("role,household:circle_households(*)").eq("user_id", session.user.id).eq("status", "active"),
    ]);
    if (error) throw error;
    if (profile?.display_name) setProfileName(profile.display_name);
    const next = (memberships || []).flatMap((entry) => entry.household ? [entry.household as unknown as CircleHousehold] : []);
    setHouseholds(next);
    if (next.length) {
      const { data: overview } = await supabase.from("circle_records")
        .select("*")
        .in("household_id", next.map((item) => item.id))
        .in("kind", ["person", "event"])
        .order("created_at", { ascending: false });
      let nextOverview = (overview || []) as CircleRecord[];
      const ownerHouseholds = (memberships || [])
        .filter((entry) => entry.role === "owner" && entry.household)
        .map((entry) => (entry.household as unknown as CircleHousehold).id);
      const missingOwnerProfiles = ownerHouseholds.filter((householdId) => !nextOverview.some((record) =>
        record.household_id === householdId && record.kind === "person" && record.payload.userId === session.user.id
      ));
      if (missingOwnerProfiles.length) {
        const displayName = profile?.display_name || session.user.user_metadata.full_name || "Moi";
        const { error: ownerError } = await supabase.from("circle_records").insert(missingOwnerProfiles.map((householdId) => ({
          household_id: householdId,
          kind: "person",
          title: displayName,
          status: "active",
          payload: {
            scope: "household",
            personType: "adult",
            relation: "Co-parent",
            accountLinked: true,
            userId: session.user.id,
            email: session.user.email || "",
            avatarPreset: 0,
          },
          created_by: session.user.id,
        })));
        if (ownerError) throw ownerError;
        const { data: refreshed, error: refreshError } = await supabase.from("circle_records")
          .select("*")
          .in("household_id", next.map((item) => item.id))
          .in("kind", ["person", "event"])
          .order("created_at", { ascending: false });
        if (refreshError) throw refreshError;
        nextOverview = (refreshed || []) as CircleRecord[];
      }
      setOverviewRecords(nextOverview);
    } else {
      setOverviewRecords([]);
    }
    setActiveId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id || null);
    setLoading(false);
  }, [session.user.id]);

  useEffect(() => {
    void load().catch(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!activeHousehold) {
      setRecords([]);
      return;
    }
    localStorage.setItem("circle:active-household", activeHousehold.id);
    const fetchRecords = async () => {
      const { data } = await supabase.from("circle_records").select("*").eq("household_id", activeHousehold.id).order("created_at", { ascending: false });
      setRecords((data || []) as CircleRecord[]);
    };
    void fetchRecords();
    const channel = supabase.channel(`circle:${activeHousehold.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "circle_records", filter: `household_id=eq.${activeHousehold.id}` }, fetchRecords)
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [activeHousehold?.id]);

  const createHousehold = useCallback(async ({ name, city, familyShape }: { name: string; city: string; familyShape: string }) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.rpc("circle_create_household", {
        household_name: name,
        household_city: city,
        household_family_shape: familyShape,
      });
      if (error) throw error;
      const householdId = String(data);
      const { error: personError } = await supabase.from("circle_records").insert({
        household_id: householdId,
        kind: "person",
        title: profileName,
        status: "active",
        payload: {
          scope: "household",
          personType: "adult",
          relation: "Co-parent",
          accountLinked: true,
          userId: session.user.id,
          email: session.user.email || "",
          avatarPreset: 0,
        },
        created_by: session.user.id,
      });
      if (personError) throw personError;
      await load();
      setActiveId(householdId);
      return householdId;
    } finally {
      setSyncing(false);
    }
  }, [load, profileName, session.user.id]);

  const addRecord = useCallback(async ({ kind, title, status = "active", startsAt, dueAt, payload = {} }: { kind: CircleRecordKind; title: string; status?: string; startsAt?: string; dueAt?: string; payload?: Record<string, unknown> }) => {
    if (!activeHousehold) throw new Error("Aucun foyer sélectionné");
    setSyncing(true);
    try {
      const { data, error } = await supabase.from("circle_records").insert({
        household_id: activeHousehold.id,
        kind,
        title,
        status,
        starts_at: startsAt || null,
        due_at: dueAt || null,
        payload,
        created_by: session.user.id,
      }).select("*").single();
      if (error) throw error;
      const created = data as CircleRecord;
      setRecords((current) => [created, ...current.filter((record) => record.id !== created.id)]);
      if (created.kind === "person" || created.kind === "event") setOverviewRecords((current) => [created, ...current.filter((record) => record.id !== created.id)]);
      return created;
    } finally {
      setSyncing(false);
    }
  }, [activeHousehold, session.user.id]);

  const updateRecord = useCallback(async (id: string, input: { title?: string; status?: string; startsAt?: string | null; dueAt?: string | null; payload?: Record<string, unknown> }) => {
    if (!activeHousehold) throw new Error("Aucun foyer sélectionné");
    setSyncing(true);
    try {
      const updates: Record<string, unknown> = {};
      if (input.title !== undefined) updates.title = input.title;
      if (input.status !== undefined) updates.status = input.status;
      if (input.startsAt !== undefined) updates.starts_at = input.startsAt;
      if (input.dueAt !== undefined) updates.due_at = input.dueAt;
      if (input.payload !== undefined) updates.payload = input.payload;
      const { data, error } = await supabase.from("circle_records")
        .update(updates)
        .eq("id", id)
        .eq("household_id", activeHousehold.id)
        .select("*")
        .single();
      if (error) throw error;
      const updated = data as CircleRecord;
      setRecords((current) => current.map((record) => record.id === updated.id ? updated : record));
      if (updated.kind === "person" || updated.kind === "event") setOverviewRecords((current) => current.map((record) => record.id === updated.id ? updated : record));
      return updated;
    } finally {
      setSyncing(false);
    }
  }, [activeHousehold]);

  const deleteRecord = useCallback(async (id: string) => {
    if (!activeHousehold) throw new Error("Aucun foyer sélectionné");
    setSyncing(true);
    try {
      const { error } = await supabase.from("circle_records").delete().eq("id", id).eq("household_id", activeHousehold.id);
      if (error) throw error;
      setRecords((current) => current.filter((record) => record.id !== id));
      setOverviewRecords((current) => current.filter((record) => record.id !== id));
    } finally {
      setSyncing(false);
    }
  }, [activeHousehold]);

  const uploadDocument = useCallback(async (file: File) => {
    if (!activeHousehold) throw new Error("Aucun foyer sélectionné");
    const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "document";
    const path = `${session.user.id}/${activeHousehold.id}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from("circle-documents").upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) throw error;
    return path;
  }, [activeHousehold, session.user.id]);

  const uploadProfileImage = useCallback(async (file: File) => {
    if (!activeHousehold) throw new Error("Aucun foyer sélectionné");
    if (!file.type.startsWith("image/")) throw new Error("Choisissez une image JPEG, PNG, HEIC ou HEIF.");
    if (file.size > 8 * 1024 * 1024) throw new Error("Cette image dépasse 8 Mo.");
    const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    const path = `${session.user.id}/${activeHousehold.id}/avatars/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from("circle-documents").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  }, [activeHousehold, session.user.id]);

  const deleteStoredFile = useCallback(async (path: string) => {
    const { error } = await supabase.storage.from("circle-documents").remove([path]);
    if (error) throw error;
  }, []);

  const value = useMemo<CircleDataValue>(() => ({
    session,
    loading,
    syncing,
    profileName,
    households,
    activeHousehold,
    records,
    overviewRecords,
    selectHousehold: setActiveId,
    createHousehold,
    addRecord,
    updateRecord,
    deleteRecord,
    uploadDocument,
    uploadProfileImage,
    deleteStoredFile,
    signOut: async () => { await supabase.auth.signOut(); },
  }), [session, loading, syncing, profileName, households, activeHousehold, records, overviewRecords, createHousehold, addRecord, updateRecord, deleteRecord, uploadDocument, uploadProfileImage, deleteStoredFile]);

  return <CircleDataContext.Provider value={value}>{children}</CircleDataContext.Provider>;
}

export function useCircleData() {
  const value = useContext(CircleDataContext);
  if (!value) throw new Error("useCircleData doit être utilisé dans CircleDataProvider");
  return value;
}
