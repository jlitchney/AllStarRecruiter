"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Agency, AgencyStatus } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";

const GUARDIAN_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending Setup",  cls: "bg-amber-100 text-amber-800" },
  active:           { label: "Active",          cls: "bg-green-100 text-green-800" },
  "not-a-customer": { label: "Not a Customer", cls: "bg-gray-100 text-gray-600" },
};

const ALL_STATUSES: AgencyStatus[] = ["need-to-setup", "setup-free", "setup-pro", "need-to-onboard"];

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Honolulu",
];

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}

function SearchableSelect({
  label,
  value,
  options,
  onChange,
  disabled,
  emptyHint,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  emptyHint?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  }

  function handleFocus() {
    setOpen(true);
  }

  const displayValue = open ? query : (value || "");

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div ref={containerRef} className="relative">
        <div
          className={`flex items-center border rounded-lg bg-white transition-all ${
            open ? "border-blue-500 ring-2 ring-blue-500/20" : "border-gray-200"
          } ${disabled ? "opacity-50" : ""}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            disabled={disabled}
            placeholder={value || "— Not assigned —"}
            className="flex-1 px-3 py-2 text-sm bg-transparent outline-none rounded-lg placeholder:text-gray-400"
          />
          {value && !disabled && (
            <button
              type="button"
              onClick={() => { select(""); setQuery(""); }}
              className="px-2 text-gray-300 hover:text-gray-500 cursor-pointer"
              tabIndex={-1}
            >✕</button>
          )}
          <button
            type="button"
            onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
            disabled={disabled}
            className="px-2 text-gray-400 cursor-pointer"
            tabIndex={-1}
          >▾</button>
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div
              className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
              onMouseDown={() => select("")}
            >
              — Not assigned —
            </div>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o}
                  onMouseDown={() => select(o)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                    o === value ? "bg-blue-50 font-semibold text-blue-900" : "text-gray-800"
                  }`}
                >
                  {o}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {options.length === 0 && emptyHint && (
        <p className="text-xs text-gray-400 mt-1">{emptyHint}</p>
      )}
    </div>
  );
}

function LogoUpload({ agencyId, logoUrl, onUpdate }: { agencyId: string; logoUrl?: string; onUpdate: (url: string | undefined) => void }) {
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG files are allowed.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/agencies/${agencyId}/logo`, { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      onUpdate(data.url);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed. Please try again.");
    }
    setUploading(false);
  }

  async function handleRemove() {
    if (!confirm("Remove this logo?")) return;
    setRemoving(true);
    const res = await fetch(`/api/agencies/${agencyId}/logo`, { method: "DELETE" });
    if (res.ok) {
      onUpdate(undefined);
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    }
    setRemoving(false);
  }

  const displaySrc = preview ?? logoUrl;

  return (
    <div className="pt-2 border-t border-gray-100">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Department Logo</div>

      {displaySrc && (
        <div className="mb-3 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt="Department logo"
            className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50"
          />
          <div className="flex flex-col gap-1.5">
            {preview && (
              <span className="text-xs text-amber-600 font-medium">Preview — not saved yet</span>
            )}
            {logoUrl && !preview && (
              <button
                onClick={handleRemove}
                disabled={removing}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded px-2 py-1 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {removing ? "Removing…" : "Remove"}
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className="border-2 border-dashed border-gray-200 rounded-lg px-4 py-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <p className="text-sm text-gray-500">
          {displaySrc ? "Replace logo" : "Upload logo"}
          <span className="text-gray-400"> — JPG or PNG, 1080×1080px recommended</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Click to browse</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      {preview && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="mt-2 w-full px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {uploading ? "Uploading…" : "Save Logo"}
        </button>
      )}
    </div>
  );
}

export function AgencyDetailClient({
  agency: initial,
  tenants,
  departmentTemplates,
}: {
  agency: Agency;
  tenants: string[];
  departmentTemplates: string[];
}) {
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

  async function save(patch: Partial<Pick<Agency, "status" | "notes" | "tenant" | "department_template" | "timezone">>) {
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
            <LogoUpload
              agencyId={agency.id}
              logoUrl={agency.logo_url}
              onUpdate={(url) => setAgency((a) => ({ ...a, logo_url: url }))}
            />
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
                  <button onClick={() => navigator.clipboard.writeText(agency.guardian_api_key!)} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer">Copy</button>
                </div>
              </div>
            )}

            {agency.guardian_link && (
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Login Link</div>
                <div className="flex items-center gap-2">
                  <a href={agency.guardian_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 break-all">{agency.guardian_link}</a>
                  <button onClick={() => navigator.clipboard.writeText(agency.guardian_link!)} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer">Copy</button>
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

        {/* Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Configuration</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <SearchableSelect
              label="Tenant"
              value={agency.tenant ?? ""}
              options={tenants}
              onChange={(v) => save({ tenant: v || undefined })}
              disabled={saving}
              emptyHint={<>Add tenants in <a href="/dashboard/settings" className="underline">Settings</a>.</>}
            />
            <SearchableSelect
              label="Department Template"
              value={agency.department_template ?? ""}
              options={departmentTemplates}
              onChange={(v) => save({ department_template: v || undefined })}
              disabled={saving}
              emptyHint={<>Add templates in <a href="/dashboard/settings" className="underline">Settings</a>.</>}
            />
            <SearchableSelect
              label="Time Zone"
              value={agency.timezone ?? ""}
              options={TIMEZONES}
              onChange={(v) => save({ timezone: v || undefined })}
              disabled={saving}
            />
          </div>
          {saved && <p className="text-xs text-green-600 font-medium mt-3">Saved ✓</p>}
        </div>

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
