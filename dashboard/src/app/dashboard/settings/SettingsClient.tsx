"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppSettings } from "@/lib/kv";

function ListEditor({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">{label}</h2>
      <p className="text-xs text-gray-500 mb-4">{description}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
      />
    </div>
  );
}

export function SettingsClient({ settings }: { settings: AppSettings }) {
  const router = useRouter();
  const [emails, setEmails] = useState(settings.notificationEmails.join("\n"));
  const [tenants, setTenants] = useState((settings.tenants ?? []).join("\n"));
  const [templates, setTemplates] = useState((settings.departmentTemplates ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);

    const notificationEmails = emails
      .split(/[\n,]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes("@"));

    const tenantList = tenants
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    const templateList = templates
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notificationEmails,
        tenants: tenantList,
        departmentTemplates: templateList,
      }),
    });

    setEmails(notificationEmails.join("\n"));
    setTenants(tenantList.join("\n"));
    setTemplates(templateList.join("\n"));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1.5 cursor-pointer"
          >
            ← Dashboard
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-semibold text-gray-900">Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <ListEditor
          label="Notification Recipients"
          description="Email addresses that receive a notification when a new agency signs up. One per line or comma-separated."
          value={emails}
          onChange={setEmails}
          placeholder="jason@allstartalent.us"
        />

        <ListEditor
          label="Tenants"
          description="Available tenants in the All-Star Recruiter system. One per line. These appear as options when assigning a tenant to a department."
          value={tenants}
          onChange={setTenants}
          placeholder="Tenant Name&#10;Another Tenant"
        />

        <ListEditor
          label="Department Templates"
          description="Available department templates for account creation. One per line. These appear as options when setting up a department via API."
          value={templates}
          onChange={setTemplates}
          placeholder="Default Template&#10;Law Enforcement Standard"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-blue-900 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Saving…" : "Save All Settings"}
          </button>
          {saved && <span className="text-sm text-green-600 font-medium">Saved ✓</span>}
        </div>

      </main>
    </div>
  );
}
