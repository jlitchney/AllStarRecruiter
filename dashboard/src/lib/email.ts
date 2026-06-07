import type { Agency } from "@/types";

export async function sendNewAgencyNotification(agency: Agency): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.NOTIFICATION_EMAIL ?? "jason@allstartalent.us";

  await resend.emails.send({
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
}
