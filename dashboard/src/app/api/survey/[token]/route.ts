import { NextRequest, NextResponse } from "next/server";
import { getAgencyBySurveyToken, updateAgency } from "@/lib/kv";
import type { SurveyResponses } from "@/types";

function ext(filename: string): string {
  const m = filename.match(/\.[^.]+$/);
  return m ? m[0].toLowerCase() : "";
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agency = await getAgencyBySurveyToken(token);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();

  const responses: SurveyResponses = {
    challenges:       (formData.get("challenges")       as string) || undefined,
    positions:        (formData.get("positions")        as string) || undefined,
    application_links:(formData.get("application_links") as string) || undefined,
    hiring_process:   (formData.get("hiring_process")   as string) || undefined,
    tracking_goals:   (formData.get("tracking_goals")   as string) || undefined,
    submitted_at: new Date().toISOString(),
  };

  const logoFile = formData.get("logo") as File | null;
  if (logoFile && logoFile.size > 0) {
    const { put } = await import("@vercel/blob");
    const blob = await put(
      `survey-logos/${agency.id}-${Date.now()}${ext(logoFile.name)}`,
      logoFile,
      { access: "public" }
    );
    responses.logo_url = blob.url;
  }

  await updateAgency(agency.id, {
    survey_completed_at: new Date().toISOString(),
    survey_responses: responses,
    ...(responses.logo_url ? { logo_url: responses.logo_url } : {}),
  });

  return NextResponse.json({ ok: true });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agency = await getAgencyBySurveyToken(token);
  if (!agency) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    agency_name: agency.agency_name,
    first_name: agency.first_name,
    completed: !!agency.survey_completed_at,
    responses: agency.survey_responses ?? null,
  });
}
