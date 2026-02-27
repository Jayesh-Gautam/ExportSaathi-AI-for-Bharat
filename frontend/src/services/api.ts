import axios from 'axios';
import type {
    QueryInput, ExportReadinessReport,
    ChatRequest, ChatResponse, ChatMessage,
    CertificationGuidance,
    FinanceAnalysis, LogisticsRiskAnalysis,
} from '../types';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// ── Reports ────────────────────────────────────────────────────

export async function generateReport(query: QueryInput): Promise<ExportReadinessReport> {
    const response = await api.post<ExportReadinessReport>('/reports/generate', query);
    return response.data;
}

export async function getReport(reportId: string): Promise<ExportReadinessReport> {
    const response = await api.get<ExportReadinessReport>(`/reports/${reportId}`);
    return response.data;
}

// ── Chat ───────────────────────────────────────────────────────

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>('/chat', request);
    return response.data;
}

export async function getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/chat/${sessionId}/history`);
    return response.data;
}

// ── Certifications ─────────────────────────────────────────────

export async function getCertificationGuidance(
    certId: string,
    certName: string,
    certType: string,
    productType: string,
    destinationCountry: string,
    companySize: string = 'Micro'
): Promise<CertificationGuidance> {
    const response = await api.post<CertificationGuidance>(
        `/certifications/${certId}/guidance`,
        {
            cert_name: certName,
            cert_type: certType,
            product_type: productType,
            destination_country: destinationCountry,
            company_size: companySize,
        }
    );
    return response.data;
}

// ── Documents ──────────────────────────────────────────────────

export async function generateDocument(docType: string, reportData: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.post('/documents/generate', { doc_type: docType, report_data: reportData });
    return response.data;
}

export async function validateDocument(document: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await api.post('/documents/validate', document);
    return response.data;
}

// ── Finance ────────────────────────────────────────────────────

export async function getFinanceAnalysis(data: Record<string, unknown>): Promise<FinanceAnalysis> {
    const response = await api.post<FinanceAnalysis>('/finance/analysis', data);
    return response.data;
}

// ── Logistics ──────────────────────────────────────────────────

export async function getLogisticsRisk(
    data: Record<string, unknown>
): Promise<LogisticsRiskAnalysis> {
    const response = await api.post<LogisticsRiskAnalysis>('/logistics/risk-analysis', data);
    return response.data;
}

// ── Status ─────────────────────────────────────────────────────

export async function checkApiStatus(): Promise<{ api: string; llm_available: boolean; llm_model: string }> {
    const response = await api.get('/status');
    return response.data;
}
