import pandas as pd
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"


def load_vulnerabilities():
    df = pd.read_csv(DATA_DIR / "vulnerabilities.csv")
    df["product_name_norm"] = df["product_name"].str.strip().str.lower()
    return df


def load_profiles():
    with open(DATA_DIR / "profiles.json") as f:
        data = json.load(f)
    return data["organizations"]


def get_profile_by_id(org_id: str):
    profiles = load_profiles()
    for p in profiles:
        if p["org_id"] == org_id:
            return p
    return None


def _verify_version(row, installed_versions):
    """
    Compare installed version against the CVE's affected range.
    Returns one of: "INCLUDE", "EXCLUDE", "NEEDS VERIFICATION"
    Never silently drops a row — unclear cases are flagged, not excluded.
    """
    product = row["product_name_norm"]
    installed = installed_versions.get(product)

    start = row.get("version_start")
    end = row.get("version_end")
    note = row.get("version_note")

    # Missing install version, an explicit warning note, or a fully unbounded
    # range all mean we cannot safely compare -> flag for human review.
    if not installed or pd.notna(note) and str(note).strip():
        return "NEEDS VERIFICATION"
    if (pd.isna(start) or str(start).strip() == "") and (pd.isna(end) or str(end).strip() == ""):
        return "NEEDS VERIFICATION"

    try:
        if pd.notna(start) and str(start).strip() and installed < str(start).strip():
            return "EXCLUDE"
        if pd.notna(end) and str(end).strip() and installed > str(end).strip():
            return "EXCLUDE"
        return "INCLUDE"
    except TypeError:
        # Version strings weren't cleanly comparable (e.g. mixed formats)
        return "NEEDS VERIFICATION"


def match_candidates(profile: dict, df: pd.DataFrame):
    """
    Three honest outcomes per row, per the brief's flowchart:
      - not on critical_products list -> excluded (not this org's product)
      - on the list but version outside affected range -> excluded
      - on the list, version confirmed affected -> matched, INCLUDE
      - on the list, version unknown/unclear -> matched, NEEDS VERIFICATION
    """
    critical_products = {p.strip().lower() for p in profile.get("critical_products", [])}

    candidate_rows = df[df["product_name_norm"].isin(critical_products)].copy()
    excluded = df[~df["product_name_norm"].isin(critical_products)].copy()

    installed_versions = {
        t["product"].strip().lower(): str(t.get("version", "")).strip()
        for t in profile.get("technologies", [])
        if t.get("product")
    }

    if len(candidate_rows) > 0:
        candidate_rows["match_status"] = candidate_rows.apply(
            lambda row: _verify_version(row, installed_versions), axis=1
        )
        # Rows that fail version verification are excluded from ranking,
        # but moved into `excluded` with their reason preserved rather than dropped.
        version_excluded = candidate_rows[candidate_rows["match_status"] == "EXCLUDE"].copy()
        matched = candidate_rows[candidate_rows["match_status"] != "EXCLUDE"].copy()
        excluded = pd.concat([excluded, version_excluded], ignore_index=True)
    else:
        matched = candidate_rows

    return matched, excluded