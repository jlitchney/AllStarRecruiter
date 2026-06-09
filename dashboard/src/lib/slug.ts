export function generateSlug(agency: { city: string; state: string; agency_abbr: string }): string {
  return [agency.city, agency.state, agency.agency_abbr]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
