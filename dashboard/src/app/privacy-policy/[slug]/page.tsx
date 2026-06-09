import { notFound } from "next/navigation";
import { getAgencyBySlug } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXTAUTH_URL?.replace(/\/$/, "") ?? "https://app.lawenforcementrecruiter.com";

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const agencySlug = generateSlug(agency);
  const termsUrl = `${APP_URL}/terms-and-conditions/${agencySlug}`;
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
          <h1 className="text-xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mt-0.5">Effective Date: {effectiveDate}</p>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8 text-gray-700 text-sm leading-relaxed">

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Introduction</h2>
          <p>
            {agency.agency_name} (&ldquo;the Agency,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard information when you interact with our
            recruiting platform, website, or SMS messaging program. Please read this policy carefully. By submitting an
            application or opting in to our SMS program, you agree to the practices described in this policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Information We Collect</h2>
          <p className="mb-3">We may collect the following types of personal information:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Personal identifiers:</strong> your name, email address, phone number, and mailing address</li>
            <li><strong>Application information:</strong> employment history, references, certifications, and other information you provide as part of an application</li>
            <li><strong>Device and usage data:</strong> IP address, browser type, and pages visited on our recruiting website</li>
            <li><strong>SMS communication data:</strong> your mobile phone number, opt-in status, and message history</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">How We Use Your Information</h2>
          <p className="mb-3">We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Review and process your employment application</li>
            <li>Communicate with you regarding your application status, open positions, and next steps in the hiring process</li>
            <li>Send SMS notifications related to hiring events, application updates, and recruitment activities (only with your consent)</li>
            <li>Schedule interviews, background checks, and other pre-employment activities</li>
            <li>Improve our recruiting processes and candidate experience</li>
            <li>Comply with applicable federal, state, and local laws and regulations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">SMS Communications</h2>
          <p>
            If you opt in to our SMS program, your phone number will be used solely to send you recruitment-related text messages.
            We will not use your number for any other purpose or share it with third parties for marketing. You may opt out at any
            time by replying <strong>STOP</strong> to any message. For complete terms governing our SMS program, please see our{" "}
            <a href={termsUrl} className="text-blue-700 underline">Terms and Conditions</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Sharing of Information</h2>
          <p className="mb-3">We do not sell your personal information. We may share your information with:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Agency personnel:</strong> authorized staff involved in the hiring and onboarding process</li>
            <li><strong>Service providers:</strong> third-party vendors that assist with recruiting operations, background checks, or technology services, subject to appropriate confidentiality agreements</li>
            <li><strong>Legal authorities:</strong> government agencies or law enforcement when required by law, court order, or legal process</li>
          </ul>
          <p className="mt-3">
            We require all third-party service providers to handle your information in accordance with applicable privacy laws
            and to use it only for the purposes for which it was shared.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Data Retention</h2>
          <p>
            We retain your personal information for the duration of the application and hiring process, and for a reasonable
            period thereafter in accordance with Agency record-keeping requirements and applicable law. If your application
            is unsuccessful, we may retain your information to consider you for future opportunities unless you request deletion.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Security</h2>
          <p>
            We implement reasonable administrative, technical, and physical safeguards to protect your personal information
            from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic
            storage is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Your Rights and Choices</h2>
          <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate or incomplete information</li>
            <li>Request deletion of your personal information</li>
            <li>Opt out of SMS communications at any time by replying STOP</li>
            <li>Withdraw consent for data processing (where applicable)</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us using the information below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Changes to This Policy</h2>
          <p>
            We reserve the right to update this Privacy Policy at any time. Changes will be posted on this page with an
            updated effective date. We encourage you to review this policy periodically. Continued use of our services
            or participation in our SMS program following any changes constitutes your acceptance of the revised policy.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 mb-2">Contact Us</h2>
          <p className="mb-3">For privacy-related inquiries, data requests, or to exercise your rights, please contact:</p>
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
            <span className="font-semibold text-gray-900">Privacy Policy</span>
            <a href={tdlcUrl} className="hover:underline">10DLC Submission</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
