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

/* ── Shared card shell ─────────────────────────────────────────── */
function Card({ title, children, accent = '#6366f1' }: { title: string; children: React.ReactNode; accent?: string }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: '16px',
            border: `1px solid ${accent}18`, padding: '14px 16px',
            boxShadow: `0 4px 16px ${accent}08`,
        }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>{title}</div>
            {children}
        </div>
    );
}

export default function FinanceDashboard({ reportData }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    async function loadAnalysis() {
        setLoading(true);
        try {
            const result = await getFinanceAnalysis(reportData || {
                product_name: 'Sample Product', hs_code: '0901.11.00', destination_country: 'United States',
            });
            setData(result);
        } catch { /* fallback */ } finally { setLoading(false); }
    }

    /* Splash screen */
    if (!data && !loading) {
        return (
            <div style={{
                height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}>
                <div style={{ fontSize: '3rem' }}>💰</div>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, margin: 0,
                    background: 'linear-gradient(135deg, #f59e0b, #10b981)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Finance Readiness</h1>
                <p style={{ color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: '360px', fontSize: '0.9rem' }}>
                    Working capital, RoDTEP benefits, credit eligibility &amp; cash-flow timeline
                </p>
                <button onClick={loadAnalysis} className="btn-primary" style={{ padding: '0.7rem 2rem', fontSize: '0.95rem' }}>
                    Run Financial Analysis
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div className="spinner" style={{ width: '44px', height: '44px' }} />
                <p style={{ color: '#94a3b8', margin: 0 }}>Analyzing financial readiness...</p>
            </div>
        );
    }

    const wc = data.working_capital || {};
    const rodtep = data.rodtep || {};
    const credit = data.credit_eligibility || {};
    const cashFlow = data.cash_flow_timeline || [];
    const gst = data.gst_refund || {};
    const gap = data.liquidity_gap || {};
    const maxAbs = Math.max(...cashFlow.map((c: any) => Math.abs(c.balance || 0)), 1);

    const wcItems = [
        { label: 'Product Cost', value: wc.product_cost, color: '#6366f1' },
        { label: 'Certifications', value: wc.certification_cost, color: '#8b5cf6' },
        { label: 'Logistics', value: wc.logistics_cost, color: '#f59e0b' },
        { label: 'Documentation', value: wc.documentation_cost, color: '#06b6d4' },
        { label: 'Buffer', value: wc.buffer, color: '#64748b' },
    ];

    return (
        <div style={{
            height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            padding: '16px clamp(16px,3vw,48px) 0',
        }}>
            {/* Page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>💰</span>
                <div>
                    <h1 style={{
                        fontSize: '1.2rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #f59e0b, #10b981)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Finance Readiness</h1>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.74rem' }}>Working capital · RoDTEP · Credit · Cash-flow</p>
                </div>
            </div>

            {/* Two-column grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '14px', flex: 1, overflow: 'hidden', paddingBottom: '16px',
            }}>
                {/* ── LEFT: Working Capital + Cash Flow ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
                    <Card title="💼 Working Capital Requirement" accent="#6366f1">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                            {wcItems.map((item, i) => (
                                <div key={i} style={{
                                    padding: '8px', borderRadius: '10px', textAlign: 'center',
                                    background: `${item.color}10`, border: `1px solid ${item.color}28`,
                                }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '3px' }}>{item.label}</div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: item.color }}>{formatINR(item.value || 0)}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            padding: '8px 12px', borderRadius: '10px', textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.08))',
                            border: '1px solid rgba(99,102,241,0.18)',
                        }}>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Total Required</div>
                            <div style={{
                                fontSize: '1.3rem', fontWeight: 800,
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>{formatINR(wc.total || 0)}</div>
                        </div>
                    </Card>

                    <Card title="📊 Cash Flow Timeline" accent="#06b6d4">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {cashFlow.map((cf: any, i: number) => {
                                const pct = Math.abs(cf.balance) / maxAbs * 100;
                                const pos = cf.balance >= 0;
                                return (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontSize: '0.73rem', color: '#94a3b8', fontWeight: 500 }}>{cf.label}</div>
                                        <div style={{ height: '18px', borderRadius: '5px', background: '#f1f5f9', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${pct}%`, borderRadius: '5px',
                                                background: pos ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                                                transition: 'width 0.5s ease',
                                            }} />
                                        </div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, textAlign: 'right', color: pos ? '#10b981' : '#f87171' }}>
                                            {pos ? '+' : ''}{formatINR(cf.balance)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {data.currency_hedging && (
                        <Card title="💱 Currency Hedging Advice" accent="#f59e0b">
                            <p style={{ fontSize: '0.8rem', color: '#475569', margin: 0 }}>{data.currency_hedging}</p>
                        </Card>
                    )}
                </div>

                {/* ── RIGHT: RoDTEP + Credit + GST + Gap ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Card title="🏛 RoDTEP Benefit" accent="#10b981">
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981', marginBottom: '4px' }}>
                                {rodtep.applicable ? formatINR(rodtep.estimated_benefit || 0) : 'Not Applicable'}
                            </div>
                            {rodtep.applicable && (
                                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Rate: {rodtep.rate_percentage}% on HS {rodtep.hs_code}</div>
                            )}
                        </Card>
                        <Card title="🏦 Pre-Shipment Credit" accent="#06b6d4">
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: credit.eligible ? '#06b6d4' : '#f87171', marginBottom: '4px' }}>
                                {credit.eligible ? formatINR(credit.max_amount || 0) : 'Not Eligible'}
                            </div>
                            {credit.eligible && (
                                <>
                                    <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Rate: {credit.interest_rate_range}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Banks: {credit.recommended_banks?.join(', ')}</div>
                                </>
                            )}
                        </Card>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Card title="💸 GST Refund" accent="#6366f1">
                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#6366f1', marginBottom: '2px' }}>{formatINR(gst.estimated_amount || 0)}</div>
                            <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Expected in ~{gst.estimated_days} days</div>
                        </Card>
                        <Card title="⚠️ Liquidity Gap" accent="#f59e0b">
                            {gap.exists ? (
                                <>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', marginBottom: '2px' }}>{formatINR(gap.gap_amount || 0)}</div>
                                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginBottom: '4px' }}>Gap: ~{gap.gap_period_days} days</div>
                                    {gap.suggestions?.map((s: string, i: number) => (
                                        <div key={i} style={{ fontSize: '0.7rem', color: '#10b981' }}>💡 {s}</div>
                                    ))}
                                </>
                            ) : (
                                <div style={{ fontSize: '0.9rem', color: '#10b981' }}>✅ No gap detected</div>
                            )}
                        </Card>
                    </div>

                    {/* Summary metric tiles */}
                    <Card title="📈 Key Metrics Summary" accent="#8b5cf6">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {[
                                { label: 'Net Benefit (RoDTEP)', val: formatINR(rodtep.estimated_benefit || 0), color: '#10b981' },
                                { label: 'Credit Available', val: credit.eligible ? formatINR(credit.max_amount || 0) : '—', color: '#06b6d4' },
                                { label: 'GST Refund', val: formatINR(gst.estimated_amount || 0), color: '#6366f1' },
                                { label: 'Working Capital', val: formatINR(wc.total || 0), color: '#8b5cf6' },
                            ].map((m, i) => (
                                <div key={i} style={{ padding: '8px', borderRadius: '10px', background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{m.label}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: m.color }}>{m.val}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
