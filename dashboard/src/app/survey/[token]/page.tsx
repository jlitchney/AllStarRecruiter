import { getAgencyBySurveyToken } from "@/lib/kv";
import { SurveyClient } from "./SurveyClient";

export const dynamic = "force-dynamic";

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const agency = await getAgencyBySurveyToken(token);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-black.svg" alt="All-Star Recruiter" className="h-7 w-auto" />
      </header>

      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {!agency ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-lg font-bold text-gray-900 mb-2">Link not found</h1>
              <p className="text-sm text-gray-500">This link is invalid or has expired. Please contact All-Star Talent for assistance.</p>
            </div>
          ) : (
            <SurveyClient
              token={token}
              agencyName={agency.agency_name}
              firstName={agency.first_name}
              alreadyCompleted={!!agency.survey_completed_at}
              existingResponses={agency.survey_responses ?? null}
            />
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            All-Star Recruiter · <a href="https://lawenforcementrecruiter.com" className="hover:text-gray-600">lawenforcementrecruiter.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
