import { notFound } from "next/navigation";
import { getAgencyBySlug } from "@/lib/kv";
import { generateSlug } from "@/lib/slug";
import { TenDLCForm } from "./TenDLCForm";

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
    <div className="min-h-screen bg-white" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Header */}
      <header style={{ background: "#1a3a6e" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agency.logo_url && (
              <img src={agency.logo_url} alt={agency.agency_name} className="h-14 w-14 object-contain rounded bg-white p-1 shrink-0" />
            )}
            <span className="text-white font-bold text-xl">{agency.agency_name}</span>
          </div>
          <a href="#subscribe" className="text-sm font-semibold text-white bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg transition-colors">
            Stay Informed
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: "#1a3a6e" }} className="pb-16 pt-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          {agency.logo_url && (
            <img src={agency.logo_url} alt={agency.agency_name} className="h-32 w-32 object-contain rounded-full bg-white p-2 mx-auto mb-6 shadow-xl" />
          )}
          <h1 className="text-3xl font-black text-white mb-3">{agency.agency_name}</h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto mb-8">
            Receive official updates and important announcements directly via SMS
          </p>
          <a
            href="#subscribe"
            className="inline-block font-bold text-sm px-7 py-3 rounded-lg transition-colors"
            style={{ background: "#e4aa35", color: "#fff" }}
          >
            Subscribe to SMS Updates
          </a>
        </div>
      </section>

      {/* About */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-gray-900 mb-4">{agency.agency_name}</h2>
          <p className="text-gray-600 leading-relaxed mb-10 max-w-3xl">
            {agency.agency_name} is committed to serving the {agency.city}, {agency.state} community with professionalism,
            integrity, and a dedication to public safety. Our department strives to build trust through transparency,
            open communication, and consistent delivery of high-quality law enforcement services.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Public Safety",
                body: "Our primary mission is to protect and serve every member of our community — responding to emergencies with speed, skill, and compassion.",
              },
              {
                title: "Integrity",
                body: "We hold ourselves to the highest standards of ethical conduct. Our officers are guided by honesty, accountability, and respect for the law.",
              },
              {
                title: "Fairness",
                body: "Every individual is treated with dignity and without discrimination. We enforce the law equally and impartially across all communities.",
              },
              {
                title: "Communication",
                body: "We believe an informed community is a safer community. We proactively share information and maintain open channels of dialogue with the public.",
              },
              {
                title: "Helpful Attitude",
                body: "Beyond enforcement, our officers are here to assist. We approach every interaction with a service mindset and a commitment to solving problems.",
              },
              {
                title: "Community Partnership",
                body: "We work alongside residents, schools, and organizations to address the root causes of crime and build long-term safety for everyone.",
              },
            ].map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-bold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="py-10 border-t border-b border-gray-100" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">Contact Information</h2>
          <div className="flex flex-wrap gap-8 text-sm text-gray-700">
            <div>
              <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Email</span>
              <a href={`mailto:${agency.email}`} className="text-blue-700 hover:underline">{agency.email}</a>
            </div>
            {agency.phone && (
              <div>
                <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Phone</span>
                <a href={`tel:${agency.phone}`} className="text-blue-700 hover:underline">{agency.phone}</a>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-500 block text-xs uppercase tracking-wide mb-0.5">Address</span>
              <span>{agency.address}, {agency.city}, {agency.state} {agency.zip}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe form */}
      <section id="subscribe" className="py-16 bg-white">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-2xl font-black text-gray-900 mb-2">Subscribe to SMS Updates</h2>
          <p className="text-gray-500 text-sm mb-8">
            Sign up to receive official communications from {agency.agency_name} via text message.
          </p>
          <TenDLCForm agencyName={agency.agency_name} termsUrl={termsUrl} privacyUrl={privacyUrl} />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#1a3a6e" }} className="py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {agency.logo_url && (
              <img src={agency.logo_url} alt={agency.agency_name} className="h-10 w-10 object-contain rounded bg-white p-1 shrink-0" />
            )}
            <span className="text-white font-bold">{agency.agency_name}</span>
          </div>
          <div className="flex gap-4 text-xs text-blue-300">
            <a href={termsUrl} className="hover:text-white transition-colors">Terms &amp; Conditions</a>
            <a href={privacyUrl} className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-blue-400">&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
