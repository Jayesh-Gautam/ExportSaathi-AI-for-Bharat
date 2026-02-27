import { useState } from 'react';
import { getLogisticsRisk } from '../services/api';

interface Props {
    reportData?: {
        product_name: string;
        destination_country: string;
        hs_code?: string;
    };
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
            <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '4rem 1rem' }}>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>🚢 Logistics Risk Shield</h1>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                    LCL vs FCL, RMS probability, route analysis, freight estimates & insurance
                </p>
                <button onClick={loadAnalysis} className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}>
                    Run Logistics Analysis
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
                <p>Analyzing logistics risks...</p>
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
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Logistics Risk Shield</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Shipping risks, customs, routes & freight</p>
            </div>

            {/* LCL vs FCL */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>📦 LCL vs FCL Recommendation</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                        padding: '1.25rem', borderRadius: '12px', textAlign: 'center',
                        background: lcl.recommendation === 'LCL' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${lcl.recommendation === 'LCL' ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>LCL</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#06b6d4' }}>₹{(lcl.lcl_cost || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Risk: <span style={{ color: lcl.lcl_risk_level === 'low' ? '#10b981' : '#f59e0b' }}>{lcl.lcl_risk_level}</span>
                        </div>
                        {lcl.recommendation === 'LCL' && <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 700 }}>✓ RECOMMENDED</div>}
                    </div>
                    <div style={{
                        padding: '1.25rem', borderRadius: '12px', textAlign: 'center',
                        background: lcl.recommendation === 'FCL' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `2px solid ${lcl.recommendation === 'FCL' ? '#10b981' : 'rgba(255,255,255,0.06)'}`,
                    }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e2e8f0', marginBottom: '0.5rem' }}>FCL</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6366f1' }}>₹{(lcl.fcl_cost || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Risk: <span style={{ color: lcl.fcl_risk_level === 'low' ? '#10b981' : '#f59e0b' }}>{lcl.fcl_risk_level}</span>
                        </div>
                        {lcl.recommendation === 'FCL' && <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 700 }}>✓ RECOMMENDED</div>}
                    </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)' }}>
                    {lcl.reasoning}
                </div>
            </div>

            {/* RMS Probability */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>🎯 RMS Check Probability</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: `conic-gradient(${rmsColor} ${(rms.probability_percent || 0) * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-bg)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.1rem', fontWeight: 800, color: rmsColor,
                        }}>
                            {rms.probability_percent}%
                        </div>
                    </div>
                    <div>
                        <div style={{ fontWeight: 600, color: rmsColor, textTransform: 'uppercase', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                            {rms.risk_level} Risk
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Probability of customs RMS check</div>
                    </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '0.5rem', fontWeight: 600 }}>Risk Factors:</div>
                {rms.factors?.map((f: string, i: number) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem', paddingLeft: '0.5rem' }}>• {f}</div>
                ))}
                {rms.red_flag_keywords?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f87171', marginBottom: '0.25rem' }}>🚩 Red Flag Keywords:</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {rms.red_flag_keywords.map((kw: string, i: number) => (
                                <span key={i} style={{
                                    fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '6px',
                                    background: 'rgba(239,68,68,0.1)', color: '#f87171',
                                }}>{kw}</span>
                            ))}
                        </div>
                    </div>
                )}
                {rms.mitigation_tips?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', marginBottom: '0.25rem' }}>✅ Mitigation Tips:</div>
                        {rms.mitigation_tips.map((t: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.78rem', color: '#4ade80', marginBottom: '0.15rem', paddingLeft: '0.5rem' }}>💡 {t}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Route Analysis */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e2e8f0' }}>🗺 Route Analysis</h3>
                <div style={{
                    padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
                    background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
                }}>
                    <div style={{ fontWeight: 600, color: '#a78bfa', marginBottom: '0.5rem' }}>Recommended Route</div>
                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '0.5rem' }}>{route.recommended_route}</div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Transit: </span>
                            <span style={{ fontWeight: 700, color: '#06b6d4' }}>{route.estimated_transit_days} days</span>
                        </div>
                        <div>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Delay risk: </span>
                            <span style={{ fontWeight: 600, color: route.delay_risk === 'high' ? '#ef4444' : route.delay_risk === 'medium' ? '#f59e0b' : '#10b981' }}>
                                {route.delay_risk}
                            </span>
                        </div>
                    </div>
                </div>
                {route.current_disruptions?.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b', marginBottom: '0.25rem' }}>⚠️ Current Disruptions:</div>
                        {route.current_disruptions.map((d: string, i: number) => (
                            <div key={i} style={{ fontSize: '0.78rem', color: '#fbbf24', marginBottom: '0.15rem', paddingLeft: '0.5rem' }}>• {d}</div>
                        ))}
                    </div>
                )}
                {route.alternative_routes?.length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>Alternative Routes:</div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {route.alternative_routes.map((r: any, i: number) => (
                                <div key={i} style={{
                                    padding: '0.75rem', borderRadius: '10px', flex: '1 1 200px',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0', marginBottom: '0.25rem' }}>{r.route}</div>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.days}d · {r.cost_multiplier}× cost</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Freight & Insurance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>🚛 Freight Estimates</h3>
                    <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Sea Freight</span>
                            <span style={{ fontWeight: 700, color: freight.recommended_mode === 'sea' ? '#10b981' : '#94a3b8' }}>
                                ₹{(freight.sea_freight || 0).toLocaleString('en-IN')}
                                {freight.recommended_mode === 'sea' && ' ✓'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Air Freight</span>
                            <span style={{ fontWeight: 700, color: freight.recommended_mode === 'air' ? '#10b981' : '#94a3b8' }}>
                                ₹{(freight.air_freight || 0).toLocaleString('en-IN')}
                                {freight.recommended_mode === 'air' && ' ✓'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#e2e8f0' }}>🛡 Insurance</h3>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.25rem' }}>
                        ₹{(insurance.estimated_premium || 0).toLocaleString('en-IN')}/shipment
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{insurance.coverage_type}</div>
                    {insurance.recommended && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', fontWeight: 600 }}>✓ Recommended</div>
                    )}
                </div>
            </div>
        </div>
    );
}
