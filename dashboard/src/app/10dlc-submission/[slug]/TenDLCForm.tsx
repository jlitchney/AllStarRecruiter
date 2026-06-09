"use client";

import { useState } from "react";

export function TenDLCForm({
  agencyName,
  termsUrl,
  privacyUrl,
}: {
  agencyName: string;
  termsUrl: string;
  privacyUrl: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank you!</h3>
        <p className="text-gray-500">Your submission has been received.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Jane"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Smith"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          placeholder="jane@example.com"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          required
          placeholder="(555) 555-0100"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-start gap-3 pt-2">
        <input
          type="checkbox"
          id="sms-consent"
          required
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-700 cursor-pointer"
        />
        <label htmlFor="sms-consent" className="text-sm text-gray-700 cursor-pointer leading-relaxed">
          By checking this box, I agree to receive SMS messages from <strong>{agencyName}</strong> regarding
          public safety updates, announcements, and recruitment-related communications.
        </label>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        Message and data rates may apply. Message frequency varies. Reply <strong>STOP</strong> to unsubscribe
        at any time. Reply <strong>HELP</strong> for help. By subscribing you agree to our{" "}
        <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Terms &amp; Conditions
        </a>{" "}
        and{" "}
        <a href={privacyUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
          Privacy Policy
        </a>.
      </p>

      <button
        type="submit"
        className="w-full py-3 rounded-lg text-sm font-bold text-white transition-colors"
        style={{ background: "#1a3a6e" }}
      >
        Subscribe to SMS Updates
      </button>
    </form>
  );
}
