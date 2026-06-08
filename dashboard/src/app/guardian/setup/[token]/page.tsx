import { getAgencyByGuardianToken } from "@/lib/kv";
import { SetupClient } from "./SetupClient";

export const dynamic = "force-dynamic";

export default async function GuardianSetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agency = await getAgencyByGuardianToken(token);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <img src="/logo-black.svg" alt="All-Star Recruiter" className="h-7 w-auto" />
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {!agency ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">Link not found</h1>
              <p className="text-sm text-gray-500">This setup link is invalid or has expired. Please contact All-Star Talent for a new link.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold text-blue-700 mb-4">
                  Guardian Alliance Technologies
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">Guardian Setup</h1>
                <p className="text-sm text-gray-500">
                  Enter the Guardian credentials for this department or indicate they are not yet a Guardian customer.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3 mb-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Department</div>
                <div className="font-semibold text-gray-900">{agency.agency_name}</div>
                <div className="text-sm text-gray-500">{agency.city}, {agency.state} · {agency.plan_selected ?? "Free"} plan</div>
              </div>

              <SetupClient token={token} agency={{
                agency_name: agency.agency_name,
                agency_abbr: agency.agency_abbr,
                city: agency.city,
                state: agency.state,
                plan_selected: agency.plan_selected,
                guardian_api_key: agency.guardian_api_key ?? "",
                guardian_link: agency.guardian_link ?? "",
                guardian_status: agency.guardian_status ?? "pending",
                guardian_setup_completed_at: agency.guardian_setup_completed_at ?? null,
              }} />
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            All-Star Recruiter · <a href="https://lawenforcementrecruiter.com" className="hover:text-gray-600">lawenforcementrecruiter.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
