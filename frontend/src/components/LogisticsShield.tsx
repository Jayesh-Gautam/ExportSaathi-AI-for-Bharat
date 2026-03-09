import { useState } from 'react';
import { getLogisticsRisk } from '../services/api';

interface Props {
    reportData?: {
        product_name: string;
        destination_country: string;
        hs_code?: string;
    };
}

function Card({ title, children, accent = '#06b6d4' }: { title: string; children: React.ReactNode; accent?: string }) {
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

export default function LogisticsShield({ reportData }: Props) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    async function loadAnalysis() {
        setLoading(true);
        try {
            const result = await getLogisticsRisk(reportData || {
                product_name: 'Sample Product', destination_country: 'United States',
            });
            setData(result);
        } catch { /* fallback */ } finally { setLoading(false); }
    }

    if (!data && !loading) {
        return (
            <div style={{
                height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '16px',
            }}>
                <div style={{ fontSize: '3rem' }}>🚢</div>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, margin: 0,
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Logistics Risk Shield</h1>
                <p style={{ color: '#94a3b8', margin: 0, textAlign: 'center', maxWidth: '360px', fontSize: '0.9rem' }}>
                    LCL vs FCL, RMS probability, route analysis, freight estimates &amp; insurance
                </p>
                <button onClick={loadAnalysis} className="btn-primary" style={{ padding: '0.7rem 2rem', fontSize: '0.95rem' }}>
                    Run Logistics Analysis
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <div className="spinner" style={{ width: '44px', height: '44px' }} />
                <p style={{ color: '#94a3b8', margin: 0 }}>Analyzing logistics risks...</p>
            </div>
        );
    }

    const lcl = data.lcl_vs_fcl || {};
    const rms = data.rms_probability || {};
    const route = data.route_analysis || {};
    const freight = data.freight_estimate || {};
    const insurance = data.insurance || {};
    const rmsColor = rms.risk_level === 'high' ? '#ef4444' : rms.risk_level === 'medium' ? '#f59e0b' : '#10b981';

    return (
        <div style={{
            height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            padding: '16px clamp(16px,3vw,48px) 0',
        }}>
            {/* Page title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexShrink: 0 }}>
                <span style={{ fontSize: '1.4rem' }}>🚢</span>
                <div>
                    <h1 style={{
                        fontSize: '1.2rem', fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Logistics Risk Shield</h1>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.74rem' }}>Shipping · Customs · Routes · Freight</p>
                </div>
            </div>

            {/* Two-column grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '14px', flex: 1, overflow: 'hidden', paddingBottom: '16px',
            }}>
                {/* ── LEFT: LCL/FCL + Route ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
                    <Card title="📦 LCL vs FCL Recommendation" accent="#06b6d4">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            {['LCL', 'FCL'].map((type) => {
                                const isRec = lcl.recommendation === type;
                                const cost = type === 'LCL' ? lcl.lcl_cost : lcl.fcl_cost;
                                const risk = type === 'LCL' ? lcl.lcl_risk_level : lcl.fcl_risk_level;
                                return (
                                    <div key={type} style={{
                                        padding: '10px', borderRadius: '10px', textAlign: 'center',
                                        background: isRec ? 'rgba(16,185,129,0.08)' : '#f8f9fc',
                                        border: `2px solid ${isRec ? '#10b981' : 'rgba(0,0,0,0.06)'}`,
                                    }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>{type}</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: type === 'LCL' ? '#06b6d4' : '#6366f1' }}>
                                            ₹{(cost || 0).toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                                            Risk: <span style={{ color: risk === 'low' ? '#10b981' : '#f59e0b' }}>{risk}</span>
                                        </div>
                                        {isRec && <div style={{ fontSize: '0.65rem', color: '#10b981', marginTop: '4px', fontWeight: 700 }}>✓ RECOMMENDED</div>}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', padding: '8px 10px', borderRadius: '8px', background: '#f1f5f9' }}>
                            {lcl.reasoning}
                        </div>
                    </Card>

                    <Card title="🗺 Route Analysis" accent="#6366f1">
                        <div style={{
                            padding: '10px 12px', borderRadius: '10px', marginBottom: '8px',
                            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
                        }}>
                            <div style={{ fontWeight: 600, color: '#6366f1', fontSize: '0.75rem', marginBottom: '4px' }}>Recommended Route</div>
                            <div style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '6px' }}>{route.recommended_route}</div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Transit: </span>
                                    <span style={{ fontWeight: 700, color: '#06b6d4', fontSize: '0.8rem' }}>{route.estimated_transit_days} days</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Delay risk: </span>
                                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: route.delay_risk === 'high' ? '#ef4444' : route.delay_risk === 'medium' ? '#f59e0b' : '#10b981' }}>
                                        {route.delay_risk}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {route.current_disruptions?.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#f59e0b', marginBottom: '3px' }}>⚠️ Disruptions:</div>
                                {route.current_disruptions.map((d: string, i: number) => (
                                    <div key={i} style={{ fontSize: '0.72rem', color: '#fbbf24', paddingLeft: '8px' }}>• {d}</div>
                                ))}
                            </div>
                        )}
                        {route.alternative_routes?.length > 0 && (
                            <div>
                                <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Alternative Routes:</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {route.alternative_routes.map((r: any, i: number) => (
                                        <div key={i} style={{
                                            padding: '6px 10px', borderRadius: '8px', flex: '1 1 150px',
                                            background: '#f8f9fc', border: '1px solid rgba(0,0,0,0.05)',
                                        }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 500, color: '#1e293b' }}>{r.route}</div>
                                            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{r.days}d · {r.cost_multiplier}× cost</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                </div>

                {/* ── RIGHT: RMS + Freight + Insurance ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', paddingRight: '4px' }}>
                    <Card title="🎯 RMS Check Probability" accent={rmsColor}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                            <div style={{
                                width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                                background: `conic-gradient(${rmsColor} ${(rms.probability_percent || 0) * 3.6}deg, #e2e8f0 0deg)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '50%', background: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1rem', fontWeight: 800, color: rmsColor,
                                }}>{rms.probability_percent}%</div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, color: rmsColor, textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '2px' }}>
                                    {rms.risk_level} Risk
                                </div>
                                <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>Probability of customs RMS check</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '0.77rem', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>Risk Factors:</div>
                        {rms.factors?.map((f: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.73rem', color: '#94a3b8', marginBottom: '2px', paddingLeft: '6px' }}>• {f}</div>
                        ))}
                        {rms.mitigation_tips?.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{ fontSize: '0.73rem', fontWeight: 600, color: '#10b981', marginBottom: '3px' }}>✅ Mitigation Tips:</div>
                                {rms.mitigation_tips.map((tip: string, i: number) => (
                                    <div key={i} style={{ fontSize: '0.71rem', color: '#059669', marginBottom: '2px', paddingLeft: '6px' }}>💡 {tip}</div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <Card title="🚛 Freight Estimates" accent="#f59e0b">
                            {[
                                { label: 'Sea Freight', val: freight.sea_freight, rec: freight.recommended_mode === 'sea' },
                                { label: 'Air Freight', val: freight.air_freight, rec: freight.recommended_mode === 'air' },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i === 0 ? '6px' : 0 }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.label}</span>
                                    <span style={{ fontWeight: 700, fontSize: '0.83rem', color: item.rec ? '#10b981' : '#64748b' }}>
                                        ₹{(item.val || 0).toLocaleString('en-IN')}{item.rec ? ' ✓' : ''}
                                    </span>
                                </div>
                            ))}
                        </Card>
                        <Card title="🛡 Insurance" accent="#6366f1">
                            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#6366f1', marginBottom: '2px' }}>
                                ₹{(insurance.estimated_premium || 0).toLocaleString('en-IN')}/shipment
                            </div>
                            <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{insurance.coverage_type}</div>
                            {insurance.recommended && (
                                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>✓ Recommended</div>
                            )}
                        </Card>
                    </div>

                    {/* Quick summary */}
                    <Card title="📌 Quick Summary" accent="#8b5cf6">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                            {[
                                { label: 'Recommended Mode', val: lcl.recommendation || '—', color: '#06b6d4' },
                                { label: 'RMS Risk', val: rms.risk_level || '—', color: rmsColor },
                                { label: 'Transit Time', val: route.estimated_transit_days ? `${route.estimated_transit_days}d` : '—', color: '#6366f1' },
                                { label: 'Insurance', val: insurance.recommended ? 'Recommended' : 'Optional', color: '#10b981' },
                            ].map((m, i) => (
                                <div key={i} style={{ padding: '8px', borderRadius: '10px', background: `${m.color}08`, border: `1px solid ${m.color}20` }}>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{m.label}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: m.color }}>{m.val}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
