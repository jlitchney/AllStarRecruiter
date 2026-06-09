import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAgency, getSettings, updateAgency } from "@/lib/kv";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [agency, settings] = await Promise.all([getAgency(id), getSettings()]);

  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  const url = settings.webhookUrl?.trim();
  if (!url) return NextResponse.json({ error: "Webhook URL is not configured in Settings." }, { status: 400 });

  const payload = {
    embedkey: settings.webhookEmbedKey ?? "",

    // Identity
    id: agency.id,
    agency_name: agency.agency_name,
    agency_abbr: agency.agency_abbr,

    // Address
    address: agency.address,
    city: agency.city,
    state: agency.state,
    zip: agency.zip,

    // Contact
    first_name: agency.first_name,
    last_name: agency.last_name,
    title: agency.title ?? "",
    email: agency.email,
    phone: agency.phone,

    // Agency details
    agency_size: agency.agency_size,
    plan_selected: agency.plan_selected ?? "free",
    variant: agency.variant,
    status: agency.status,

    // Configuration
    tenant: agency.tenant ?? "",
    department_template: agency.department_template ?? "",
    timezone: agency.timezone ?? "",
    logo_url: agency.logo_url ?? "",

    // Guardian
    guardian_api_key: agency.guardian_api_key ?? "",
    guardian_link: agency.guardian_link ?? "",
    guardian_status: agency.guardian_status ?? "",

    // Twilio
    twilio_account_sid: agency.twilio_account_sid ?? "",
    twilio_auth_token: agency.twilio_auth_token ?? "",

    // Billing
    billing_status: agency.billing_status ?? "",
    renewal_date: agency.renewal_date ?? "",

    // Notes
    notes: agency.notes ?? "",

    // Attribution
    utm_source: agency.utm_source ?? "",
    utm_medium: agency.utm_medium ?? "",
    utm_campaign: agency.utm_campaign ?? "",
    ref: agency.ref ?? "",

    // Timestamps
    created_at: agency.created_at,
    updated_at: agency.updated_at,
  };

  let status: "success" | "error" = "error";
  let responseBody = "";
  let httpStatus = 0;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    httpStatus = res.status;
    responseBody = await res.text().catch(() => "");
    status = res.ok ? "success" : "error";
  } catch (err) {
    responseBody = err instanceof Error ? err.message : String(err);
  }

  await updateAgency(id, {
    webhook_last_sent_at: new Date().toISOString(),
    webhook_last_status: status,
  });

  if (status === "success") {
    return NextResponse.json({ ok: true, httpStatus, response: responseBody });
  }
  return NextResponse.json(
    { error: `Webhook failed (HTTP ${httpStatus || "network error"})`, response: responseBody },
    { status: 502 }
  );
}
