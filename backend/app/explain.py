def build_title(row, profile):
    priority = row["priority"]
    product = row["product_name"]
    org_name = profile.get("name", "your organisation")
    is_kev = any(f["signal"] == "in_kev" for f in row["why_it_matters"])

    # Find the dominant contributing signal so titles vary by *why* something
    # is urgent, not just repeat the same template for every card.
    weighted_factors = [f for f in row["why_it_matters"] if f.get("weight", 0) > 0]
    dominant = max(weighted_factors, key=lambda f: f["weight"], default=None)
    dominant_signal = dominant["signal"] if dominant else None

    if priority == "Urgent":
        if is_kev:
            return f"Active exploitation detected: {product} is being targeted right now"
        elif dominant_signal == "exposure":
            return f"Internet-exposed flaw in {product}, a critical system for {org_name}"
        elif dominant_signal == "importance":
            return f"High-risk flaw in {product}, one of {org_name}'s most critical systems"
        else:
            return f"Urgent: high-risk flaw in {product}, a critical system for {org_name}"
    elif priority == "High":
        if dominant_signal == "epss":
            return f"High-priority issue in {product} — likely to be targeted soon"
        return f"High-priority issue in {product}"
    elif priority == "Medium":
        return f"Worth reviewing: issue in {product}"
    else:
        return f"Low-priority item in {product}"


def build_impact(row):
    cvss_raw = row.get("cvss_base_score")
    if cvss_raw in (None, "", "nan"):
        return "Severity not available in source data — treat with caution"
    cvss = float(cvss_raw)
    if cvss >= 9:
        return "Could allow significant compromise of this system if left unaddressed"
    elif cvss >= 7:
        return "Could allow meaningful compromise of this system"
    else:
        return "Limited but non-zero risk to this system"


def build_next_step(row):
    is_kev = any(f["signal"] == "in_kev" for f in row["why_it_matters"])
    match_status = row.get("match_status", "INCLUDE")

    if match_status == "NEEDS VERIFICATION":
        return "Verify the installed version against the vendor advisory before deciding next steps"
    if is_kev:
        return "Patch immediately or restrict access — this is being actively exploited"
    elif row["priority"] in ("Urgent", "High"):
        return "Review vendor guidance and patch as soon as possible"
    else:
        return "Monitor and address during the next maintenance cycle"


def build_confidence(row):
    match_status = row.get("match_status", "INCLUDE")
    if match_status == "NEEDS VERIFICATION":
        return "Low", "Installed version could not be confirmed against the affected range — treat as unverified"
    return "High", "Exact product name and version match found in source data"


def build_plain_title(row, profile):
    """
    Consequence-first, jargon-free title for non-technical audiences.
    Built entirely from the same deterministic signals as build_title —
    no new facts, just different phrasing of what we already know.
    """
    is_kev = any(f["signal"] == "in_kev" for f in row["why_it_matters"])
    product = row["product_name"]
    importance = profile.get("importance", "normal")
    exposure = profile.get("exposure", "internal")

    if is_kev and importance == "critical":
        return f"Attackers are already exploiting a flaw in {product} — one of your most important systems"
    elif is_kev:
        return f"Attackers are already exploiting a flaw in {product}"
    elif exposure == "internet-facing" and importance == "critical":
        return f"A publicly reachable flaw was found in {product}, a critical system for your organisation"
    elif importance == "critical":
        return f"A flaw was found in {product}, one of your most important systems"
    elif exposure == "internet-facing":
        return f"A flaw was found in {product}, which can be reached from the internet"
    else:
        return f"A flaw was found in {product} that's worth reviewing"


def build_plain_impact(row):
    """Consequence-first impact description, no CVSS/technical jargon."""
    cvss_raw = row.get("cvss_base_score")
    if cvss_raw in (None, "", "nan"):
        return "We don't have enough information to describe the impact yet — check the vendor advisory."
    cvss = float(cvss_raw)
    is_kev = any(f["signal"] == "in_kev" for f in row["why_it_matters"])

    if is_kev:
        return "This could let an outside attacker break into this system right now, since it's a known method already in active use."
    if cvss >= 9:
        return "This could let an attacker take significant control of this system if it isn't fixed."
    elif cvss >= 7:
        return "This could give an attacker meaningful access to this system."
    else:
        return "The risk here is real but limited — worth fixing, not an emergency."