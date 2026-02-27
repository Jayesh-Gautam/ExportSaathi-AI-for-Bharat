"""Report generation service for ExportSaathi."""

import json
import uuid
import logging
import traceback
from datetime import datetime
from typing import Any

from models.schemas import (
    QueryInput,
    ExportReadinessReport,
    HSCodePrediction,
    HSCodeAlternative,
    Certification,
    CostRange,
    RestrictedSubstance,
    PastRejection,
    RoadmapStep,
    Risk,
    Timeline,
    TimelinePhase,
    CostBreakdown,
    Subsidy,
    ActionPlan,
    DayPlan,
    Task,
    Source,
)
from services.llm_client import llm_client

logger = logging.getLogger(__name__)

# In-memory report store
_report_store: dict[str, ExportReadinessReport] = {}

SYSTEM_PROMPT = """You are ExportSaathi, an AI-powered Export Compliance & Certification Co-Pilot for Indian MSMEs. 
You act as a DGFT consultant, customs broker, GST refund expert, certification navigator, logistics risk analyst, and finance advisor.

Your guidelines:
- Use Indian export regulations and frameworks only
- Never give illegal avoidance advice
- Highlight safety and quality requirements first
- Provide actionable, specific guidance tailored to product and destination
- Reference relevant regulations (DGFT, BIS, FDA, CE, REACH, RoHS, etc.)
- Consider the specific business type (Manufacturing/SaaS/Merchant) for recommendations
"""

REPORT_PROMPT_TEMPLATE = """Analyze the following export query and generate a comprehensive Export Readiness Report.

**Product Details:**
- Product Name: {product_name}
- Ingredients/BOM: {ingredients}
- Destination Country: {destination_country}
- Business Type: {business_type}
- Company Size: {company_size}
- Monthly Volume: {monthly_volume}
- Price Range: {price_range}

Generate a detailed JSON response with EXACTLY this structure:

{{
  "hs_code": {{
    "code": "8539.50",
    "confidence": 85.0,
    "description": "LED lamps and lighting fittings",
    "alternatives": [{{"code": "9405.40", "confidence": 60.0, "description": "Other electric lamps"}}]
  }},
  "certifications": [
    {{
      "id": "cert_1",
      "name": "BIS Certification",
      "type": "other",
      "mandatory": true,
      "estimated_cost": {{"min": 50000, "max": 150000, "currency": "INR"}},
      "estimated_timeline_days": 45,
      "priority": "high"
    }}
  ],
  "restricted_substances": [{{"name": "Lead", "reason": "RoHS limits", "regulation": "EU RoHS"}}],
  "past_rejections": [{{"product_type": "LED", "reason": "Failed testing", "source": "other", "date": "2024-06"}}],
  "compliance_roadmap": [{{"step": 1, "title": "Step title", "description": "Details", "duration_days": 5, "dependencies": []}}],
  "risks": [{{"title": "Risk title", "description": "Details", "severity": "high", "mitigation": "How to fix"}}],
  "risk_score": 42,
  "timeline": {{
    "estimated_days": 60,
    "breakdown": [{{"phase": "Phase name", "duration_days": 10}}]
  }},
  "costs": {{"certifications": 250000, "documentation": 15000, "logistics": 80000, "total": 345000, "currency": "INR"}},
  "subsidies": [{{"name": "ZED Subsidy", "type": "Government", "amount": 40000, "eligibility": "MSMEs", "how_to_apply": "Apply at zed.msme.gov.in"}}],
  "action_plan": {{
    "days": [
      {{"day": 1, "title": "Day 1 Title", "tasks": [
        {{"id": "t1_1", "title": "Task", "description": "Details", "category": "certification", "completed": false, "estimated_duration": "2 hours"}}
      ]}}
    ],
    "progress_percentage": 0
  }},
  "retrieved_sources": [{{"title": "Source title", "source": "Org name", "relevance_score": 0.9}}]
}}

CRITICAL RULES for enum values:
- "type" in certifications: use ONLY "FDA", "CE", "REACH", "BIS", "ZED", "SOFTEX", or "other"
- "source" in past_rejections: use ONLY "FDA", "EU_RASFF", or "other"
- "severity": use ONLY "high", "medium", or "low"
- "priority": use ONLY "high", "medium", or "low"  
- "category" in tasks: use ONLY "certification", "documentation", "logistics", or "finance"
- All numbers must be plain numbers, not strings
- Return ONLY valid JSON, no markdown or extra text"""


