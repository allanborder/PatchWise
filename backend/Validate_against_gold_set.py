"""
Sanity-check script: compares PatchWise's own ranking against practitioner
rankings in gold_set.csv. Not part of the live app — run manually to tune
weights before the freeze. Prints Spearman rank correlation as a rough signal.

Usage:
    python validate_against_gold_set.py
"""
import pandas as pd
from pathlib import Path
from scipy.stats import spearmanr

from app.scoring import score_row

DATA_DIR = Path(__file__).parent / "data"

# Minimal illustrative profiles for the two practitioner rank columns.
# Adjust weight_modifiers to match whatever your real profiles.json uses.
BANK_PROFILE = {
    "org_id": "gold-bank",
    "name": "Gold Set Bank",
    "exposure": "internet-facing",
    "importance": "critical",
    "weight_modifiers": {
        "cvss_weight": 0.25,
        "cisa_kev_weight": 0.30,
        "first_epss_weight": 0.20,
        "exposure_weight": 0.15,
        "importance_critical_weight": 0.10,
        "importance_high_weight": 0.05,
    },
}

STARTUP_PROFILE = {
    "org_id": "gold-startup",
    "name": "Gold Set Startup",
    "exposure": "internet-facing",
    "importance": "high",
    "weight_modifiers": {
        "cvss_weight": 0.20,
        "cisa_kev_weight": 0.20,
        "first_epss_weight": 0.35,
        "exposure_weight": 0.15,
        "importance_critical_weight": 0.05,
        "importance_high_weight": 0.05,
    },
}


def run(profile, rank_col, gold):
    rows = gold.to_dict("records")
    scored = []
    for row in rows:
        score, _ = score_row(row, profile)
        scored.append({**row, "our_score": score})

    scored_df = pd.DataFrame(scored)
    scored_df["our_rank"] = scored_df["our_score"].rank(ascending=False, method="min")

    corr, _ = spearmanr(scored_df["our_rank"], scored_df[rank_col])

    print(f"\n--- {profile['name']} ---")
    print(scored_df[["cve_id", "product_name", "our_score", "our_rank", rank_col]]
          .sort_values("our_rank").to_string(index=False))
    print(f"Spearman correlation with practitioner ranking: {corr:.2f}")


if __name__ == "__main__":
    gold = pd.read_csv(DATA_DIR / "gold_set.csv")
    run(BANK_PROFILE, "practitioner_rank_bank", gold)
    run(STARTUP_PROFILE, "practitioner_rank_startup", gold)