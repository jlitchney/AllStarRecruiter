"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Agency, AgencyStatus } from "@/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/types";

const ALL_STATUSES: AgencyStatus[] = ["need-to-setup", "setup-free", "setup-pro", "need-to-onboard"];

const GUARDIAN_VARIANTS = ["guardian", "guardian-free"];

const GUARDIAN_BADGE: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending",         cls: "bg-amber-100 text-amber-700" },
  active:           { label: "Active",           cls: "bg-green-100 text-green-700" },
  "not-a-customer": { label: "Non-Customer",     cls: "bg-gray-100 text-gray-500" },
};

const CSV_COLUMNS: { key: keyof Agency; label: string }[] = [
  { key: "agency_name",   label: "Agency Name" },
  { key: "agency_abbr",   label: "Abbreviation" },
  { key: "address",       label: "Address" },
  { key: "city",          label: "City" },
  { key: "state",         label: "State" },
  { key: "zip",           label: "Zip" },
  { key: "first_name",    label: "First Name" },
  { key: "last_name",     label: "Last Name" },
  { key: "title",         label: "Title" },
  { key: "email",         label: "Email" },
  { key: "phone",         label: "Phone" },
  { key: "agency_size",   label: "Agency Size" },
  { key: "status",        label: "Status" },
  { key: "plan_selected", label: "Plan" },
  { key: "variant",       label: "Form Variant" },
  { key: "utm_source",    label: "UTM Source" },
  { key: "utm_medium",    label: "UTM Medium" },
  { key: "utm_campaign",  label: "UTM Campaign" },
  { key: "ref",           label: "Ref" },
  { key: "notes",         label: "Notes" },
  { key: "created_at",    label: "Submitted At" },
  { key: "updated_at",    label: "Updated At" },
  { key: "id",            label: "ID" },
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCSV(agencies: Agency[]) {
  const header = CSV_COLUMNS.map((c) => c.label).join(",");
  const rows = agencies.map((a) =>
    CSV_COLUMNS.map((c) => csvCell(a[c.key])).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `agencies-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: AgencyStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

export function DashboardClient({ agencies, user }: { agencies: Agency[]; user: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AgencyStatus | "all">("all");

  const filtered = useMemo(() => {
    return agencies
      .filter((a) => filterStatus === "all" || a.status === filterStatus)
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          a.agency_name.toLowerCase().includes(q) ||
          a.agency_abbr.toLowerCase().includes(q) ||
          a.state.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [agencies, search, filterStatus]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: agencies.length };
    for (const s of ALL_STATUSES) c[s] = agencies.filter((a) => a.status === s).length;
    return c;
  }, [agencies]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-black.svg" alt="All-Star Recruiter" className="h-7 w-auto" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:block">{user}</span>
            <button
              onClick={() => router.push("/dashboard/settings")}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors cursor-pointer"
            >
              Settings
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center col-span-2 sm:col-span-1">
            <div className="text-2xl font-black text-gray-900">{counts.all}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Agencies</div>
          </div>
          {ALL_STATUSES.map((s) => (
            <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-black text-gray-900">{counts[s]}</div>
              <div className="text-xs text-gray-500 mt-0.5">{STATUS_LABELS[s]}</div>
            </div>
          ))}
        </div>

        {/* Filter + search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <input
            type="text"
            placeholder="Search agency, abbreviation, city, state, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-2 flex-wrap items-start">
            <button
              onClick={() => downloadCSV(agencies)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors cursor-pointer whitespace-nowrap"
              title="Export all agencies to CSV"
            >
              ↓ Export CSV
            </button>
            {(["all", ...ALL_STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  filterStatus === s
                    ? "bg-blue-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {s === "all" ? "All" : STATUS_LABELS[s]}
                <span className="ml-1.5 opacity-60">{counts[s]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {agencies.length === 0 ? "No agencies yet. Signups will appear here." : "No agencies match your filters."}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agency</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Size</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Guardian</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((agency, i) => (
                    <tr
                      key={agency.id}
                      onClick={() => router.push(`/dashboard/${agency.id}`)}
                      className={`cursor-pointer hover:bg-blue-50 transition-colors ${i !== filtered.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{agency.agency_name}</div>
                        <div className="text-xs text-gray-400 font-mono">{agency.agency_abbr}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                        {agency.city}, {agency.state}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-gray-700">{agency.first_name} {agency.last_name}</div>
                        <div className="text-xs text-gray-400">{agency.email}</div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-600 text-xs">{agency.agency_size}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={agency.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {GUARDIAN_VARIANTS.includes(agency.variant) ? (
                          (() => {
                            const badge = GUARDIAN_BADGE[agency.guardian_status ?? "pending"];
                            return (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}>
                                {badge.label}
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-400">
                        {new Date(agency.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
