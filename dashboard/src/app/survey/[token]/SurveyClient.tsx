"use client";

import { useState, useRef } from "react";
import type { SurveyResponses } from "@/types";

const QUESTIONS: { key: keyof Omit<SurveyResponses, "logo_url" | "submitted_at">; label: string; hint: string; rows: number }[] = [
  {
    key: "challenges",
    label: "What are your biggest recruitment challenges?",
    hint: "e.g. low applicant volume, difficulty finding qualified candidates, slow hiring process, retention…",
    rows: 4,
  },
  {
    key: "positions",
    label: "What positions are you currently recruiting for?",
    hint: "List each position — e.g. Patrol Officer, Jailer, Dispatcher, Sergeant…",
    rows: 3,
  },
  {
    key: "application_links",
    label: "For each position, how do candidates apply?",
    hint: "If you have job posting links, paste them here. Otherwise describe how applicants currently apply.",
    rows: 4,
  },
  {
    key: "hiring_process",
    label: "For each position, what are the key steps in your hiring process?",
    hint: "e.g. Application → Written Exam → Physical Agility → Oral Board → Background → Conditional Offer…",
    rows: 5,
  },
  {
    key: "tracking_goals",
    label: "What would you like to track or report on?",
    hint: "e.g. applications by position, time-to-hire, where candidates are in the process, source of applicants…",
    rows: 4,
  },
];

export function SurveyClient({
  token,
  agencyName,
  firstName,
  alreadyCompleted,
  existingResponses,
}: {
  token: string;
  agencyName: string;
  firstName: string;
  alreadyCompleted: boolean;
  existingResponses: SurveyResponses | null;
}) {
  const [fields, setFields] = useState<Record<string, string>>({
    challenges:        existingResponses?.challenges        ?? "",
    positions:         existingResponses?.positions         ?? "",
    application_links: existingResponses?.application_links ?? "",
    hiring_process:    existingResponses?.hiring_process    ?? "",
    tracking_goals:    existingResponses?.tracking_goals    ?? "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(existingResponses?.logo_url ?? null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyCompleted && !!existingResponses);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/svg+xml", "image/gif"].includes(file.type)) {
      setLogoError("Please upload a JPG, PNG, SVG, or GIF file.");
      return;
    }
    setLogoError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append("logo", logoFile);

    const res = await fetch(`/api/survey/${token}`, { method: "POST", body: fd });
    if (res.ok) {
      setDone(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Thank you, {firstName}!</h1>
        <p className="text-sm text-gray-500 mb-1">Your responses for <strong>{agencyName}</strong> have been received.</p>
        <p className="text-sm text-gray-400">Our team will review your answers and reach out to get your account built out.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-8 py-6">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold text-white/80 mb-3">
          Onboarding Profile
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Help us build your system, {firstName}.</h1>
        <p className="text-sm text-blue-200">
          Tell us about <strong className="text-white">{agencyName}</strong>'s recruiting so we can set everything up the right way.
        </p>
      </div>

      {/* Agency badge */}
      <div className="px-8 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-blue-700" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">{agencyName}</div>
          <div className="text-xs text-gray-400">5 questions · ~5 minutes</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
        {QUESTIONS.map((q, i) => (
          <div key={q.key}>
            <div className="flex items-start gap-3 mb-2">
              <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <label className="text-sm font-semibold text-gray-900 leading-snug">{q.label}</label>
            </div>
            <textarea
              value={fields[q.key]}
              onChange={(e) => setFields((f) => ({ ...f, [q.key]: e.target.value }))}
              placeholder={q.hint}
              rows={q.rows}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300 ml-9"
              style={{ marginLeft: "2.25rem", width: "calc(100% - 2.25rem)" }}
            />
          </div>
        ))}

        {/* Logo upload */}
        <div>
          <div className="flex items-start gap-3 mb-2">
            <span className="shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center mt-0.5">6</span>
            <label className="text-sm font-semibold text-gray-900">Upload your department logo</label>
          </div>
          <div className="ml-9">
            {logoPreview && (
              <div className="mb-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoPreview} alt="Logo preview" className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-gray-50" />
                <span className="text-xs text-gray-400">{logoFile ? "Ready to upload" : "Current logo"}</span>
              </div>
            )}
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl px-4 py-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <p className="text-sm text-gray-500">{logoPreview ? "Replace logo" : "Upload your logo"}</p>
              <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, or SVG · Click to browse</p>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/svg+xml,image/gif" className="hidden" onChange={handleLogoChange} />
            {logoError && <p className="text-xs text-red-500 mt-1.5">{logoError}</p>}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="pt-2 border-t border-gray-100">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? "Submitting…" : "Submit Profile →"}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Your answers are saved securely and shared only with your All-Star Recruiter team.</p>
        </div>
      </form>
    </div>
  );
}
