/* ── TypeScript Types for ExportSaathi ──────────────────────────────────────── */

export type BusinessType = 'Manufacturing' | 'SaaS' | 'Merchant';
export type CompanySize = 'Micro' | 'Small' | 'Medium';
export type CertificationType = 'FDA' | 'CE' | 'REACH' | 'BIS' | 'ZED' | 'SOFTEX' | 'other';
export type RiskSeverity = 'high' | 'medium' | 'low';
export type Priority = 'high' | 'medium' | 'low';
export type TaskCategory = 'certification' | 'documentation' | 'logistics' | 'finance';

// ── Query Input ────────────────────────────────────────────────

export interface QueryInput {
    product_name: string;
    ingredients?: string;
    bom?: string;
    destination_country: string;
    business_type: BusinessType;
    company_size: CompanySize;
    monthly_volume?: number;
    price_range?: string;
    payment_mode?: string;
}

// ── HS Code ────────────────────────────────────────────────────

export interface HSCodeAlternative {
    code: string;
    confidence: number;
    description: string;
}

export interface HSCodePrediction {
    code: string;
    confidence: number;
    description: string;
    alternatives: HSCodeAlternative[];
}

// ── Certifications ─────────────────────────────────────────────

export interface CostRange {
    min: number;
    max: number;
    currency: string;
}

export interface Certification {
    id: string;
    name: string;
    type: CertificationType;
    mandatory: boolean;
    estimated_cost: CostRange;
    estimated_timeline_days: number;
    priority: Priority;
}

// ── Report Components ──────────────────────────────────────────

export interface RestrictedSubstance {
    name: string;
    reason: string;
    regulation: string;
}

export interface PastRejection {
    product_type: string;
    reason: string;
    source: 'FDA' | 'EU_RASFF' | 'other';
    date: string;
}

export interface RoadmapStep {
    step: number;
    title: string;
    description: string;
    duration_days: number;
    dependencies: string[];
}

export interface Risk {
    title: string;
    description: string;
    severity: RiskSeverity;
    mitigation: string;
}

export interface TimelinePhase {
    phase: string;
    duration_days: number;
}

export interface Timeline {
    estimated_days: number;
    breakdown: TimelinePhase[];
}

export interface CostBreakdown {
    certifications: number;
    documentation: number;
    logistics: number;
    total: number;
    currency: string;
}

export interface Source {
    title: string;
    source?: string;
    excerpt?: string;
    url?: string;
    relevance_score?: number;
}

export interface Subsidy {
    name: string;
    type?: string;
    amount: number;
    eligibility: string;
    how_to_apply?: string;
}

// ── Action Plan ────────────────────────────────────────────────

export interface Task {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    completed: boolean;
    estimated_duration?: string;
}

export interface DayPlan {
    day: number;
    title: string;
    tasks: Task[];
}

export interface ActionPlan {
    days: DayPlan[];
    progress_percentage: number;
}

// ── Full Report ────────────────────────────────────────────────

export interface ExportReadinessReport {
    report_id: string;
    status: 'completed' | 'processing' | 'failed';
    hs_code: HSCodePrediction;
    certifications: Certification[];
    restricted_substances: RestrictedSubstance[];
    past_rejections: PastRejection[];
    compliance_roadmap: RoadmapStep[];
    risks: Risk[];
    risk_score: number;
    timeline: Timeline;
    costs: CostBreakdown;
    subsidies: Subsidy[];
    action_plan: ActionPlan;
    retrieved_sources: Source[];
    generated_at: string;
}

// ── Chat ───────────────────────────────────────────────────────

export interface QueryContext {
    report_id?: string;
    product_type?: string;
    destination_country?: string;
}

export interface ChatRequest {
    session_id: string;
    question: string;
    context: QueryContext;
}

export interface ChatResponse {
    message_id: string;
    answer: string;
    sources: Source[];
    timestamp: string;
}

export interface ChatMessage {
    message_id: string;
    role: 'user' | 'assistant';
    content: string;
    sources?: Source[];
    timestamp: string;
}

// ── Certification Guidance ─────────────────────────────────────

export interface GuidanceStep {
    step_number: number;
    title: string;
    description: string;
    estimated_days: number;
    documents_needed: string[];
    tips: string;
}

export interface GuidanceDocument {
    id: string;
    name: string;
    description: string;
    where_to_get: string;
    mandatory: boolean;
}

export interface TestLab {
    name: string;
    location: string;
    accreditation: string;
    contact: string;
    estimated_cost_inr: number;
}

export interface GuidanceSubsidy {
    name: string;
    provider: string;
    benefit: string;
    eligibility: string;
    how_to_apply: string;
    portal_url?: string;
}

export interface RejectionReason {
    reason: string;
    how_to_avoid: string;
}

export interface MockAuditQuestion {
    question: string;
    suggested_answer: string;
    category: string;
}

export interface CertificationGuidance {
    cert_id: string;
    cert_name: string;
    cert_type: string;
    overview: string;
    why_required: string;
    steps: GuidanceStep[];
    document_checklist: GuidanceDocument[];
    test_labs: TestLab[];
    subsidies: GuidanceSubsidy[];
    common_rejection_reasons: RejectionReason[];
    mock_audit_questions: MockAuditQuestion[];
    estimated_total_cost_inr: { min: number; max: number };
    estimated_total_days: number;
    consultant_advice: string;
    generated_at: string;
}

// ── Finance Module ─────────────────────────────────────────────

export interface FinanceAnalysis {
    working_capital: {
        product_cost: number;
        certification_cost: number;
        logistics_cost: number;
        documentation_cost: number;
        buffer: number;
        total: number;
    };
    rodtep: {
        applicable: boolean;
        rate_percentage: number;
        estimated_benefit: number;
        hs_code: string;
    };
    credit_eligibility: {
        eligible: boolean;
        max_amount: number;
        interest_rate_range: string;
        recommended_banks: string[];
    };
    cash_flow_timeline: {
        month: number;
        label: string;
        inflow: number;
        outflow: number;
        balance: number;
    }[];
    gst_refund: {
        estimated_amount: number;
        estimated_days: number;
    };
    liquidity_gap: {
        exists: boolean;
        gap_amount: number;
        gap_period_days: number;
        suggestions: string[];
    };
    currency_hedging: string;
}

// ── Logistics Risk ─────────────────────────────────────────────

export interface LogisticsRiskAnalysis {
    lcl_vs_fcl: {
        recommendation: 'LCL' | 'FCL';
        lcl_cost: number;
        fcl_cost: number;
        lcl_risk_level: RiskSeverity;
        fcl_risk_level: RiskSeverity;
        reasoning: string;
    };
    rms_probability: {
        probability_percent: number;
        risk_level: RiskSeverity;
        factors: string[];
        red_flag_keywords: string[];
        mitigation_tips: string[];
    };
    route_analysis: {
        recommended_route: string;
        estimated_transit_days: number;
        delay_risk: RiskSeverity;
        current_disruptions: string[];
        alternative_routes: { route: string; days: number; cost_multiplier: number }[];
    };
    freight_estimate: {
        sea_freight: number;
        air_freight: number;
        recommended_mode: string;
        currency: string;
    };
    insurance: {
        recommended: boolean;
        estimated_premium: number;
        coverage_type: string;
    };
}
