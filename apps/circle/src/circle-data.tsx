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
  selectHousehold: (id: string) => void;
  createHousehold: (input: { name: string; city: string; familyShape: string }) => Promise<void>;
  addRecord: (input: { kind: CircleRecordKind; title: string; status?: string; startsAt?: string; dueAt?: string; payload?: Record<string, unknown> }) => Promise<CircleRecord>;
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

  const activeHousehold = households.find((item) => item.id === activeId) || households[0] || null;

  const load = useCallback(async () => {
    const [{ data: profile }, { data: memberships, error }] = await Promise.all([
      supabase.from("circle_profiles").select("display_name").eq("id", session.user.id).maybeSingle(),
      supabase.from("circle_household_members").select("household:circle_households(*)").eq("user_id", session.user.id).eq("status", "active"),
    ]);
    if (error) throw error;
    if (profile?.display_name) setProfileName(profile.display_name);
    const next = (memberships || []).flatMap((entry) => entry.household ? [entry.household as unknown as CircleHousehold] : []);
    setHouseholds(next);
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
      await load();
      if (data) setActiveId(String(data));
    } finally {
      setSyncing(false);
    }
  }, [load]);

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
      return created;
    } finally {
      setSyncing(false);
    }
  }, [activeHousehold, session.user.id]);

  const value = useMemo<CircleDataValue>(() => ({
    session,
    loading,
    syncing,
    profileName,
    households,
    activeHousehold,
    records,
    selectHousehold: setActiveId,
    createHousehold,
    addRecord,
    signOut: async () => { await supabase.auth.signOut(); },
  }), [session, loading, syncing, profileName, households, activeHousehold, records, createHousehold, addRecord]);

  return <CircleDataContext.Provider value={value}>{children}</CircleDataContext.Provider>;
}

export function useCircleData() {
  const value = useContext(CircleDataContext);
  if (!value) throw new Error("useCircleData doit être utilisé dans CircleDataProvider");
  return value;
}
