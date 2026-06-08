import type { Agency } from "@/types";
import { getSettings } from "@/lib/kv";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.lawenforcementrecruiter.com";
const GUARDIAN_CONTACTS = ["kim@guardianalliancetechnologies.com", "steve@guardianalliancetechnologies.com"];

export async function sendNewAgencyNotification(agency: Agency): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const settings = await getSettings();
  const to = settings.notificationEmails.length > 0
    ? settings.notificationEmails
    : [process.env.NOTIFICATION_EMAIL ?? "jason@allstartalent.us"];

  const result = await resend.emails.send({
    from: "All-Star Recruiter <noreply@lawenforcementrecruiter.com>",
    to,
    subject: `New Agency Signup: ${agency.agency_name} (${agency.agency_abbr}) — ${agency.state}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 4px;color:#0f172a;">New Agency Signup</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;">Submitted via ${agency.variant}</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:40%;">Agency</td><td style="padding:8px 0;font-weight:600;">${agency.agency_name} (${agency.agency_abbr})</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Address</td><td style="padding:8px 4px;">${agency.address}, ${agency.city}, ${agency.state} ${agency.zip}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Contact</td><td style="padding:8px 0;">${agency.first_name} ${agency.last_name}${agency.title ? ` — ${agency.title}` : ""}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Email</td><td style="padding:8px 4px;"><a href="mailto:${agency.email}">${agency.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${agency.phone}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Agency Size</td><td style="padding:8px 4px;">${agency.agency_size}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Plan</td><td style="padding:8px 0;">${agency.plan_selected ?? "free"}</td></tr>
          ${agency.utm_source ? `<tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Source</td><td style="padding:8px 4px;">${agency.utm_source}${agency.utm_medium ? ` / ${agency.utm_medium}` : ""}${agency.utm_campaign ? ` / ${agency.utm_campaign}` : ""}</td></tr>` : ""}
        </table>

        <div style="margin-top:24px;">
          <a href="https://app.lawenforcementrecruiter.com/dashboard/${agency.id}" style="background:#1a3a6e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View in Dashboard →</a>
        </div>
      </div>
    `,
  });
  if (result.error) throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
}

export async function sendGuardianSetupCompleteNotification(agency: Agency): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const settings = await getSettings();
  const to = settings.notificationEmails.length > 0
    ? settings.notificationEmails
    : [process.env.NOTIFICATION_EMAIL ?? "jason@allstartalent.us"];

  const isNotCustomer = agency.guardian_status === "not-a-customer";

  const result = await resend.emails.send({
    from: "All-Star Recruiter <noreply@lawenforcementrecruiter.com>",
    to,
    subject: isNotCustomer
      ? `Guardian Setup: ${agency.agency_name} is NOT a Guardian customer`
      : `Guardian Setup Complete: ${agency.agency_name} (${agency.agency_abbr})`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 4px;color:#0f172a;">Guardian Setup ${isNotCustomer ? "Update" : "Complete"}</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
          ${isNotCustomer
            ? `Guardian Alliance has marked <strong>${agency.agency_name}</strong> as not yet a Guardian customer.`
            : `Guardian Alliance has entered credentials for <strong>${agency.agency_name}</strong>.`}
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr><td style="padding:8px 0;color:#64748b;width:40%;">Agency</td><td style="padding:8px 0;font-weight:600;">${agency.agency_name} (${agency.agency_abbr})</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Location</td><td style="padding:8px 4px;">${agency.city}, ${agency.state}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Status</td><td style="padding:8px 0;">${isNotCustomer ? "Not a Guardian customer" : "Active"}</td></tr>
          ${!isNotCustomer && agency.guardian_api_key ? `<tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">API Key</td><td style="padding:8px 4px;font-family:monospace;">${agency.guardian_api_key}</td></tr>` : ""}
          ${!isNotCustomer && agency.guardian_link ? `<tr><td style="padding:8px 0;color:#64748b;">Login Link</td><td style="padding:8px 0;"><a href="${agency.guardian_link}">${agency.guardian_link}</a></td></tr>` : ""}
        </table>

        <a href="${APP_URL}/dashboard/${agency.id}" style="background:#1a3a6e;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View in Dashboard →</a>
      </div>
    `,
  });
  if (result.error) throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
}

export async function sendGuardianSetupEmail(agency: Agency): Promise<void> {
  if (!process.env.RESEND_API_KEY || !agency.guardian_setup_token) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const setupUrl = `${APP_URL}/guardian/setup/${agency.guardian_setup_token}`;

  const result = await resend.emails.send({
    from: "All-Star Recruiter <noreply@lawenforcementrecruiter.com>",
    to: GUARDIAN_CONTACTS,
    subject: `Guardian Setup Needed: ${agency.agency_name} (${agency.agency_abbr}) — ${agency.state}`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 4px;color:#0f172a;">New Agency — Guardian Setup Required</h2>
        <p style="margin:0 0 24px;color:#64748b;font-size:14px;">
          A new agency has signed up via All-Star Recruiter and needs their Guardian API Key and Login Link configured.
        </p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
          <tr><td style="padding:8px 0;color:#64748b;width:40%;">Agency</td><td style="padding:8px 0;font-weight:600;">${agency.agency_name} (${agency.agency_abbr})</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Location</td><td style="padding:8px 4px;">${agency.city}, ${agency.state}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Contact</td><td style="padding:8px 0;">${agency.first_name} ${agency.last_name}${agency.title ? ` — ${agency.title}` : ""}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Email</td><td style="padding:8px 4px;"><a href="mailto:${agency.email}">${agency.email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Phone</td><td style="padding:8px 0;">${agency.phone}</td></tr>
          <tr style="background:#f8fafc;"><td style="padding:8px 4px;color:#64748b;">Agency Size</td><td style="padding:8px 4px;">${agency.agency_size}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Plan</td><td style="padding:8px 0;">${agency.plan_selected ?? "free"}</td></tr>
        </table>

        <p style="font-size:14px;color:#374151;margin-bottom:16px;">
          Please use the link below to enter the Guardian API Key and Login Link for this department, or indicate that they are not yet a Guardian customer.
        </p>

        <div style="margin-bottom:24px;">
          <a href="${setupUrl}" style="background:#1a3a6e;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;display:inline-block;">
            Set Up Guardian Credentials →
          </a>
        </div>

        <p style="font-size:12px;color:#94a3b8;">
          This link is unique to this agency and can be used to update credentials at any time.<br>
          ${setupUrl}
        </p>
      </div>
    `,
  });
  if (result.error) throw new Error(`Resend error: ${JSON.stringify(result.error)}`);
}
