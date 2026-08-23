# PatchWise

**Personalised Vulnerability Triage** — turning public CVE data into five actions a small organisation can actually understand and act on.

Built for Nexora 2026.

**Team: Smart Move**
- Allan Paulraj V
- Yoshidha M
- PJ Tivin Elvis
- Dhanyasri V A
---

## The problem

Public vulnerability feeds (NVD, CISA KEV, FIRST EPSS) publish thousands of records written for everyone. A small organisation — a clinic, a college, a manufacturer — runs only a handful of those products and rarely has a dedicated security analyst. When every CVE looks urgent, nothing actually gets read.

PatchWise takes an organisation's profile (what it runs, how exposed it is, what matters to it) and a public vulnerability dataset, and produces a ranked, explainable top five — not a database, not a dashboard, five things worth doing something about.

## What it does

```
                    ┌─────────────┐
                    │     CVE     │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
         CVSS            EPSS         CISA KEV
            │              │              │
            └──────────────┼──────────────┘
                           ▼
                 ┌───────────────────┐
                 │   Match + Score   │
                 └─────────┬─────────┘
                           │
                           ▼
                 ┌───────────────────┐
                 │  Organisation     │
                 │  Profile          │
                 │  (exposure,       │
                 │   importance)     │
                 └─────────┬─────────┘
                           ▼
                    Priority Score
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Top 5 Ranked              Negative Test
        Vulnerabilities        (high-CVSS, excluded)
```

| Metric | What it tells us |
|---|---|
| CVSS | How severe the vulnerability is, in general |
| EPSS | How likely it is to be exploited in the next 30 days |
| CISA KEV | Whether it's already being exploited, right now |

CVSS alone answers "how bad could this be." Combining it with EPSS and KEV answers the question a small organisation actually needs answered: "is this worth doing something about today."

1. **Matches** an organisation's declared technologies against a CVE dataset, with honest three-way outcomes: include, exclude, or flag for verification when a version can't be safely compared.
2. **Ranks** matched candidates using five visible signals — CVSS, CISA KEV status, FIRST EPSS score, internet exposure, and service importance — combined into a single 0–100 priority score.
3. **Explains** every result in plain terms: why it matters, what could happen, what to do next, and how confident the system is in the match.
4. **Proves it isn't just severity sorting** with a mandatory negative test: a high-CVSS vulnerability that gets excluded or ranked low, with the specific reason named.

## Architecture

```
backend/
  app/
    matching.py     — loads data, matches profile to candidates, version verification
    scoring.py       — weighted signal scoring, ranking, negative test selection, audit logging
    explain.py        — deterministic title/impact/next-step/confidence text (technical + plain-language)
    ai_context.py     — builds verified, structured fact packets for the AI layer (read-only, no scoring)
    ai_client.py       — Featherless AI wrapper for natural-language explain/ask (optional layer)
    main.py            — FastAPI routes
  data/
    vulnerabilities.csv, profiles.json, gold_set.csv, audit_log.jsonl (generated)
  validate_against_gold_set.py — standalone weight sanity-check script (not part of live app)

frontend/
  src/components/     — ResultCard, SignalBreakdown, NegativeTestPanel, ProfileSelector,
                          PriorityBadge, GlossaryTerm, PlainLanguageToggle, PatchyChat
```

## Data sources

Per the challenge brief, PatchWise runs entirely on the provided frozen starter pack — no live API calls, no paid feeds:

- **NIST NVD** — CVE records and CVSS base scores
- **CISA KEV** — confirmed real-world exploitation status
- **FIRST EPSS** — 30-day exploitation probability estimates
- `vulnerabilities.csv` — the pre-joined snapshot of the above three sources
- `profiles.json` — fictional organisation profiles (technologies, exposure, importance)
- `gold_set.csv` — a small practitioner-ranked sample used only for validating scoring weights, not for live matching

## Matching logic

For every CVE-product row against an organisation's declared critical products:

| Outcome | Condition |
|---|---|
| **Excluded** | Product not on the organisation's critical products list |
| **Excluded (version)** | Product matches, but the installed version falls outside the CVE's affected range |
| **Included** | Product matches and version is confirmed within the affected range |
| **Included — Needs verification** | Product matches, but the installed version is missing, unparseable, or the range has a comparison warning — the item is never silently dropped |

Product names are normalised (lowercased, trimmed) with alias handling to catch casing mismatches (e.g. "Apache" vs "apache").

## Ranking logic

Each matched item receives a 0–100 priority score, built from five weighted, visible signals:

