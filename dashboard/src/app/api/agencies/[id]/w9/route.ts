import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { put, del } from "@vercel/blob";
import { getAgency, updateAgency } from "@/lib/kv";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agency = await getAgency(id);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Delete old W9 if one exists
  if (agency.w9_url) {
    await del(agency.w9_url).catch(() => {});
  }

  const blob = await put(`w9/${id}.pdf`, file, { access: "public", contentType: "application/pdf" });
  const updated = await updateAgency(id, { w9_url: blob.url });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agency = await getAgency(id);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (agency.w9_url) {
    await del(agency.w9_url).catch(() => {});
  }

  const updated = await updateAgency(id, { w9_url: undefined });
  return NextResponse.json(updated);
}
