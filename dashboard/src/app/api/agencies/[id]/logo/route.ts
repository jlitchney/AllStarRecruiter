import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { put, del } from "@vercel/blob";
import { getAgency, updateAgency } from "@/lib/kv";

const ALLOWED_TYPES = ["image/jpeg", "image/png"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 503 });
  }

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG and PNG files are allowed" }, { status: 400 });
  }

  const existing = await getAgency(id);
  if (!existing) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  // Delete old logo blob if one exists
  if (existing.logo_url) {
    try { await del(existing.logo_url); } catch { /* ignore if already gone */ }
  }

  const ext = file.type === "image/png" ? "png" : "jpg";
  let blob;
  try {
    blob = await put(`agency-logos/${id}.${ext}`, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[logo upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const updated = await updateAgency(id, { logo_url: blob.url });
  return NextResponse.json({ url: blob.url, agency: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getAgency(id);
  if (!existing) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  if (existing.logo_url) {
    try { await del(existing.logo_url); } catch { /* ignore */ }
  }

  const updated = await updateAgency(id, { logo_url: undefined });
  return NextResponse.json({ agency: updated });
}
