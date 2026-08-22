"""
Builds the structured, verified fact packet sent to Featherless for a single
vulnerability + organisation pair. Deliberately reuses the existing
deterministic matching/scoring/explain modules rather than recomputing
anything independently — this file never invents or re-derives facts.
"""

from .matching import load_vulnerabilities, get_profile_by_id, match_candidates
from .scoring import score_row, priority_label
from .explain import build_title, build_impact, build_next_step, build_confidence

# Simple in-memory cache. Keyed by (cve_id, org_id, product_name, score) for
# explanations so a re-score (e.g. after weight tuning) naturally invalidates
# old entries. Not persisted across restarts — deliberately not
# over-engineered per spec.
_explain_cache = {}
_ask_cache = {}


class VulnerabilityNotFound(Exception):
    def __init__(self, cve_id: str, product_name: str | None = None):
        self.cve_id = cve_id
        self.product_name = product_name
        msg = f"{cve_id} not found"
        if product_name:
            msg += f" for product {product_name}"
        super().__init__(msg)


class ProfileNotFound(Exception):
    pass


class AmbiguousVulnerability(Exception):
    """
    Raised when a CVE matches more than one product row for this org and
    the caller didn't supply product_name to disambiguate. We refuse to
    guess (e.g. via .iloc[0]) because that can silently return a different
    product/score than the one the user is actually looking at on screen.
    """
    def __init__(self, cve_id: str, product_names: list[str]):
        self.cve_id = cve_id
        self.product_names = product_names
        super().__init__(f"{cve_id} matches multiple products: {product_names}")


def get_verified_context(cve_id: str, org_id: str, product_name: str | None = None) -> dict:
    """
    Returns the verified, deterministic fact packet for one CVE against one
    organisation profile. Raises if the org doesn't exist, if the CVE
    doesn't exist / isn't in that org's matched (critical-product) set, or
    if the CVE matches multiple products and product_name wasn't given to
    disambiguate which row to explain.

    We intentionally do NOT let the AI layer discuss vulnerabilities the
    deterministic engine excluded, since that would blur "why it matters"
    with unranked/irrelevant data.
    """
    profile = get_profile_by_id(org_id)
    if not profile:
        raise ProfileNotFound(org_id)

    df = load_vulnerabilities()
    matched, _excluded = match_candidates(profile, df)

    row_matches = matched[matched["cve_id"] == cve_id]
    if row_matches.empty:
        raise VulnerabilityNotFound(cve_id, product_name=product_name)

    if len(row_matches) > 1:
        if product_name is None:
            raise AmbiguousVulnerability(
                cve_id, row_matches["product_name"].tolist()
            )
        row_matches = row_matches[row_matches["product_name"] == product_name]
        if row_matches.empty:
            raise VulnerabilityNotFound(cve_id, product_name=product_name)

    row = row_matches.iloc[0]
    score, factors = score_row(row, profile)
    priority = priority_label(score)

    row_dict = {
        "cve_id": row["cve_id"],
        "product_name": row["product_name"],
        "cvss_base_score": row["cvss_base_score"],
        "priority_score": score,
        "priority": priority,
        "why_it_matters": factors,
    }

    confidence, confidence_reason = build_confidence(row_dict)

    return {
        "cve_id": row["cve_id"],
        "cvss_score": float(row["cvss_base_score"]),
        "epss_score": float(row["first_epss"]),
        "in_kev": str(row["cisa_kev"]).strip().lower() == "true",
        "product": row["product_name"],
        "organisation": profile["name"],
        "sector": profile.get("sector"),
        "priority": priority,
        "priority_score": score,
        "score_factors": factors,
        "confidence": confidence,
        "confidence_reason": confidence_reason,
        "title": build_title(row_dict, profile),
        "deterministic_impact": build_impact(row_dict),
        "deterministic_next_step": build_next_step(row_dict),
        "source_url": f"https://nvd.nist.gov/vuln/detail/{row['cve_id']}",
    }


def deterministic_fallback_explanation(context: dict) -> dict:
    """Used whenever Featherless is unavailable, misconfigured, or errors."""
    return {
        "why_it_matters": (
            f"{context['product']} is on {context['organisation']}'s critical "
            f"products list. This vulnerability scored {context['priority_score']} "
            f"({context['priority']}) based on CVSS, EPSS, and KEV status."
        ),
        "potential_impact": context["deterministic_impact"],
        "ai_generated": False,
    }


def cache_get_explain(key):
    return _explain_cache.get(key)


def cache_set_explain(key, value):
    _explain_cache[key] = value


def cache_get_ask(key):
    return _ask_cache.get(key)


def cache_set_ask(key, value):
    _ask_cache[key] = value