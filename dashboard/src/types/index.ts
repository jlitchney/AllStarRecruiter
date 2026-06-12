export interface SurveyResponses {
  challenges?: string;
  positions?: string;
  application_links?: string;
  hiring_process?: string;
  tracking_goals?: string;
  logo_url?: string;
  submitted_at?: string;
}

export type AgencyStatus =
  | "need-to-setup"
  | "need-to-onboard"
  | "live";

export type GuardianStatus = "pending" | "active" | "not-a-customer";

export type BillingStatus = "need-to-invoice" | "invoice-sent" | "paid" | "expires-60" | "expires-30" | "expired";

export interface Agency {
  id: string;
  created_at: string;
  updated_at: string;
  status: AgencyStatus;

  agency_name: string;
  agency_abbr: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  title?: string;

  agency_size: string;
  variant: string;
  plan_selected?: string;

  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ref?: string;

  notes?: string;

  guardian_setup_token?: string;
  guardian_api_key?: string;
  guardian_link?: string;
  guardian_status?: GuardianStatus;
  guardian_setup_completed_at?: string;

  tenant?: string;
  department_template?: string;
  timezone?: string;

  logo_url?: string;

  webhook_last_sent_at?: string;
  webhook_last_status?: "success" | "error";

  twilio_account_sid?: string;
  twilio_auth_token?: string;

  billing_status?: BillingStatus;
  renewal_date?: string;

  survey_token?: string;
  survey_sent_at?: string;
  survey_completed_at?: string;
  survey_responses?: SurveyResponses;
}

export const STATUS_LABELS: Record<AgencyStatus, string> = {
  "need-to-setup":    "Need to Setup",
  "need-to-onboard":  "Need to Onboard",
  "live":             "Live",
};

export const STATUS_COLORS: Record<AgencyStatus, string> = {
  "need-to-setup":    "bg-amber-100 text-amber-800",
  "need-to-onboard":  "bg-blue-100 text-blue-800",
  "live":             "bg-green-100 text-green-800",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  "need-to-invoice": "Need to Invoice",
  "invoice-sent":    "Invoice Sent",
  "paid":            "Paid",
  "expires-60":      "Expires — 60 Days",
  "expires-30":      "Expires — 30 Days",
  "expired":         "Expired",
};

export const BILLING_STATUS_COLORS: Record<BillingStatus, string> = {
  "need-to-invoice": "bg-red-100 text-red-800",
  "invoice-sent":    "bg-amber-100 text-amber-800",
  "paid":            "bg-green-100 text-green-800",
  "expires-60":      "bg-amber-100 text-amber-800",
  "expires-30":      "bg-orange-100 text-orange-800",
  "expired":         "bg-red-100 text-red-800",
};
