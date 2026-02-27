"""Pydantic data models for ExportSaathi API."""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from enum import Enum


# ── Enums ──────────────────────────────────────────────────────────────────────

class BusinessType(str, Enum):
    MANUFACTURING = "Manufacturing"
    SAAS = "SaaS"
    MERCHANT = "Merchant"


class CompanySize(str, Enum):
    MICRO = "Micro"
    SMALL = "Small"
    MEDIUM = "Medium"


class CertificationType(str, Enum):
    FDA = "FDA"
    CE = "CE"
    REACH = "REACH"
    BIS = "BIS"
    ZED = "ZED"
    SOFTEX = "SOFTEX"
    OTHER = "other"


class RiskSeverity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskCategory(str, Enum):
    CERTIFICATION = "certification"
    DOCUMENTATION = "documentation"
    LOGISTICS = "logistics"
    FINANCE = "finance"


# ── Query Input ────────────────────────────────────────────────────────────────

class QueryInput(BaseModel):
    product_name: str = Field(..., min_length=1, max_length=200)
    ingredients: Optional[str] = Field(None, max_length=2000)
    bom: Optional[str] = Field(None, max_length=2000)
    destination_country: str = Field(..., min_length=1, max_length=100)
    business_type: BusinessType
    company_size: CompanySize
    monthly_volume: Optional[float] = Field(None, gt=0)
    price_range: Optional[str] = None
    payment_mode: Optional[str] = None


# ── HS Code ────────────────────────────────────────────────────────────────────

class HSCodeAlternative(BaseModel):
    code: str
    confidence: float = Field(ge=0.0, le=100.0)
    description: str


class HSCodePrediction(BaseModel):
    code: str
    confidence: float = Field(ge=0.0, le=100.0)
    description: str
    alternatives: List[HSCodeAlternative] = []


# ── Certifications ─────────────────────────────────────────────────────────────

class CostRange(BaseModel):
    min: float
    max: float
    currency: str = "INR"


class Certification(BaseModel):
    id: str
    name: str
    type: CertificationType
    mandatory: bool
    estimated_cost: CostRange
    estimated_timeline_days: int
    priority: Priority


# ── Report Components ──────────────────────────────────────────────────────────

class RestrictedSubstance(BaseModel):
    name: str
    reason: str
    regulation: str


class PastRejection(BaseModel):
    product_type: str
    reason: str
    source: Literal["FDA", "EU_RASFF", "other"]
    date: str


class RoadmapStep(BaseModel):
    step: int
    title: str
    description: str
    duration_days: int
    dependencies: List[str] = []


class Risk(BaseModel):
    title: str
    description: str
    severity: RiskSeverity
    mitigation: str


class TimelinePhase(BaseModel):
    phase: str
    duration_days: int


class Timeline(BaseModel):
    estimated_days: int
    breakdown: List[TimelinePhase]


class CostBreakdown(BaseModel):
    certifications: float
    documentation: float
    logistics: float
    total: float
    currency: str = "INR"


class Source(BaseModel):
    title: str
    source: Optional[str] = None
    excerpt: Optional[str] = None
    url: Optional[str] = None
    relevance_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class Subsidy(BaseModel):
    name: str
    type: str = ""
    amount: float
    eligibility: str
    how_to_apply: str = ""


# ── Action Plan ────────────────────────────────────────────────────────────────

class Task(BaseModel):
    id: str
    title: str
    description: str
    category: TaskCategory = TaskCategory.CERTIFICATION
    completed: bool = False
    estimated_duration: Optional[str] = None


class DayPlan(BaseModel):
    day: int
    title: str
    tasks: List[Task]


class ActionPlan(BaseModel):
    days: List[DayPlan]
    progress_percentage: float = Field(default=0.0, ge=0.0, le=100.0)


# ── Full Report ────────────────────────────────────────────────────────────────

class ExportReadinessReport(BaseModel):
    report_id: str
    status: Literal["completed", "processing", "failed"]
    hs_code: HSCodePrediction
    certifications: List[Certification]
    restricted_substances: List[RestrictedSubstance] = []
    past_rejections: List[PastRejection] = []
    compliance_roadmap: List[RoadmapStep] = []
    risks: List[Risk]
    risk_score: int = Field(ge=0, le=100)
    timeline: Timeline
    costs: CostBreakdown
    subsidies: List[Subsidy] = []
    action_plan: ActionPlan
    retrieved_sources: List[Source] = []
    generated_at: str


# ── Chat ───────────────────────────────────────────────────────────────────────

class QueryContext(BaseModel):
    report_id: Optional[str] = None
    product_type: Optional[str] = None
    destination_country: Optional[str] = None


class ChatRequest(BaseModel):
    session_id: str
    question: str = Field(..., min_length=1, max_length=1000)
    context: QueryContext = QueryContext()


class ChatResponse(BaseModel):
    message_id: str
    answer: str
    sources: List[Source] = []
    timestamp: str


class ChatMessage(BaseModel):
    message_id: str
    role: Literal["user", "assistant"]
    content: str
    sources: Optional[List[Source]] = None
    timestamp: str


# ── API Responses ──────────────────────────────────────────────────────────────

class ReportGenerateResponse(BaseModel):
    report_id: str
    status: str
    report: ExportReadinessReport


class ErrorResponse(BaseModel):
    error: str
    detail: str
    code: str = "UNKNOWN_ERROR"
