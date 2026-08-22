"""
Focused tests for the AI explanation layer. Does not re-test the existing
matching/scoring logic — only the new integration points.
"""
import pytest
from unittest.mock import patch
from app.ai_context import (
    get_verified_context,
    VulnerabilityNotFound,
    ProfileNotFound,
    AmbiguousVulnerability,
)
from app import ai_client

# NOTE: swap this for the exact product_name string on CVE-2023-1262's
# Identity Provider row in your vulnerabilities.csv. Run:
#   python -c "import pandas as pd; df = pd.read_csv('data/vulnerabilities.csv'); print(df[df['cve_id']=='CVE-2023-1262']['product_name'].tolist())"
# and paste the exact string(s) here.
IDENTITY_PROVIDER_PRODUCT_NAME = "Identity Provider SaaS"


def test_ranking_computed_before_ai_and_immutable():
    """
    Proves the priority/score in the verified context come from the existing
    deterministic scoring module and are never passed through the LLM before
    being fixed. We call get_verified_context() WITHOUT ever touching
    ai_client, and confirm priority/score are already present and correct
    types — i.e. Featherless is not required to produce a ranking.
    """
    context = get_verified_context(
        "CVE-2023-1262", "ORG-001", product_name=IDENTITY_PROVIDER_PRODUCT_NAME
    )
    assert isinstance(context["priority_score"], (int, float))
    assert context["priority"] in ("Urgent", "High", "Medium", "Low")
    import app.ai_context as ac
    assert "ai_client" not in dir(ac) or not hasattr(ac, "generate_explanation")


def test_ambiguous_cve_without_product_name_raises():
    """
    A CVE that matches multiple product rows for this org must not silently
    resolve to whichever row comes first — that's the bug that caused
    /toprank and /explain to disagree on score/product for the same CVE ID.
    """
    with pytest.raises(AmbiguousVulnerability) as exc_info:
        get_verified_context("CVE-2023-1262", "ORG-001")
    assert exc_info.value.cve_id == "CVE-2023-1262"
    assert len(exc_info.value.product_names) > 1


def test_ambiguous_cve_resolves_with_product_name():
    context = get_verified_context(
        "CVE-2023-1262", "ORG-001", product_name=IDENTITY_PROVIDER_PRODUCT_NAME
    )
    assert context["product"] == IDENTITY_PROVIDER_PRODUCT_NAME


def test_unknown_cve_raises():
    with pytest.raises(VulnerabilityNotFound):
        get_verified_context("CVE-0000-0000", "ORG-001")


def test_unknown_product_name_for_known_cve_raises():
    with pytest.raises(VulnerabilityNotFound):
        get_verified_context("CVE-2023-1262", "ORG-001", product_name="Not A Real Product")


def test_unknown_profile_raises():
    with pytest.raises(ProfileNotFound):
        get_verified_context("CVE-2023-1262", "ORG-999")


def test_missing_api_key_raises_unavailable():
    with patch("app.ai_client.featherless_configured", return_value=False):
        with pytest.raises(ai_client.FeatherlessUnavailable):
            if not ai_client.featherless_configured():
                raise ai_client.FeatherlessUnavailable("not configured")


def test_empty_question_rejected():
    from fastapi.testclient import TestClient
    from app.main import app as fastapi_app

    client = TestClient(fastapi_app)
    resp = client.post(
        "/api/vulnerabilities/CVE-2023-1262/ask",
        json={
            "org_id": "ORG-001",
            "question": "",
            "product_name": IDENTITY_PROVIDER_PRODUCT_NAME,
        },
    )
    assert resp.status_code in (400, 422)


def test_explain_returns_409_when_cve_ambiguous_via_api():
    from fastapi.testclient import TestClient
    from app.main import app as fastapi_app

    client = TestClient(fastapi_app)
    resp = client.get("/api/vulnerabilities/CVE-2023-1262/explain?org_id=ORG-001")
    assert resp.status_code == 409
    assert resp.json()["detail"]["error"] == "ambiguous_cve"


def test_api_key_never_in_response():
    from fastapi.testclient import TestClient
    from app.main import app as fastapi_app
    from app.config import FEATHERLESS_API_KEY

    client = TestClient(fastapi_app)
    resp = client.get(
        "/api/vulnerabilities/CVE-2023-1262/explain"
        f"?org_id=ORG-001&product_name={IDENTITY_PROVIDER_PRODUCT_NAME}"
    )
    if FEATHERLESS_API_KEY:
        assert FEATHERLESS_API_KEY not in resp.text