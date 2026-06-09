import type { Agency, BillingStatus } from "@/types";

export function effectiveBillingStatus(agency: Agency): BillingStatus | undefined {
  if (!agency.billing_status) return undefined;
  if (agency.billing_status === "paid" && agency.renewal_date) {
    const now = new Date();
    const renewal = new Date(agency.renewal_date + "T00:00:00");
    const daysUntil = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return "expired";
    if (daysUntil <= 30) return "expires-30";
    if (daysUntil <= 60) return "expires-60";
  }
  return agency.billing_status;
}
