import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import type { QueryInput, ExportReadinessReport, Certification } from './types';
import { generateReport } from './services/api';
import Navbar from './components/Navbar';
import QueryForm from './components/QueryForm';
import ReportDisplay from './components/ReportDisplay';
import ChatInterface from './components/ChatInterface';
import CertificationDetailModal from './components/CertificationDetailModal';
import DocumentationHub from './components/DocumentationHub';
import FinanceDashboard from './components/FinanceDashboard';
import LogisticsShield from './components/LogisticsShield';

/* ── Shared App State ──────────────────────────────────────────── */

function AppContent() {
  const navigate = useNavigate();

  // Core state
  const [report, setReport] = useState<ExportReadinessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryContext, setQueryContext] = useState({ product: '', country: '', companySize: 'Micro' });

  // Certification modal
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

  const handleSubmit = async (query: QueryInput) => {
    setLoading(true);
    setError(null);
    setQueryContext({ product: query.product_name, country: query.destination_country, companySize: query.company_size });

    try {
      const result = await generateReport(query);
      setReport(result);
      setLoading(false);
      navigate('/report');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate report. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Home — Query Form */}
          <Route path="/" element={
            <div>
              {loading && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', minHeight: '60vh', gap: '24px'
                }}>
                  <div className="spinner" style={{ width: '56px', height: '56px' }} />
                  <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontWeight: 700, marginBottom: '8px', fontSize: '1.2rem' }}>
                      Generating Export Readiness Report
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                      Analyzing {queryContext.product} for export to {queryContext.country}...
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                      This may take 15-30 seconds
                    </p>
                  </div>
                </div>
              )}
              {!loading && (
                <>
                  {error && (
                    <div style={{
                      maxWidth: '720px', margin: '0 auto 20px', padding: '14px 20px',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: '12px', color: '#f87171', fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      ⚠️ {error}
                    </div>
                  )}
                  <QueryForm onSubmit={handleSubmit} isLoading={false} />
                </>
              )}
            </div>
          } />

          {/* Report View */}
          <Route path="/report" element={
            report ? (
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_380px] gap-[20px] max-w-[1320px] mx-auto items-start p-4 lg:p-0">
                <ReportDisplay
                  report={report}
                  onBack={handleBack}
                  onCertClick={(cert) => setSelectedCert(cert)}
                />
                <div style={{ position: 'sticky', top: '84px' }}>
                  <ChatInterface
                    reportId={report.report_id}
                    productType={queryContext.product}
                    destinationCountry={queryContext.country}
                  />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No report generated yet.</p>
                <button className="btn-primary" onClick={() => navigate('/')}>Start New Query</button>
              </div>
            )
          } />

          {/* Documents */}
          <Route path="/documents" element={
            <DocumentationHub reportData={report ? {
              product_name: queryContext.product,
              hs_code: report.hs_code?.code || '',
              destination_country: queryContext.country,
              business_type: 'Manufacturing',
            } : undefined} />
          } />

          {/* Finance */}
          <Route path="/finance" element={
            <FinanceDashboard reportData={report ? {
              product_name: queryContext.product,
              hs_code: report.hs_code?.code || '',
              destination_country: queryContext.country,
              certification_cost: report.costs?.certifications,
              documentation_cost: report.costs?.documentation,
              logistics_cost: report.costs?.logistics,
            } : undefined} />
          } />

          {/* Logistics */}
          <Route path="/logistics" element={
            <LogisticsShield reportData={report ? {
              product_name: queryContext.product,
              destination_country: queryContext.country,
              hs_code: report.hs_code?.code || '',
            } : undefined} />
          } />
        </Routes>
      </div>

      {/* Certification Detail Modal */}
      {selectedCert && (
        <CertificationDetailModal
          certification={selectedCert}
          productType={queryContext.product}
          destinationCountry={queryContext.country}
          companySize={queryContext.companySize}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </>
  );
}

/* ── Root App with Router ─────────────────────────────────────── */

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