# ── Safe Parsers ────────────────────────────────────────────────────────

VALID_CERT_TYPES = {"FDA", "CE", "REACH", "BIS", "ZED", "SOFTEX", "other"}
VALID_SOURCES = {"FDA", "EU_RASFF", "other"}
VALID_SEVERITIES = {"high", "medium", "low"}
VALID_PRIORITIES = {"high", "medium", "low"}
VALID_CATEGORIES = {"certification", "documentation", "logistics", "finance"}


def _sf(val: Any, default: float = 0.0) -> float:
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def _si(val: Any, default: int = 0) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def _safe_cert(d: dict) -> Certification | None:
    try:
        t = str(d.get("type", "other"))
        if t not in VALID_CERT_TYPES:
            t = "other"
        p = str(d.get("priority", "medium")).lower()
        if p not in VALID_PRIORITIES:
            p = "medium"
        cost = d.get("estimated_cost", {})
        if not isinstance(cost, dict):
            cost = {"min": 0, "max": 0, "currency": "INR"}
        return Certification(
            id=str(d.get("id", f"cert_{uuid.uuid4().hex[:6]}")),
            name=str(d.get("name", "Unknown")),
            type=t, mandatory=bool(d.get("mandatory", False)),
            estimated_cost=CostRange(min=_sf(cost.get("min")), max=_sf(cost.get("max")), currency=str(cost.get("currency", "INR"))),
            estimated_timeline_days=_si(d.get("estimated_timeline_days", 30)),
            priority=p,
        )
    except Exception as e:
        logger.warning(f"Skipping cert: {e}")
        return None


def _safe_risk(d: dict) -> Risk | None:
    try:
        s = str(d.get("severity", "medium")).lower()
        if s not in VALID_SEVERITIES:
            s = "medium"
        return Risk(title=str(d.get("title", "")), description=str(d.get("description", "")), severity=s, mitigation=str(d.get("mitigation", "")))
    except Exception as e:
        logger.warning(f"Skipping risk: {e}")
        return None


def _safe_task(d: dict) -> Task | None:
    try:
        c = str(d.get("category", "documentation")).lower()
        if c not in VALID_CATEGORIES:
            c = "documentation"
        return Task(
            id=str(d.get("id", f"t_{uuid.uuid4().hex[:6]}")),
            title=str(d.get("title", "Task")), description=str(d.get("description", "")),
            category=c, completed=bool(d.get("completed", False)),
            estimated_duration=d.get("estimated_duration"),
        )
    except Exception as e:
        logger.warning(f"Skipping task: {e}")
        return None


