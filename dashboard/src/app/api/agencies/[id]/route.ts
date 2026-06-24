import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getAgency, updateAgency, deleteAgency } from "@/lib/kv";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const agency = await getAgency(id);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agency);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await deleteAgency(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const patch: Parameters<typeof updateAgency>[1] = {};
  if ("status" in body) patch.status = body.status;
  if ("notes" in body) patch.notes = body.notes;
  if ("tenant" in body) patch.tenant = body.tenant || undefined;
  if ("department_template" in body) patch.department_template = body.department_template || undefined;
  if ("timezone" in body) patch.timezone = body.timezone || undefined;
  if ("twilio_account_sid" in body) patch.twilio_account_sid = body.twilio_account_sid || undefined;
  if ("twilio_auth_token" in body) patch.twilio_auth_token = body.twilio_auth_token || undefined;
  if ("twilio_phone_number" in body) patch.twilio_phone_number = body.twilio_phone_number || undefined;
  if ("twilio_status" in body) patch.twilio_status = body.twilio_status || undefined;
  if ("agency_name" in body) patch.agency_name = body.agency_name;
  if ("agency_abbr" in body) patch.agency_abbr = body.agency_abbr;
  if ("address" in body) patch.address = body.address;
  if ("city" in body) patch.city = body.city;
  if ("state" in body) patch.state = body.state;
  if ("zip" in body) patch.zip = body.zip;
  if ("agency_size" in body) patch.agency_size = body.agency_size;
  if ("plan_selected" in body) patch.plan_selected = body.plan_selected || undefined;
  if ("first_name" in body) patch.first_name = body.first_name;
  if ("last_name" in body) patch.last_name = body.last_name;
  if ("title" in body) patch.title = body.title || undefined;
  if ("email" in body) patch.email = body.email;
  if ("phone" in body) patch.phone = body.phone;
  if ("guardian_api_key" in body) patch.guardian_api_key = body.guardian_api_key || undefined;
  if ("guardian_link" in body) patch.guardian_link = body.guardian_link || undefined;
  if ("guardian_status" in body) patch.guardian_status = body.guardian_status || undefined;
  if ("billing_status" in body) patch.billing_status = body.billing_status || undefined;
  if ("renewal_date" in body) patch.renewal_date = body.renewal_date || undefined;
  if ("account_type" in body) patch.account_type = body.account_type || undefined;
  const updated = await updateAgency(id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
