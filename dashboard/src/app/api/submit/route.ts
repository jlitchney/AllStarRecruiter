import { NextRequest, NextResponse } from "next/server";
import { createAgency } from "@/lib/kv";
import { sendNewAgencyNotification } from "@/lib/email";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://lawenforcementrecruiter.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) ??
      Object.fromEntries(await req.formData().catch(() => new FormData()));

    const required = ["agency_name", "agency_abbr", "address", "city", "state", "zip", "first_name", "last_name", "email", "phone", "agency_size"];
    for (const field of required) {
      if (!body[field]?.toString().trim()) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400, headers: CORS_HEADERS });
      }
    }

    const agency = await createAgency({
      agency_name: body.agency_name,
      agency_abbr: body.agency_abbr?.toUpperCase(),
      address: body.address,
      city: body.city,
      state: body.state,
      zip: body.zip,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: body.phone,
      title: body.title ?? undefined,
      agency_size: body.agency_size,
      variant: body.variant ?? "unknown",
      plan_selected: body.plan_selected ?? undefined,
      utm_source: body.utm_source ?? undefined,
      utm_medium: body.utm_medium ?? undefined,
      utm_campaign: body.utm_campaign ?? undefined,
      ref: body.ref ?? body.guardian_ref ?? undefined,
    });

    await sendNewAgencyNotification(agency);

    return NextResponse.json({ ok: true, id: agency.id }, { status: 201, headers: CORS_HEADERS });
  } catch (err) {
    console.error("submit error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500, headers: CORS_HEADERS });
  }
}
