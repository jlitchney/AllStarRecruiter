import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getAgencies } from "@/lib/kv";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const agencies = await getAgencies();

  return <DashboardClient agencies={agencies} user={session.user?.email ?? ""} />;
}
