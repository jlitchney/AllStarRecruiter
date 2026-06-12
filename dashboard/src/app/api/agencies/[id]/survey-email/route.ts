import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ensureSurveyToken, updateAgency } from "@/lib/kv";
import { sendOnboardingSurveyEmail } from "@/lib/email";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const agency = await ensureSurveyToken(id);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sendOnboardingSurveyEmail(agency);
  await updateAgency(id, { survey_sent_at: new Date().toISOString() });

  return NextResponse.json({ ok: true });
}
