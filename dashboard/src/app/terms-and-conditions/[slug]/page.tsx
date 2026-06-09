import { notFound } from "next/navigation";
import { getAgencyBySlug } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://app.lawenforcementrecruiter.com";

export default async function TermsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const agencySlug = generateSlug(agency);
  const privacyUrl = `${APP_URL}/privacy-policy/${agencySlug}`;
  const tdlcUrl = `${APP_URL}/10dlc-submission/${agencySlug}`;
  const effectiveDate = new Date(agency.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

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
          <h1 className="text-xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Effective Date: {effectiveDate}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">1. SMS Program Description</h2>
          <p>
            {agency.agency_name} (&ldquo;the Agency&rdquo;) operates a text messaging program to communicate with job applicants,
            candidates, and individuals interested in law enforcement career opportunities. By opting in, you consent to receive
            SMS text messages related to your application status, hiring events, position openings, and general recruitment
            information from {agency.agency_name}.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">2. How to Opt In</h2>
          <p>
            You may opt in to receive SMS messages by submitting an application or inquiry form on our recruiting website.
            By providing your mobile phone number and submitting the form, you expressly consent to receive text messages from
            {" "}{agency.agency_name} regarding your application and recruitment-related communications.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">3. How to Opt Out</h2>
          <p>
            You may opt out of receiving SMS messages at any time by replying <strong>STOP</strong> to any message you receive
            from us. After opting out, you will receive one final confirmation message. No further messages will be sent to
            your number unless you choose to opt back in.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">4. Help</h2>
          <p>
            For assistance, reply <strong>HELP</strong> to any message, or contact us directly at{" "}
            <a href={`mailto:${agency.email}`} className="text-blue-700 underline">{agency.email}</a>
            {agency.phone && <> or <a href={`tel:${agency.phone}`} className="text-blue-700 underline">{agency.phone}</a></>}.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">5. Message Frequency</h2>
          <p>
            Message frequency varies depending on your application status and active hiring activity. You may receive up to
            four (4) messages per month. Message frequency may be higher during active recruiting campaigns or hiring events.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">6. Message and Data Rates</h2>
          <p>
            Message and data rates may apply. Please check with your wireless carrier for details on your plan&apos;s messaging rates.
            {agency.agency_name} is not responsible for any charges incurred from your mobile carrier.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">7. Carrier Liability</h2>
          <p>
            Wireless carriers are not liable for delayed or undelivered messages. Delivery of SMS messages is subject to
            effective transmission from your network operator. {agency.agency_name} cannot guarantee delivery times.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">8. Use of Information</h2>
          <p>
            Your phone number and personal information will be used solely for recruitment-related communications from{" "}
            {agency.agency_name}. We will not sell or share your mobile number or personal information with third parties
            for marketing purposes. For complete details on how we handle your information, please review our{" "}
            <a href={privacyUrl} className="text-blue-700 underline">Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">9. Changes to These Terms</h2>
          <p>
            {agency.agency_name} reserves the right to modify these Terms and Conditions at any time. Changes will be
            effective upon posting of the updated terms. Continued participation in the SMS program following any changes
            constitutes your acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">10. Contact Information</h2>
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
            <span className="font-semibold text-gray-900">Terms &amp; Conditions</span>
            <a href={privacyUrl} className="hover:underline">Privacy Policy</a>
            <a href={tdlcUrl} className="hover:underline">10DLC Submission</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
