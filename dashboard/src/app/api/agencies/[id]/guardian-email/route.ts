import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ensureGuardianToken } from "@/lib/kv";
import { sendGuardianSetupEmail } from "@/lib/email";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agency = await ensureGuardianToken(id);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sendGuardianSetupEmail(agency);
  return NextResponse.json({ ok: true });
}