| Signal | Source | Contribution logic |
|---|---|---|
| CVSS | NVD | `(cvss / 10) × weight share` |
| CISA KEV | CISA | Full weight share if listed, else 0 |
| EPSS | FIRST | `epss_score × weight share` |
| Internet exposure | Profile | Full weight share if internet-facing, else 0 |
| Service importance | Profile | Full weight share for critical/high, scaled down for normal |

Weights are normalised per profile so the five contributions always sum to a maximum of 100. The breakdown (not just the final number) is shown on every result card, so a judge or IT admin can see exactly what drove the score — not just trust it.

Priority tiers: **Urgent** (≥70), **High** (≥50), **Medium** (≥25), **Low** (<25).

## The negative test

Every response includes one CVSS ≥ 9.0 vulnerability that was excluded or ranked low, with the specific reason stated — not used by this organisation, version out of range, or simply outranked by items with stronger KEV/EPSS/exposure signals. This is the direct evidence that PatchWise personalises rather than just sorts by severity.

## Explainability and provenance

- Every result shows: priority + visible contributing factors, plain-language title, matched context (product/service/exposure/importance), why it matters, potential impact, one safe next step, confidence level with reason, and a source link.
- A **plain-language mode** toggle rewrites titles and impact statements in jargon-free, consequence-first language for non-technical readers — the same underlying facts, different phrasing, generated deterministically (no invented content).
- Inline glossary tooltips explain CVE, CVSS, KEV, EPSS, exposure, and importance on tap/click.
- Every scoring decision is appended to `data/audit_log.jsonl` (CVE, organisation, signals, weights applied, final score, timestamp), so any claim shown in the UI can be traced back to the exact computation that produced it.

## Optional AI layer (Featherless)

PatchWise's core pipeline is fully deterministic and works with **zero AI dependency** — the brief's "no paid data, no paid software" requirement is met without it. On top of that, we added an optional natural-language layer:

- `/api/vulnerabilities/{cve_id}/explain` and `/ask` endpoints let a user get a conversational explanation or ask follow-up questions about a specific result.
- The AI is given a structured, pre-verified fact packet built entirely from the existing deterministic matching/scoring code — CVSS, EPSS, KEV status, product, organisation, priority, and score factors. It is explicitly instructed to use **only** those facts, never invent CVEs, versions, dates, or vendors, and never alter the priority or score it's given.
- `next_step`, `confidence`, and `source_url` are always overwritten with the deterministic values after the AI call, so even if a model tried to embellish, the safety-relevant fields can't drift from what the engine actually computed.
- If the API key isn't configured, or the request times out or errors, the system falls back to a deterministic, template-based explanation — the feature degrades gracefully and the demo never depends on network availability.
- The system prompt explicitly treats all data (facts, user questions) as data rather than instructions, guarding against prompt injection through the `/ask` endpoint.

## Weight validation

`validate_against_gold_set.py` is a standalone script (not part of the live app) that scores the five practitioner-ranked `gold_set.csv` entries using representative bank and startup profiles, and compares PatchWise's ranking against the practitioner's rank columns using Spearman correlation.

**Result: ρ = 0.90 for both profiles.**

This is based on only five rows, so it's a directional sanity check rather than a statistically robust validation — but it gave us real signal while tuning weights. One known divergence: for the startup profile, our engine ranks a high-EPSS, non-KEV item slightly differently than the practitioner did, suggesting our weighting leans slightly more on KEV/CVSS relative to EPSS than an expert would for a startup-type organisation. Documented here rather than silently left unexamined.

## Assumptions

- Organisation profiles are provided/fictional, per the brief — PatchWise does not scan, probe, or fingerprint real systems.
- Version comparison uses direct string/semantic comparison where possible; it does not attempt to parse every vendor-specific version format (explicitly out of scope per the brief).
- The negative test is selected at random among all qualifying CVSS ≥ 9.0 excluded items, so the specific example shown may vary between runs.
- `weight_modifiers` are defined per profile in `profiles.json` and are not hard-coded per sector — a new, unseen profile using the same schema is scored with no special-casing.

## Limitations

- Weight validation is based on a 5-row gold set — good for sanity-checking direction, not statistically conclusive.
- Version-range comparison handles clean numeric/exact formats; unusual vendor version schemes are correctly flagged as "needs verification" rather than guessed, but are not resolved automatically.
- The optional AI layer requires network access and a configured API key; the core deterministic pipeline does not.

## Running it

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010

# Frontend
cd frontend
npm install
npm run dev
```

Open the frontend URL, select an organisation profile, and the priority queue, signal breakdown, and negative test will load automatically.

## What we'd add with more time

- A visible "what changed" diff when switching between two profiles, beyond the exposure/importance shown in the profile selector.
- Automated version-range parsing for a wider set of vendor version formats.
- A printable one-page export of the priority queue for handing to non-technical stakeholders.
