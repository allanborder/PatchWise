# Patchwise

Turning public vulnerability data into five things worth doing.

## What it does

Patchwise takes a small organisation's profile (its critical products and risk
weighting) and a public vulnerability feed, and produces a ranked Top 5 list of
what deserves attention — with visible reasoning, a plain-language explanation,
and one safe next step. It also proves it isn't just sorting by severity by
showing a high-CVSS vulnerability it deliberately excludes or deprioritises.

## Data sources

- `vulnerabilities.csv` — 500+ CVE/product rows with CVSS base score,
  CISA KEV status, and FIRST EPSS score (provided starter pack).
- `profiles.json` — three fictional organisations, each with a list of
  critical products and a set of weight modifiers reflecting their risk
  appetite (e.g. a bank weights CVSS heavily; a startup weights EPSS heavily).

## How matching works

Each vulnerability row is matched against an organisation's `critical_products`
list using an exact, case-insensitive product name match. Rows matching a
critical product become candidates; everything else is excluded.

Note: the provided dataset does not include vendor or version fields, only a
product name. Because of this, matching is a direct product-name comparison
rather than version-range comparison — so every match is treated as an exact
match with High confidence, and there is no "NEEDS VERIFICATION" state in this
dataset. This is documented here as a known simplification driven by the data
provided, not an oversight.

## How ranking works

Each candidate CVE is scored using three visible signals, weighted per
organisation:

- **CVSS base score** — scaled 0–100, weighted by the org's `cvss_weight`
- **CISA KEV status** — a fixed bonus (org's `cisa_kev_weight` × 100) if the
  CVE is a confirmed actively-exploited vulnerability
- **FIRST EPSS score** — scaled 0–100, weighted by the org's `first_epss_weight`

The three weights are read directly from each organisation's profile, so the
same underlying CVE data produces different rankings for different
organisations. For example, a "High risk appetite" startup weights EPSS at
0.6, so a CVE with high exploitation probability but modest CVSS can outrank
a CVE with a higher CVSS but lower EPSS — while a "Zero-Tolerance"
infrastructure provider weights CVSS and KEV heavily instead.

Priority labels (Urgent / High / Medium / Low) are derived from score
thresholds (documented in `scoring.py`).

## Negative test

For each organisation, the system identifies the highest-CVSS vulnerability
that was excluded from their Top 5 because it doesn't touch a product on
their critical products list, and displays it with the reason for exclusion.
This demonstrates that severity alone does not drive prioritisation —
relevance to the organisation does.

## Explanation and provenance

Titles, potential impact, and next-step text are generated from simple
template rules based on the row's matched fields and score factors — not by
an LLM — so every word is traceable back to a real field in the source data.
No versions, vendor names, dates, or remediation steps are invented.

## Assumptions and limitations

- The dataset provided contains only `cve_id`, `product_name`,
  `cvss_base_score`, `cisa_kev`, and `first_epss` — no vendor, version, or
  reference URL fields. Source links are constructed by convention
  (`nvd.nist.gov/vuln/detail/{cve_id}`) rather than sourced directly from the
  CSV.
- Matching is exact product-name string matching; it will not catch alias
  variants (e.g. "WAF" vs "Web Application Firewall") unless they are added
  to an alias table.
- Confidence is always "High" in this dataset since there is no ambiguous
  version data to flag as uncertain.
- This tool is defensive and informational only; it never claims an
  organisation is "secure," only what matched in the supplied data.

## Running it locally

**Backend**
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```
cd frontend
npm install
npm run dev alllllllll
```

Open `http://localhost:5173` (or whichever port Vite reports). The frontend
expects the backend running on `http://localhost:8000`.
