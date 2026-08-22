from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime

from .matching import load_vulnerabilities, load_profiles, get_profile_by_id, match_candidates
from .scoring import rank_candidates, find_negative_test
from .explain import build_title, build_impact, build_next_step, build_confidence, build_plain_title, build_plain_impact

from .ai_context import (
    get_verified_context,
    deterministic_fallback_explanation,
    VulnerabilityNotFound,
    ProfileNotFound,
    AmbiguousVulnerability,
    cache_get_explain,
    cache_set_explain,
    cache_get_ask,
    cache_set_ask,
)
from .ai_client import generate_explanation, answer_question, FeatherlessUnavailable
from .config import featherless_configured

app = FastAPI(title="Patchwise API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Existing endpoints — /api/profiles now also returns weight_modifiers so the
# frontend can explain *why* a switched profile ranks differently (dominant
# signal comparison), not just that exposure/importance changed.
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "Patchwise API is running"}

@app.get("/api/profiles")
def get_profiles():
    profiles = load_profiles()
    return [
        {
            "org_id": p["org_id"],
            "name": p["name"],
            "sector": p["sector"],
            "exposure": p.get("exposure"),
            "importance": p.get("importance"),
            "weight_modifiers": p.get("weight_modifiers"),
        }
        for p in profiles
    ]

@app.get("/api/toprank")
def get_toprank(org_id: str = "ORG-001"):
    profile = get_profile_by_id(org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    df = load_vulnerabilities()
    matched, excluded = match_candidates(profile, df)
    ranked = rank_candidates(matched, profile, top_n=5)

    results = []
    for r in ranked:
        confidence, confidence_reason = build_confidence(r)
        results.append({
            "cve_id": r["cve_id"],
            "product_name": r["product_name"],  # lets frontend disambiguate explain/ask calls
            "priority": r["priority"],
            "priority_score": r["priority_score"],
            "title": build_title(r, profile),
            "plain_language_title": build_plain_title(r, profile),
            "matched_context": {
                "product": r["product_name"],
                "service": profile.get("sector", "n/a"),
                "exposure": profile.get("exposure", "n/a"),
                "importance": profile.get("importance", "n/a"),
                "match_status": r.get("match_status", "INCLUDE"),
            },
            "why_it_matters": r["why_it_matters"],
            "potential_impact": build_impact(r),
            "plain_language_impact": build_plain_impact(r),
            "next_step": build_next_step(r),
            "confidence": confidence,
            "confidence_reason": confidence_reason,
            "source": {
                "name": "NVD / CISA KEV / FIRST EPSS",
                "published_date": None,
                "snapshot_date": None,
                "url": f"https://nvd.nist.gov/vuln/detail/{r['cve_id']}"
            }
        })

    negative_test = find_negative_test(excluded, profile)

    return {
        "profile_id": org_id,
        "generated_at": datetime.utcnow().isoformat(),
        "results": results,
        "excluded_negative_test": negative_test
    }

# ---------------------------------------------------------------------------
# Featherless AI explanation + Q&A layer.
# This code path never computes or alters priority/score — it only narrates
# facts that get_verified_context() derives from the existing deterministic
# matching/scoring modules above. product_name is required whenever a CVE
# matches more than one product row for the org, so /explain and /ask are
# guaranteed to describe the same row the user saw ranked on screen.
# ---------------------------------------------------------------------------

class AskRequest(BaseModel):
    org_id: str
    question: str = Field(min_length=1, max_length=500)
    product_name: str | None = None


def _handle_context_errors(fn, *args, **kwargs):
    """Shared error mapping for explain/ask so the two endpoints stay in sync."""
    try:
        return fn(*args, **kwargs)
    except ProfileNotFound:
        raise HTTPException(status_code=404, detail="Profile not found")
    except AmbiguousVulnerability as e:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "ambiguous_cve",
                "cve_id": e.cve_id,
                "product_names": e.product_names,
                "message": "This CVE matches multiple products for this org. Pass product_name to disambiguate.",
            },
        )
    except VulnerabilityNotFound:
        raise HTTPException(
            status_code=404,
            detail="CVE not found, or not matched to this organisation's critical products",
        )


@app.get("/api/vulnerabilities/{cve_id}/explain")
def explain_vulnerability(cve_id: str, org_id: str = "ORG-001", product_name: str | None = None):
    context = _handle_context_errors(get_verified_context, cve_id, org_id, product_name)

    cache_key = (cve_id, org_id, context["product"], context["priority_score"])
    cached = cache_get_explain(cache_key)
    if cached:
        return cached

    if not featherless_configured():
        result = deterministic_fallback_explanation(context)
    else:
        try:
            result = generate_explanation(context)
        except FeatherlessUnavailable:
            result = deterministic_fallback_explanation(context)

    result["next_step"] = context["deterministic_next_step"]  # always deterministic
    result["confidence"] = context["confidence"]
    result["confidence_reason"] = context["confidence_reason"]
    result["source_url"] = context["source_url"]
    result["priority"] = context["priority"]
    result["priority_score"] = context["priority_score"]
    result["product"] = context["product"]

    cache_set_explain(cache_key, result)
    return result


@app.post("/api/vulnerabilities/{cve_id}/ask")
def ask_about_vulnerability(cve_id: str, body: AskRequest):
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    context = _handle_context_errors(get_verified_context, cve_id, body.org_id, body.product_name)

    cache_key = (cve_id, body.org_id, context["product"], context["priority_score"], question)
    cached = cache_get_ask(cache_key)
    if cached:
        return {"answer": cached, "ai_generated": True}

    if not featherless_configured():
        return {
            "answer": "AI explanation is temporarily unavailable. Please use the evidence and source information shown on this vulnerability.",
            "ai_generated": False,
        }

    try:
        answer = answer_question(context, question)
    except FeatherlessUnavailable:
        return {
            "answer": "AI explanation is temporarily unavailable. Please use the evidence and source information shown on this vulnerability.",
            "ai_generated": False,
        }

    cache_set_ask(cache_key, answer)
    return {"answer": answer, "ai_generated": True}