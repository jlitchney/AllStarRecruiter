# AllStar Recruiter — Feature Mockups

Static HTML mockups for new features. Built to match the exact Bootstrap + site.css style of the production app so developers can use them as a direct implementation reference.

## How to use

1. Open `index.html` in a browser to see the mockup index
2. Each mockup is a self-contained file in `mockups/`
3. No build step, no dependencies to install

## Adding a new mockup

1. Copy `_template.html` into `mockups/your-feature-name.html`
2. Replace `PAGE TITLE` in the `<title>` and `<h1>` tags
3. Add your content inside `<main class="content p-4">`
4. Add an entry to the list in `index.html`

## Asset paths

From inside `mockups/`:
- CSS: `../assets/css/`
- JS: `../assets/js/`

From `index.html` (root level):
- CSS: `assets/css/`
- JS: `assets/js/`

## Design tokens (from site.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--leftnav-bg` | `#245194` | Sidebar, primary buttons |
| `--leftnav-bg-dark` | `#1e477f` | Hover / active states |
| `--accent` | `#e4aa35` | Gold accent bar, highlights |
| `--radius` | `.2rem` | Border radius |
| `--topbar-height` | `56px` | Top bar height |
| `--sidebar-width` | `280px` | Desktop sidebar width |
