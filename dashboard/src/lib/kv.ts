import { v4 as uuidv4 } from "uuid";
import type { Agency, AgencyStatus, GuardianStatus } from "@/types";
import { generateSlug } from "@/lib/slug";

const AGENCIES_INDEX_KEY = "asr:agencies:index";
const agencyKey = (id: string) => `asr:agency:${id}`;
const guardianTokenKey = (token: string) => `asr:guardian-token:${token}`;

const hasKV = () =>
  !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

async function kv() {
  const { createClient } = await import("@vercel/kv");
  return createClient({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
    cache: "no-store",
  });
}

// In-memory fallback for local dev without KV
let memIndex: string[] = [];
const memAgencies: Record<string, Agency> = {};

export async function getAgencies(): Promise<Agency[]> {
  if (!hasKV()) {
    return memIndex.map((id) => memAgencies[id]).filter(Boolean);
  }
  const db = await kv();
  const ids = (await db.get<string[]>(AGENCIES_INDEX_KEY)) ?? [];
  if (ids.length === 0) return [];
  const records = await db.mget<(Agency | null)[]>(...ids.map(agencyKey));
  return records.filter((a): a is Agency => a !== null);
}

export async function getAgency(id: string): Promise<Agency | null> {
  if (!hasKV()) return memAgencies[id] ?? null;
  const db = await kv();
  return db.get<Agency>(agencyKey(id));
}

const GUARDIAN_VARIANTS = ["guardian", "guardian-free", "guardian-v2"];

export async function createAgency(data: Omit<Agency, "id" | "created_at" | "updated_at" | "status">): Promise<Agency> {
  const now = new Date().toISOString();
  const guardianToken = GUARDIAN_VARIANTS.includes(data.variant) ? uuidv4() : undefined;
  const agency: Agency = {
    ...data,
    id: uuidv4(),
    created_at: now,
    updated_at: now,
    status: "need-to-setup",
    ...(guardianToken ? { guardian_setup_token: guardianToken, guardian_status: "pending" } : {}),
  };

  if (!hasKV()) {
    memAgencies[agency.id] = agency;
    memIndex = [agency.id, ...memIndex];
    return agency;
  }

  const db = await kv();
  const ids = (await db.get<string[]>(AGENCIES_INDEX_KEY)) ?? [];
  const writes: Promise<unknown>[] = [
    db.set(agencyKey(agency.id), agency),
    db.set(AGENCIES_INDEX_KEY, [agency.id, ...ids]),
  ];
  if (guardianToken) writes.push(db.set(guardianTokenKey(guardianToken), agency.id));
  await Promise.all(writes);
  return agency;
}

export async function getAgencyByGuardianToken(token: string): Promise<Agency | null> {
  if (!hasKV()) return null;
  const db = await kv();
  const id = await db.get<string>(guardianTokenKey(token));
  if (!id) return null;
  return getAgency(id);
}

export async function ensureGuardianToken(id: string): Promise<Agency | null> {
  const existing = await getAgency(id);
  if (!existing) return null;
  if (existing.guardian_setup_token) return existing;
  const token = uuidv4();
  const updated = { ...existing, guardian_setup_token: token, guardian_status: (existing.guardian_status ?? "pending") as Agency["guardian_status"], updated_at: new Date().toISOString() };
  if (!hasKV()) {
    memAgencies[id] = updated;
    return updated;
  }
  const db = await kv();
  await Promise.all([
    db.set(agencyKey(id), updated),
    db.set(guardianTokenKey(token), id),
  ]);
  return updated;
}

export async function updateAgency(id: string, patch: Partial<Pick<Agency, "status" | "notes" | "guardian_api_key" | "guardian_link" | "guardian_status" | "guardian_setup_completed_at" | "tenant" | "department_template" | "timezone" | "logo_url" | "webhook_last_sent_at" | "webhook_last_status" | "twilio_account_sid" | "twilio_auth_token" | "agency_name" | "agency_abbr" | "address" | "city" | "state" | "zip" | "agency_size" | "plan_selected" | "first_name" | "last_name" | "title" | "email" | "phone">>): Promise<Agency | null> {
  if (!hasKV()) {
    if (!memAgencies[id]) return null;
    memAgencies[id] = { ...memAgencies[id], ...patch, updated_at: new Date().toISOString() };
    return memAgencies[id];
  }
  const db = await kv();
  const existing = await db.get<Agency>(agencyKey(id));
  if (!existing) return null;
  const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
  await db.set(agencyKey(id), updated);
  return updated;
}

const SETTINGS_KEY = "asr:settings";

export interface AppSettings {
  notificationEmails: string[];
  tenants: string[];
  departmentTemplates: string[];
  webhookUrl?: string;
  webhookEmbedKey?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  notificationEmails: [process.env.NOTIFICATION_EMAIL ?? "jason@allstartalent.us"],
  tenants: [],
  departmentTemplates: [],
  webhookUrl: "https://app.allstarrecruiter.com/department/create/astcreateform",
  webhookEmbedKey: "",
};

export async function getSettings(): Promise<AppSettings> {
  if (!hasKV()) return { ...DEFAULT_SETTINGS };
  try {
    const db = await kv();
    return (await db.get<AppSettings>(SETTINGS_KEY)) ?? { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  if (!hasKV()) return;
  const db = await kv();
  await db.set(SETTINGS_KEY, settings);
}

export async function deleteAgency(id: string): Promise<void> {
  if (!hasKV()) {
    delete memAgencies[id];
    memIndex = memIndex.filter((i) => i !== id);
    return;
  }
  const db = await kv();
  const ids = (await db.get<string[]>(AGENCIES_INDEX_KEY)) ?? [];
  await Promise.all([
    db.del(agencyKey(id)),
    db.set(AGENCIES_INDEX_KEY, ids.filter((i) => i !== id)),
  ]);
}

export async function getAgenciesByStatus(status: AgencyStatus): Promise<Agency[]> {
  const all = await getAgencies();
  return all.filter((a) => a.status === status);
}

export async function getAgencyBySlug(slug: string): Promise<Agency | null> {
  const all = await getAgencies();
  return all.find((a) => generateSlug(a) === slug) ?? null;
}
