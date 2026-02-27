import { useState } from 'react';
import { getFinanceAnalysis } from '../services/api';

interface Props {
    reportData?: {
        product_name: string;
        hs_code: string;
        destination_country: string;
        certification_cost?: number;
        documentation_cost?: number;
        logistics_cost?: number;
    };
}

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function FinanceDashboard({ reportData }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    async function loadAnalysis() {
        setLoading(true);
        try {
            const result = await getFinanceAnalysis(reportData || {
                product_name: 'Sample Product', hs_code: '0901.11.00',
                destination_country: 'United States',
            });
            setData(result);
        } catch { /* fallback */ } finally { setLoading(false); }
    }

    if (!data && !loading) {
        return (
            <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, #f59e0b, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>💰 Finance Readiness</h1>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    Working capital, RoDTEP benefits, credit eligibility, and cash-flow timeline
                </p>
                <button onClick={loadAnalysis} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                    Run Financial Analysis
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
                <p>Analyzing financial readiness...</p>
            </div>
        );
    }

    const wc = data.working_capital || {};
    const rodtep = data.rodtep || {};
    const credit = data.credit_eligibility || {};
    const cashFlow = data.cash_flow_timeline || [];
    const gst = data.gst_refund || {};
    const gap = data.liquidity_gap || {};

    // Find min balance for cash flow bar chart
    const maxAbs = Math.max(...cashFlow.map((c: any) => Math.abs(c.balance || 0)), 1);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, #f59e0b, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Finance Readiness</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Working capital, credit, subsidies & cash-flow</p>
            </div>

            {/* Working Capital */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>💼 Working Capital Requirement</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {[
                        { label: 'Product Cost', value: wc.product_cost, color: '#6366f1' },
                        { label: 'Certifications', value: wc.certification_cost, color: '#8b5cf6' },
                        { label: 'Logistics', value: wc.logistics_cost, color: '#f59e0b' },
                        { label: 'Documentation', value: wc.documentation_cost, color: '#06b6d4' },
                        { label: 'Buffer', value: wc.buffer, color: '#64748b' },
                    ].map((item, i) => (
                        <div key={i} style={{
                            padding: '1rem', borderRadius: '12px', textAlign: 'center',
                            background: `${item.color}10`, border: `1px solid ${item.color}30`,
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{item.label}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{formatINR(item.value || 0)}</div>
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: '1rem', padding: '1rem', borderRadius: '12px', textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))',
                    border: '1px solid rgba(99,102,241,0.2)',
                }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Required</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {formatINR(wc.total || 0)}
                    </div>
                </div>
            </div>

            {/* RoDTEP & Credit — Side by Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>🏛 RoDTEP Benefit</h3>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginBottom: '0.5rem' }}>
                        {rodtep.applicable ? formatINR(rodtep.estimated_benefit || 0) : 'Not Applicable'}
                    </div>
                    {rodtep.applicable && (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Rate: {rodtep.rate_percentage}% on HS {rodtep.hs_code}</div>
                    )}
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>🏦 Pre-Shipment Credit</h3>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: credit.eligible ? '#06b6d4' : '#f87171', marginBottom: '0.5rem' }}>
                        {credit.eligible ? formatINR(credit.max_amount || 0) : 'Not Eligible'}
                    </div>
                    {credit.eligible && (
                        <>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Rate: {credit.interest_rate_range}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Banks: {credit.recommended_banks?.join(', ')}</div>
                        </>
                    )}
                </div>
            </div>

            {/* Cash Flow Timeline */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>📊 Cash Flow Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cashFlow.map((cf: any, i: number) => {
                        const pct = Math.abs(cf.balance) / maxAbs * 100;
                        const isPositive = cf.balance >= 0;
                        return (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 110px', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>{cf.label}</div>
                                <div style={{ height: '24px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', position: 'relative' }}>
                                    <div style={{
                                        position: 'absolute', left: 0, top: 0, height: '100%',
                                        width: `${pct}%`, borderRadius: '6px',
                                        background: isPositive
                                            ? 'linear-gradient(90deg, #10b981, #34d399)'
                                            : 'linear-gradient(90deg, #ef4444, #f87171)',
                                        transition: 'width 0.3s ease',
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', color: isPositive ? '#10b981' : '#f87171' }}>
                                    {isPositive ? '+' : ''}{formatINR(cf.balance)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* GST Refund & Liquidity Gap */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>💸 GST Refund</h3>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#a78bfa', marginBottom: '0.25rem' }}>{formatINR(gst.estimated_amount || 0)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Expected in ~{gst.estimated_days} days</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>⚠️ Liquidity Gap</h3>
                    {gap.exists ? (
                        <>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.25rem' }}>{formatINR(gap.gap_amount || 0)}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Gap period: ~{gap.gap_period_days} days</div>
                            {gap.suggestions?.map((s: string, i: number) => (
                                <div key={i} style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.15rem' }}>💡 {s}</div>
                            ))}
                        </>
                    ) : (
                        <div style={{ fontSize: '1rem', color: '#10b981' }}>✅ No liquidity gap detected</div>
                    )}
                </div>
            </div>

            {/* Currency Hedging */}
            {data.currency_hedging && (
                <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem', borderLeft: '3px solid #f59e0b' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.5rem' }}>💱 Currency Hedging Advice</h4>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{data.currency_hedging}</p>
                </div>
            )}
        </div>
    );
}
