"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Agency, AgencyStatus, BillingStatus } from "@/types";
import { STATUS_LABELS, STATUS_COLORS, BILLING_STATUS_LABELS, BILLING_STATUS_COLORS } from "@/types";
import { effectiveBillingStatus } from "@/lib/billing";
import { generateSlug } from "@/lib/slug";

const GUARDIAN_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending Setup",  cls: "bg-amber-100 text-amber-800" },
  active:           { label: "Active",          cls: "bg-green-100 text-green-800" },
  "not-a-customer": { label: "Not a Customer", cls: "bg-gray-100 text-gray-600" },
};

const ALL_STATUSES: AgencyStatus[] = ["need-to-setup", "need-to-onboard", "live"];
const ALL_BILLING_STATUSES: BillingStatus[] = ["need-to-invoice", "invoice-sent", "paid"];

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
  webhookUrl,
}: {
  agency: Agency;
  tenants: string[];
  departmentTemplates: string[];
  webhookUrl?: string;
}) {
  const router = useRouter();
  const [agency, setAgency] = useState(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [twilioSid, setTwilioSid] = useState(initial.twilio_account_sid ?? "");
  const [twilioToken, setTwilioToken] = useState(initial.twilio_auth_token ?? "");
  const [twilioSaving, setTwilioSaving] = useState(false);
  const [twilioSaved, setTwilioSaved] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [accountType, setAccountType] = useState<"free" | "pro">(initial.plan_selected === "pro" ? "pro" : "free");
  const [accountTypeSaving, setAccountTypeSaving] = useState(false);

  const [infoFields, setInfoFields] = useState({
    agency_name: initial.agency_name,
    agency_abbr: initial.agency_abbr,
    address: initial.address,
    city: initial.city,
    state: initial.state,
    zip: initial.zip,
    agency_size: initial.agency_size,
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  const [contactFields, setContactFields] = useState({
    first_name: initial.first_name,
    last_name: initial.last_name,
    title: initial.title ?? "",
    email: initial.email,
    phone: initial.phone,
  });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const [guardianFields, setGuardianFields] = useState({
    guardian_api_key: initial.guardian_api_key ?? "",
    guardian_link: initial.guardian_link ?? "",
    guardian_status: initial.guardian_status ?? "",
  });
  const [guardianSaving, setGuardianSaving] = useState(false);
  const [guardianSaved, setGuardianSaved] = useState(false);
  const [guardianEmailSending, setGuardianEmailSending] = useState(false);
  const [guardianEmailSent, setGuardianEmailSent] = useState(false);

  const [surveyEmailSending, setSurveyEmailSending] = useState(false);
  const [surveyEmailSent, setSurveyEmailSent] = useState(false);

  const defaultRenewal = (() => {
    const d = new Date(initial.created_at);
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | "">(initial.billing_status ?? "");
  const [renewalDate, setRenewalDate] = useState(initial.renewal_date ?? defaultRenewal);
  const [billingSaving, setBillingSaving] = useState(false);
  const [billingSaved, setBillingSaved] = useState(false);

  async function saveTwilio() {
    setTwilioSaving(true);
    setTwilioSaved(false);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ twilio_account_sid: twilioSid, twilio_auth_token: twilioToken }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgency(updated);
      setTwilioSaved(true);
      setTimeout(() => setTwilioSaved(false), 2000);
    }
    setTwilioSaving(false);
  }

  async function saveAccountType(type: "free" | "pro") {
    setAccountType(type);
    setAccountTypeSaving(true);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_selected: type }),
    });
    if (res.ok) setAgency(await res.json());
    setAccountTypeSaving(false);
  }

  async function saveInfo() {
    setInfoSaving(true);
    setInfoSaved(false);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(infoFields),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgency(updated);
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 2000);
    }
    setInfoSaving(false);
  }

  async function saveContact() {
    setContactSaving(true);
    setContactSaved(false);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactFields),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgency(updated);
      setContactSaved(true);
      setTimeout(() => setContactSaved(false), 2000);
    }
    setContactSaving(false);
  }

  async function saveGuardian() {
    setGuardianSaving(true);
    setGuardianSaved(false);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guardianFields),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgency(updated);
      setGuardianSaved(true);
      setTimeout(() => setGuardianSaved(false), 2000);
    }
    setGuardianSaving(false);
  }

  async function saveBilling() {
    setBillingSaving(true);
    setBillingSaved(false);
    const res = await fetch(`/api/agencies/${agency.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billing_status: billingStatus || undefined, renewal_date: renewalDate || undefined }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAgency(updated);
      setBillingSaved(true);
      setTimeout(() => setBillingSaved(false), 2000);
    }
    setBillingSaving(false);
  }

  async function sendSurveyEmail() {
    setSurveyEmailSending(true);
    setSurveyEmailSent(false);
    const res = await fetch(`/api/agencies/${agency.id}/survey-email`, { method: "POST" });
    if (res.ok) {
      const updated = await fetch(`/api/agencies/${agency.id}`).then((r) => r.json());
      setAgency(updated);
      setSurveyEmailSent(true);
      setTimeout(() => setSurveyEmailSent(false), 4000);
    }
    setSurveyEmailSending(false);
  }

  async function sendGuardianEmail() {
    setGuardianEmailSending(true);
    setGuardianEmailSent(false);
    const res = await fetch(`/api/agencies/${agency.id}/guardian-email`, { method: "POST" });
    if (res.ok) {
      const updated = await fetch(`/api/agencies/${agency.id}`).then((r) => r.json());
      setAgency(updated);
      setGuardianEmailSent(true);
      setTimeout(() => setGuardianEmailSent(false), 4000);
    }
    setGuardianEmailSending(false);
  }

  async function sendToApp() {
    setSending(true);
    setSendResult(null);
    const res = await fetch(`/api/agencies/${agency.id}/webhook`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setAgency((a) => ({ ...a, webhook_last_sent_at: new Date().toISOString(), webhook_last_status: "success" }));
      setSendResult({ ok: true, message: "Sent successfully." });
    } else {
      setAgency((a) => ({ ...a, webhook_last_sent_at: new Date().toISOString(), webhook_last_status: "error" }));
      setSendResult({ ok: false, message: data.error ?? "Send failed." });
    }
    setSending(false);
    setTimeout(() => setSendResult(null), 6000);
  }

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

        {/* Account Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Account Type</h2>
          <div className="flex gap-3">
            <button
              onClick={() => saveAccountType("free")}
              disabled={accountTypeSaving}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-2 disabled:opacity-50 ${
                accountType === "free"
                  ? "bg-blue-100 text-blue-800 border-transparent shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Free
            </button>
            <button
              onClick={() => saveAccountType("pro")}
              disabled={accountTypeSaving}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-2 disabled:opacity-50 ${
                accountType === "pro"
                  ? "bg-purple-100 text-purple-800 border-transparent shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              Pro
            </button>
          </div>
        </div>

        {/* Billing — Pro only */}
        {accountType === "pro" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Billing</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_BILLING_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setBillingStatus(s)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border-2 ${
                  billingStatus === s
                    ? `${BILLING_STATUS_COLORS[s]} border-transparent shadow-sm`
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {BILLING_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Renewal Date</label>
              <input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveBilling}
                disabled={billingSaving}
                className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {billingSaving ? "Saving…" : "Save"}
              </button>
              {billingSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
            </div>
          </div>
          {(() => {
            const eff = effectiveBillingStatus(agency);
            if (!eff || eff === "paid" || eff === billingStatus) return null;
            return (
              <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-semibold ${BILLING_STATUS_COLORS[eff]}`}>
                ⚠ {BILLING_STATUS_LABELS[eff]}
              </div>
            );
          })()}
        </div>
        )}

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Agency info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Agency</h2>
            {(["agency_name", "agency_abbr", "address", "city", "state", "zip"] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {field === "agency_name" ? "Name" : field === "agency_abbr" ? "Abbreviation" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type="text"
                  value={infoFields[field]}
                  onChange={(e) => setInfoFields((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Agency Size</label>
              <select
                value={infoFields.agency_size}
                onChange={(e) => setInfoFields((f) => ({ ...f, agency_size: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select agency size…</option>
                <option value="1-49">1 – 49 Sworn Officers</option>
                <option value="50-99">50 – 99 Sworn Officers</option>
                <option value="100-199">100 – 199 Sworn Officers</option>
                <option value="200-399">200 – 399 Sworn Officers</option>
                <option value="400+">400+ Sworn Officers</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveInfo}
                disabled={infoSaving}
                className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {infoSaving ? "Saving…" : "Save"}
              </button>
              {infoSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
            </div>
            <LogoUpload
              agencyId={agency.id}
              logoUrl={agency.logo_url}
              onUpdate={(url) => setAgency((a) => ({ ...a, logo_url: url }))}
            />
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h2>
            {(["first_name", "last_name", "title", "email", "phone"] as const).map((field) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  {field === "first_name" ? "First Name" : field === "last_name" ? "Last Name" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                  value={contactFields[field]}
                  onChange={(e) => setContactFields((f) => ({ ...f, [field]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveContact}
                disabled={contactSaving}
                className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {contactSaving ? "Saving…" : "Save"}
              </button>
              {contactSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
            </div>

            <div className="pt-2 border-t border-gray-100 space-y-3">
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Guardian Alliance</h2>
            {agency.guardian_status && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${GUARDIAN_STATUS_LABELS[agency.guardian_status]?.cls ?? "bg-gray-100 text-gray-600"}`}>
                {GUARDIAN_STATUS_LABELS[agency.guardian_status]?.label ?? agency.guardian_status}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</label>
              <select
                value={guardianFields.guardian_status}
                onChange={(e) => setGuardianFields((f) => ({ ...f, guardian_status: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">— Not set —</option>
                <option value="pending">Pending Setup</option>
                <option value="active">Active</option>
                <option value="not-a-customer">Not a Customer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">API Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={guardianFields.guardian_api_key}
                  onChange={(e) => setGuardianFields((f) => ({ ...f, guardian_api_key: e.target.value }))}
                  placeholder="Enter API key"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {guardianFields.guardian_api_key && (
                  <button onClick={() => navigator.clipboard.writeText(guardianFields.guardian_api_key)} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer">Copy</button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Login Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={guardianFields.guardian_link}
                  onChange={(e) => setGuardianFields((f) => ({ ...f, guardian_link: e.target.value }))}
                  placeholder="https://…"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {guardianFields.guardian_link && (
                  <button onClick={() => navigator.clipboard.writeText(guardianFields.guardian_link)} className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer">Copy</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={saveGuardian}
                disabled={guardianSaving}
                className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {guardianSaving ? "Saving…" : "Save"}
              </button>
              {guardianSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
            </div>
          </div>

          {agency.guardian_setup_completed_at && (
            <div className="text-xs text-gray-400 pt-1 border-t border-gray-100">
              Setup completed {new Date(agency.guardian_setup_completed_at).toLocaleString()}
            </div>
          )}

          {agency.guardian_setup_token && (!agency.guardian_setup_completed_at || agency.guardian_status === "pending") && (
            <div className="text-xs text-gray-400 pt-1 border-t border-gray-100 flex items-center justify-between">
              <span>Awaiting setup from Guardian Alliance</span>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/guardian/setup/${agency.guardian_setup_token}`)}
                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
              >Copy setup link</button>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
            <button
              onClick={sendGuardianEmail}
              disabled={guardianEmailSending}
              className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {guardianEmailSending ? "Sending…" : "Send Guardian Setup Email"}
            </button>
            {guardianEmailSent && <span className="text-sm text-green-600 font-medium">Sent ✓</span>}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Configuration</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <SearchableSelect
              label="Tenant"
              value={agency.tenant ?? ""}
              options={tenants}
              onChange={(v) => save({ tenant: v })}
              disabled={saving}
              emptyHint={<>Add tenants in <a href="/dashboard/settings" className="underline">Settings</a>.</>}
            />
            <SearchableSelect
              label="Department Template"
              value={agency.department_template ?? ""}
              options={departmentTemplates}
              onChange={(v) => save({ department_template: v })}
              disabled={saving}
              emptyHint={<>Add templates in <a href="/dashboard/settings" className="underline">Settings</a>.</>}
            />
            <SearchableSelect
              label="Time Zone"
              value={agency.timezone ?? ""}
              options={TIMEZONES}
              onChange={(v) => save({ timezone: v })}
              disabled={saving}
            />
          </div>
          {saved && <p className="text-xs text-green-600 font-medium mt-3">Saved ✓</p>}
        </div>

        {/* Twilio */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Twilio</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Account SID</label>
              <input
                type="text"
                value={twilioSid}
                onChange={(e) => setTwilioSid(e.target.value)}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Auth Token</label>
              <div className="flex items-center gap-2">
                <input
                  type={showToken ? "text" : "password"}
                  value={twilioToken}
                  onChange={(e) => setTwilioToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((s) => !s)}
                  className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-2 whitespace-nowrap cursor-pointer"
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveTwilio}
                disabled={twilioSaving}
                className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {twilioSaving ? "Saving…" : "Save"}
              </button>
              {twilioSaved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
            </div>
          </div>
        </div>

        {/* Department Pages */}
        {(() => {
          const slug = generateSlug(agency);
          const base = typeof window !== "undefined" ? window.location.origin : "https://app.lawenforcementrecruiter.com";
          const pages = [
            { label: "Terms & Conditions", path: `/terms-and-conditions/${slug}` },
            { label: "Privacy Policy",     path: `/privacy-policy/${slug}` },
            { label: "10DLC Submission",   path: `/10dlc-submission/${slug}` },
          ];
          return (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Department Pages</h2>
              <div className="space-y-3">
                {pages.map(({ label, path }) => {
                  const url = `${base}${path}`;
                  return (
                    <div key={path} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-500 mb-0.5">{label}</div>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline font-mono truncate block">{url}</a>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(url)}
                        className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer shrink-0"
                      >Copy</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Send to App */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">App Integration</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-1">
                Post all department data to All-Star Recruiter to create or update this account.
              </p>
              {webhookUrl && (
                <p className="text-xs text-gray-400 font-mono truncate">{webhookUrl}</p>
              )}
              {!webhookUrl && (
                <p className="text-xs text-amber-600">Webhook URL not configured — <a href="/dashboard/settings" className="underline">add it in Settings</a>.</p>
              )}
            </div>
            <button
              onClick={sendToApp}
              disabled={sending || !webhookUrl}
              className="shrink-0 px-5 py-2.5 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {sending ? "Sending…" : "Send to App"}
            </button>
          </div>

          {(agency.webhook_last_sent_at || sendResult) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
              {sendResult ? (
                <span className={`text-sm font-medium ${sendResult.ok ? "text-green-600" : "text-red-600"}`}>
                  {sendResult.ok ? "✓ " : "✕ "}{sendResult.message}
                </span>
              ) : agency.webhook_last_sent_at ? (
                <>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                    agency.webhook_last_status === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {agency.webhook_last_status === "success" ? "Success" : "Failed"}
                  </span>
                  <span className="text-xs text-gray-400">
                    Last sent {new Date(agency.webhook_last_sent_at).toLocaleString()}
                  </span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Onboarding Survey */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Onboarding Survey</h2>
            {agency.survey_completed_at ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Completed
              </span>
            ) : agency.survey_sent_at ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Sent — Awaiting Response
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                Not Sent
              </span>
            )}
          </div>

          {agency.survey_responses && (
            <div className="space-y-4 mb-5">
              {[
                { key: "challenges",        label: "Biggest Recruitment Challenges" },
                { key: "positions",         label: "Positions Currently Recruiting" },
                { key: "application_links", label: "How Candidates Apply / Job Links" },
                { key: "hiring_process",    label: "Hiring Process & Key Steps" },
                { key: "tracking_goals",    label: "Tracking & Reporting Goals" },
              ].map(({ key, label }) => {
                const val = agency.survey_responses?.[key as keyof typeof agency.survey_responses];
                if (!val) return null;
                return (
                  <div key={key}>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-lg px-3 py-2.5">{val as string}</p>
                  </div>
                );
              })}
              {agency.survey_responses.logo_url && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Submitted Logo</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={agency.survey_responses.logo_url} alt="Submitted logo" className="w-20 h-20 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                </div>
              )}
              {agency.survey_responses.submitted_at && (
                <div className="text-xs text-gray-400">
                  Submitted {new Date(agency.survey_responses.submitted_at).toLocaleString()}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={sendSurveyEmail}
              disabled={surveyEmailSending}
              className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {surveyEmailSending ? "Sending…" : agency.survey_sent_at ? "Resend Survey Email" : "Send Survey Email"}
            </button>
            {surveyEmailSent && <span className="text-sm text-green-600 font-medium">Sent ✓</span>}
            {agency.survey_token && (
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/survey/${agency.survey_token}`)}
                className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 whitespace-nowrap cursor-pointer"
              >
                Copy survey link
              </button>
            )}
            {agency.survey_sent_at && !agency.survey_completed_at && (
              <span className="text-xs text-gray-400">Sent {new Date(agency.survey_sent_at).toLocaleString()}</span>
            )}
          </div>
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
