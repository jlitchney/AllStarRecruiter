import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect, notFound } from "next/navigation";
import { getAgency, getSettings } from "@/lib/kv";
import { AgencyDetailClient } from "./AgencyDetailClient";

export const dynamic = "force-dynamic";

export default async function AgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const [agency, settings] = await Promise.all([getAgency(id), getSettings()]);
  if (!agency) notFound();

  return (
    <AgencyDetailClient
      agency={agency}
      tenants={settings.tenants ?? []}
      departmentTemplates={settings.departmentTemplates ?? []}
    />
  );
}
