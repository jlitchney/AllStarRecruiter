"use client";

import { useState } from "react";

interface AgencyInfo {
  agency_name: string;
  agency_abbr: string;
  city: string;
  state: string;
  plan_selected?: string;
  guardian_api_key: string;
  guardian_link: string;
  guardian_status: string;
  guardian_setup_completed_at: string | null;
}

export function SetupClient({ token, agency }: { token: string; agency: AgencyInfo }) {
  const alreadyDone = !!agency.guardian_setup_completed_at;
  const isNotCustomer = agency.guardian_status === "not-a-customer";

  const [apiKey, setApiKey] = useState(agency.guardian_api_key);
  const [link, setLink] = useState(agency.guardian_link);
  const [notACustomer, setNotACustomer] = useState(isNotCustomer);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(alreadyDone && agency.guardian_status !== "not-a-customer" ? false : false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/guardian/setup/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardian_api_key: apiKey, guardian_link: link, not_a_customer: notACustomer }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      setDone(true);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {notACustomer ? "Marked as non-customer" : "Guardian credentials saved"}
        </h2>
        <p className="text-gray-500 text-sm">
          {notACustomer
            ? `${agency.agency_name} has been marked as not yet a Guardian customer.`
            : `API Key and Login Link saved for ${agency.agency_name}. You can close this window.`}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {alreadyDone && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          Credentials were previously saved on {new Date(agency.guardian_setup_completed_at!).toLocaleDateString()}. You can update them below.
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Guardian API Key
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={notACustomer}
          placeholder="Enter the Guardian API Key for this department"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Guardian Login Link
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          disabled={notACustomer}
          placeholder="https://..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <input
          type="checkbox"
          id="not-a-customer"
          checked={notACustomer}
          onChange={(e) => setNotACustomer(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 accent-blue-900 cursor-pointer"
        />
        <label htmlFor="not-a-customer" className="text-sm text-gray-600 cursor-pointer select-none">
          This department is <strong>not yet a Guardian customer</strong>
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-[#1a3a6e] text-white font-semibold text-sm rounded-lg hover:bg-[#245194] transition-colors disabled:opacity-50 cursor-pointer"
      >
        {saving ? "Saving…" : notACustomer ? "Mark as Non-Customer" : "Save Guardian Credentials"}
      </button>
    </form>
  );
}
