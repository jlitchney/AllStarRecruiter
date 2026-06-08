"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Agency, AgencyStatus } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";

const GUARDIAN_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending Setup",       cls: "bg-amber-100 text-amber-800" },
  active:           { label: "Active",               cls: "bg-green-100 text-green-800" },
  "not-a-customer": { label: "Not a Customer",       cls: "bg-gray-100 text-gray-600" },
};

const ALL_STATUSES: AgencyStatus[] = ["need-to-setup", "setup-free", "setup-pro", "need-to-onboard"];

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

export function AgencyDetailClient({ agency: initial }: { agency: Agency }) {
  const router = useRouter();
  const [agency, setAgency] = useState(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete ${agency.agency_name}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/agencies/${agency.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  async function save(patch: Partial<Pick<Agency, "status" | "notes">>) {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgency(updated);
      if (patch.notes !== undefined) setNotes(updated.notes ?? "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 cursor-pointer"
          >
            ← Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">{agency.agency_name}</span>
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{agency.agency_abbr}</span>
          <div className="ml-auto">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Status card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Status</h2>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => save({ status: s })}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-2 ${
                  agency.status === s
                    ? `${STATUS_COLORS[s]} border-transparent shadow-sm`
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Agency info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Agency</h2>
            <Field label="Name" value={agency.agency_name} />
            <Field label="Abbreviation" value={agency.agency_abbr} />
            <Field label="Address" value={agency.address} />
            <Field label="City" value={agency.city} />
            <Field label="State" value={agency.state} />
            <Field label="Zip" value={agency.zip} />
            <Field label="Agency Size" value={agency.agency_size} />
            <Field label="Plan" value={agency.plan_selected ?? "free"} />
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h2>
            <Field label="Name" value={`${agency.first_name} ${agency.last_name}`} />
            <Field label="Title" value={agency.title} />
            <Field label="Email" value={agency.email} />
            <Field label="Phone" value={agency.phone} />

            <div className="pt-2 border-t border-gray-100 space-y-4">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Submission</h2>
              <Field label="Variant" value={agency.variant} />
              <Field label="Submitted" value={new Date(agency.created_at).toLocaleString()} />
              <Field label="Last Updated" value={new Date(agency.updated_at).toLocaleString()} />
              {(agency.utm_source || agency.utm_medium || agency.utm_campaign) && (
                <Field label="UTM" value={[agency.utm_source, agency.utm_medium, agency.utm_campaign].filter(Boolean).join(" / ")} />
              )}
              {agency.ref && <Field label="Ref / Referral" value={agency.ref} />}
            </div>
          </div>
        </div>

        {/* Guardian */}
        {agency.guardian_setup_token && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Guardian Alliance</h2>
              {agency.guardian_status && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${GUARDIAN_STATUS_LABELS[agency.guardian_status]?.cls ?? "bg-gray-100 text-gray-600"}`}>
                  {GUARDIAN_STATUS_LABELS[agency.guardian_status]?.label ?? agency.guardian_status}
                </span>
              )}
            </div>

            {agency.guardian_status === "not-a-customer" && (
              <p className="text-sm text-gray-500">This department is not yet a Guardian customer.</p>
            )}

            {agency.guardian_api_key && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">API Key</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded px-2 py-1 flex-1 break-all">{agency.guardian_api_key}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(agency.guardian_api_key!)}
                    className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer"
                  >Copy</button>
                </div>
              </div>
            )}

            {agency.guardian_link && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Login Link</div>
                <div className="flex items-center gap-2">
                  <a href={agency.guardian_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 break-all">{agency.guardian_link}</a>
                  <button
                    onClick={() => navigator.clipboard.writeText(agency.guardian_link!)}
                    className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer"
                  >Copy</button>
                </div>
              </div>
            )}

            {agency.guardian_setup_completed_at && (
              <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                Setup completed {new Date(agency.guardian_setup_completed_at).toLocaleString()}
              </div>
            )}

            {(!agency.guardian_setup_completed_at || agency.guardian_status === "pending") && (
              <div className="text-xs text-gray-400 pt-1 border-t border-gray-100 flex items-center justify-between">
                <span>Awaiting setup from Guardian Alliance</span>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/guardian/setup/${agency.guardian_setup_token}`)}
                  className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                >Copy setup link</button>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Internal Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this agency…"
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => save({ notes })}
              disabled={saving}
              className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving…" : "Save Notes"}
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
          </div>
        </div>

      </main>
    </div>
  );
}