def _build_report(report_id: str, data: dict) -> ExportReadinessReport:
    """Build report with resilient parsing of LLM output."""

    # HS Code
    hs = data.get("hs_code") or {}
    if not isinstance(hs, dict):
        hs = {}
    hs_code = HSCodePrediction(
        code=str(hs.get("code", "0000.00")),
        confidence=min(100, max(0, _sf(hs.get("confidence", 0)))),
        description=str(hs.get("description", "Unknown")),
        alternatives=[
            HSCodeAlternative(code=str(a.get("code", "")), confidence=min(100, max(0, _sf(a.get("confidence", 0)))), description=str(a.get("description", "")))
            for a in hs.get("alternatives", []) if isinstance(a, dict)
        ],
    )

    # Certifications
    certs = [c for c in (_safe_cert(x) for x in data.get("certifications", []) if isinstance(x, dict)) if c]

    # Restricted substances
    substances = []
    for s in data.get("restricted_substances", []):
        if isinstance(s, dict):
            try:
                substances.append(RestrictedSubstance(name=str(s.get("name", "")), reason=str(s.get("reason", "")), regulation=str(s.get("regulation", ""))))
            except Exception:
                pass

    # Rejections
    rejections = []
    for r in data.get("past_rejections", []):
        if isinstance(r, dict):
            try:
                src = str(r.get("source", "other"))
                if src not in VALID_SOURCES:
                    src = "other"
                rejections.append(PastRejection(product_type=str(r.get("product_type", "")), reason=str(r.get("reason", "")), source=src, date=str(r.get("date", "Unknown"))))
            except Exception:
                pass

    # Roadmap
    roadmap = []
    for s in data.get("compliance_roadmap", []):
        if isinstance(s, dict):
            try:
                deps = s.get("dependencies", [])
                if not isinstance(deps, list):
                    deps = []
                roadmap.append(RoadmapStep(step=_si(s.get("step")), title=str(s.get("title", "")), description=str(s.get("description", "")), duration_days=_si(s.get("duration_days")), dependencies=[str(d) for d in deps]))
            except Exception:
                pass

    # Risks
    risks = [r for r in (_safe_risk(x) for x in data.get("risks", []) if isinstance(x, dict)) if r]

    # Timeline
    tl = data.get("timeline") or {}
    if not isinstance(tl, dict):
        tl = {}
    timeline = Timeline(
        estimated_days=_si(tl.get("estimated_days", 30)),
        breakdown=[TimelinePhase(phase=str(p.get("phase", "")), duration_days=_si(p.get("duration_days"))) for p in tl.get("breakdown", []) if isinstance(p, dict)],
    )

    # Costs
    cr = data.get("costs") or {}
    if not isinstance(cr, dict):
        cr = {}
    costs = CostBreakdown(certifications=_sf(cr.get("certifications")), documentation=_sf(cr.get("documentation")), logistics=_sf(cr.get("logistics")), total=_sf(cr.get("total")), currency=str(cr.get("currency", "INR")))

    # Subsidies
    subsidies = []
    for s in data.get("subsidies", []):
        if isinstance(s, dict):
            try:
                subsidies.append(Subsidy(name=str(s.get("name", "")), type=str(s.get("type", "")), amount=_sf(s.get("amount")), eligibility=str(s.get("eligibility", "")), how_to_apply=str(s.get("how_to_apply", ""))))
            except Exception:
                pass

    # Action Plan
    ap = data.get("action_plan") or {}
    if not isinstance(ap, dict):
        ap = {}
    days = []
    for d in ap.get("days", []):
        if isinstance(d, dict):
            tasks = [t for t in (_safe_task(x) for x in d.get("tasks", []) if isinstance(x, dict)) if t]
            days.append(DayPlan(day=_si(d.get("day")), title=str(d.get("title", f"Day {d.get('day', '?')}")), tasks=tasks))
    action_plan = ActionPlan(days=days, progress_percentage=min(100, max(0, _sf(ap.get("progress_percentage", 0)))))

    # Sources
    sources = []
    for s in data.get("retrieved_sources", []):
        if isinstance(s, dict):
            try:
                rel = s.get("relevance_score")
                if rel is not None:
                    rel = min(1.0, max(0.0, _sf(rel)))
                sources.append(Source(title=str(s.get("title", "")), source=s.get("source"), relevance_score=rel))
            except Exception:
                pass

    return ExportReadinessReport(
        report_id=report_id, status="completed", hs_code=hs_code, certifications=certs,
        restricted_substances=substances, past_rejections=rejections, compliance_roadmap=roadmap,
        risks=risks, risk_score=min(100, max(0, _si(data.get("risk_score", 50)))),
        timeline=timeline, costs=costs, subsidies=subsidies, action_plan=action_plan,
        retrieved_sources=sources, generated_at=datetime.now().isoformat(),
    )


def generate_report(query: QueryInput) -> ExportReadinessReport:
    """Generate a comprehensive Export Readiness Report for the given query."""
    report_id = str(uuid.uuid4())

    prompt = REPORT_PROMPT_TEMPLATE.format(
        product_name=query.product_name,
        ingredients=query.ingredients or "Not specified",
        destination_country=query.destination_country,
        business_type=query.business_type.value,
        company_size=query.company_size.value,
        monthly_volume=query.monthly_volume or "Not specified",
        price_range=query.price_range or "Not specified",
    )

    try:
        data = llm_client.generate_json(prompt, system_prompt=SYSTEM_PROMPT)
        logger.info(f"LLM returned JSON with keys: {list(data.keys())}")
    except Exception as e:
        logger.error(f"LLM call failed: {e}\n{traceback.format_exc()}")
        raise

    try:
        report = _build_report(report_id, data)
    except Exception as e:
        logger.error(f"Report building failed: {e}\n{traceback.format_exc()}")
        logger.error(f"Raw LLM data: {json.dumps(data, indent=2, default=str)[:2000]}")
        raise

    _report_store[report_id] = report
    logger.info(f"Generated report {report_id} for '{query.product_name}' -> {query.destination_country}")
    return report


def get_report(report_id: str) -> ExportReadinessReport | None:
    """Retrieve a previously generated report."""
    return _report_store.get(report_id)
