import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getSettings, saveSettings } from "@/lib/kv";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSettings());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const emails: string[] = (body.notificationEmails ?? [])
    .map((e: string) => e.trim().toLowerCase())
    .filter((e: string) => e.includes("@"));
  await saveSettings({ notificationEmails: emails });
  return NextResponse.json({ ok: true });
}
