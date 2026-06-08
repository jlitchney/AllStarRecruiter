import { NextRequest, NextResponse } from "next/server";
import { getAgencyByGuardianToken, updateAgency, getAgency } from "@/lib/kv";
import { sendGuardianSetupCompleteNotification } from "@/lib/email";
import type { GuardianStatus } from "@/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agency = await getAgencyByGuardianToken(token);
  if (!agency) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });
  return NextResponse.json({
    id: agency.id,
    agency_name: agency.agency_name,
    agency_abbr: agency.agency_abbr,
    city: agency.city,
    state: agency.state,
    plan_selected: agency.plan_selected,
    guardian_api_key: agency.guardian_api_key ?? "",
    guardian_link: agency.guardian_link ?? "",
    guardian_status: agency.guardian_status ?? "pending",
    guardian_setup_completed_at: agency.guardian_setup_completed_at ?? null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agency = await getAgencyByGuardianToken(token);
  if (!agency) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  const body = await req.json();
  const notACustomer = !!body.not_a_customer;

  const patch: Parameters<typeof updateAgency>[1] = {
    guardian_status: (notACustomer ? "not-a-customer" : "active") as GuardianStatus,
    guardian_setup_completed_at: new Date().toISOString(),
  };

  if (!notACustomer) {
    const apiKey = body.guardian_api_key?.trim();
    const link = body.guardian_link?.trim();
    if (!apiKey) return NextResponse.json({ error: "Guardian API Key is required" }, { status: 400 });
    if (!link) return NextResponse.json({ error: "Guardian Login Link is required" }, { status: 400 });
    patch.guardian_api_key = apiKey;
    patch.guardian_link = link;
  }

  await updateAgency(agency.id, patch);

  const updated = await getAgency(agency.id);
  if (updated) await sendGuardianSetupCompleteNotification(updated);

  return NextResponse.json({ ok: true });
}
