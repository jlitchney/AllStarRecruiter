import { v4 as uuidv4 } from "uuid";
import type { Agency, AgencyStatus } from "@/types";

const AGENCIES_INDEX_KEY = "asr:agencies:index";
const agencyKey = (id: string) => `asr:agency:${id}`;

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

export async function createAgency(data: Omit<Agency, "id" | "created_at" | "updated_at" | "status">): Promise<Agency> {
  const now = new Date().toISOString();
  const agency: Agency = {
    ...data,
    id: uuidv4(),
    created_at: now,
    updated_at: now,
    status: "need-to-setup",
  };

  if (!hasKV()) {
    memAgencies[agency.id] = agency;
    memIndex = [agency.id, ...memIndex];
    return agency;
  }

  const db = await kv();
  const ids = (await db.get<string[]>(AGENCIES_INDEX_KEY)) ?? [];
  await Promise.all([
    db.set(agencyKey(agency.id), agency),
    db.set(AGENCIES_INDEX_KEY, [agency.id, ...ids]),
  ]);
  return agency;
}

export async function updateAgency(id: string, patch: Partial<Pick<Agency, "status" | "notes">>): Promise<Agency | null> {
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

export async function getAgenciesByStatus(status: AgencyStatus): Promise<Agency[]> {
  const all = await getAgencies();
  return all.filter((a) => a.status === status);
}
