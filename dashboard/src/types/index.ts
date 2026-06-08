export type AgencyStatus =
  | "need-to-setup"
  | "setup-free"
  | "setup-pro"
  | "need-to-onboard";

export type GuardianStatus = "pending" | "active" | "not-a-customer";

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
}

export const STATUS_LABELS: Record<AgencyStatus, string> = {
  "need-to-setup": "Need to Setup",
  "setup-free": "Setup — Free",
  "setup-pro": "Setup — Pro",
  "need-to-onboard": "Need to Onboard",
};

export const STATUS_COLORS: Record<AgencyStatus, string> = {
  "need-to-setup": "bg-amber-100 text-amber-800",
  "setup-free": "bg-blue-100 text-blue-800",
  "setup-pro": "bg-purple-100 text-purple-800",
  "need-to-onboard": "bg-green-100 text-green-800",
};
