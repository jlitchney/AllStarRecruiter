import { notFound } from "next/navigation";
import { getAgencyBySlug } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://app.lawenforcementrecruiter.com";

export default async function TenDLCPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const agencySlug = generateSlug(agency);
  const termsUrl = `${APP_URL}/terms-and-conditions/${agencySlug}`;
  const privacyUrl = `${APP_URL}/privacy-policy/${agencySlug}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header style={{ background: "#1a3a6e" }} className="px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {agency.logo_url && (
            <img src={agency.logo_url} alt={agency.agency_name} className="h-12 w-12 object-contain rounded bg-white p-1 shrink-0" />
          )}
          <div>
            <div className="text-white font-bold text-lg leading-tight">{agency.agency_name}</div>
            <div className="text-blue-200 text-sm">{agency.city}, {agency.state} {agency.zip}</div>
          </div>
        </div>
      </header>

      {/* Page title */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">10DLC Campaign Registration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            This page provides information required for 10-Digit Long Code (10DLC) SMS campaign registration with The Campaign Registry (TCR) and wireless carriers.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 text-sm text-gray-700 leading-relaxed">

        {/* Organization info */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">Organization Information</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Organization Name", agency.agency_name],
                  ["Organization Type", "Government / Public Safety Agency"],
                  ["Industry Vertical", "Government"],
                  ["Address", `${agency.address}, ${agency.city}, ${agency.state} ${agency.zip}`],
                  ["Phone", agency.phone],
                  ["Email", agency.email],
                  ["Abbreviation", agency.agency_abbr],
                ].filter(([, v]) => v).map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 font-semibold text-gray-600 w-48 border-b border-gray-100">{label}</td>
                    <td className="px-4 py-2.5 text-gray-900 border-b border-gray-100">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Campaign info */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">Campaign Information</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Use Case", "Public Service Announcement / Low Volume Mixed"],
                  ["Campaign Name", `${agency.agency_name} Recruiting`],
                  ["Vertical", "Government / Public Safety"],
                  ["Embedded Link", "Yes — links to application forms and recruiting website"],
                  ["Embedded Phone", "No"],
                  ["Age-Gated Content", "No"],
                  ["Subscriber Opt-In", "Website form"],
                  ["Direct Lending", "No"],
                ].map(([label, value], i) => (
                  <tr key={label} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 font-semibold text-gray-600 w-48 border-b border-gray-100">{label}</td>
                    <td className="px-4 py-2.5 text-gray-900 border-b border-gray-100">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Campaign description */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Campaign Description</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p>
              {agency.agency_name} uses SMS messaging to communicate with job applicants and candidates regarding law enforcement
              career opportunities. Messages are sent only to individuals who have voluntarily opted in through our recruiting
              website or application process. Communications include application status updates, hiring event reminders, position
              announcements, and general recruitment information. This is a one-on-one and one-to-many recruiting communication
              program operated by a government public safety agency.
            </p>
          </div>
        </section>

        {/* Sample messages */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Sample Messages</h2>
          <div className="space-y-3">
            {[
              `Hi [First Name], this is ${agency.agency_name} Recruiting. We received your application for [Position]. We'll be in touch with next steps soon. Reply STOP to opt out. Msg & data rates may apply.`,
              `${agency.agency_abbr} Recruiting: Reminder — our hiring event is on [Date] at [Location]. Reply STOP to unsubscribe. Msg & data rates may apply.`,
              `${agency.agency_abbr} Update: Your application has moved to the [Stage] phase. Questions? Reply to this message or email ${agency.email}. Reply STOP to opt out.`,
              `${agency.agency_name}: A new position is open — [Job Title]. Apply at [URL]. Reply STOP to stop receiving updates. Msg & data rates may apply.`,
            ].map((msg, i) => (
              <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Sample {i + 1}</div>
                <p className="text-gray-800">{msg}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Opt-in / Opt-out */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">Opt-In / Opt-Out Process</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="font-bold text-green-800 mb-2">Opt-In Process</div>
              <p className="text-green-900">
                Individuals opt in by completing an application or inquiry form on the {agency.agency_name} recruiting website.
                The form contains explicit consent language: <em>&ldquo;By submitting this form, I agree to receive text messages
                from {agency.agency_name} regarding my application and recruitment-related communications. Message and data rates
                may apply. Reply STOP to opt out at any time.&rdquo;</em>
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="font-bold text-red-800 mb-2">Opt-Out Process</div>
              <p className="text-red-900">
                Recipients can opt out at any time by replying <strong>STOP</strong> to any message. Upon receiving a STOP
                request, a final confirmation message is sent and no further messages are delivered to that number.
                Recipients may also contact {agency.email} to request removal.
              </p>
            </div>
          </div>
        </section>

        {/* Help */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Help Keyword</h2>
          <p>
            Recipients may reply <strong>HELP</strong> to any message to receive assistance. The HELP response includes
            the agency name, a brief description of the program, and contact information ({agency.email}
            {agency.phone && `, ${agency.phone}`}).
          </p>
        </section>

        {/* Compliance links */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">Compliance Documents</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href={termsUrl}
              className="block bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-4 transition-colors group"
            >
              <div className="font-bold text-gray-900 group-hover:text-blue-900 mb-1">Terms and Conditions</div>
              <div className="text-xs text-gray-500 break-all">{termsUrl}</div>
            </a>
            <a
              href={privacyUrl}
              className="block bg-gray-50 border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl p-4 transition-colors group"
            >
              <div className="font-bold text-gray-900 group-hover:text-blue-900 mb-1">Privacy Policy</div>
              <div className="text-xs text-gray-500 break-all">{privacyUrl}</div>
            </a>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
          <address className="not-italic space-y-1">
            <p className="font-semibold text-gray-900">{agency.agency_name}</p>
            <p>{agency.address}</p>
            <p>{agency.city}, {agency.state} {agency.zip}</p>
            {agency.phone && <p><a href={`tel:${agency.phone}`} className="text-blue-700 underline">{agency.phone}</a></p>}
            <p><a href={`mailto:${agency.email}`} className="text-blue-700 underline">{agency.email}</a></p>
          </address>
        </section>

      </main>

      {/* Footer nav */}
      <footer className="border-t border-gray-200 bg-gray-50 py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} {agency.agency_name}. All rights reserved.</p>
          <nav className="flex gap-4 text-xs text-blue-700">
            <a href={termsUrl} className="hover:underline">Terms &amp; Conditions</a>
            <a href={privacyUrl} className="hover:underline">Privacy Policy</a>
            <span className="font-semibold text-gray-900">10DLC Submission</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
