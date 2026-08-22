from pydantic import BaseModel
from typing import List, Optional

class Technology(BaseModel):
    vendor: str
    product: str
    version: Optional[str] = None

class Profile(BaseModel):
    profile_id: str
    name: str
    sector: Optional[str] = None
    technologies: List[Technology]
    service: str
    exposure: str      # "internet-facing" or "internal"
    importance: str     # "critical", "high", "normal"

class Factor(BaseModel):
    signal: str
    detail: str
    weight: float

class MatchedContext(BaseModel):
    product: str
    service: str
    exposure: str
    importance: str

class Source(BaseModel):
    name: str
    published_date: Optional[str] = None
    snapshot_date: Optional[str] = None
    url: Optional[str] = None

class ResultItem(BaseModel):
    cve_id: str
    priority: str
    priority_score: float
    title: str
    matched_context: MatchedContext
    why_it_matters: List[Factor]
    potential_impact: str
    next_step: str
    confidence: str
    confidence_reason: str
    source: Source

class NegativeTest(BaseModel):
    cve_id: str
    cvss_score: float
    reason_excluded: str

class TopRankResponse(BaseModel):
    profile_id: str
    generated_at: str
    results: List[ResultItem]
    excluded_negative_test: Optional[NegativeTest] = None