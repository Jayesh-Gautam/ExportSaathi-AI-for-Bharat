import { useState } from 'react';
import type { ExportReadinessReport, Certification } from '../types';

interface ReportDisplayProps {
    report: ExportReadinessReport;
    onBack: () => void;
    onCertClick?: (cert: Certification) => void;
}

const TABS = [
    { id: 'certs', label: 'Certifications', icon: '✅' },
    { id: 'risks', label: 'Risks', icon: '⚠️' },
    { id: 'action', label: 'Action Plan', icon: '📅' },
    { id: 'subsidies', label: 'Subsidies', icon: '🏛️' },
    { id: 'sources', label: 'Sources', icon: '📚' },
];

export default function ReportDisplay({ report, onBack, onCertClick }: ReportDisplayProps) {
    const [activeTab, setActiveTab] = useState('certs');
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

    const toggleTask = (id: string) => setCompletedTasks(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });

    const riskColor = (score: number) => score <= 30 ? '#10b981' : score <= 60 ? '#f59e0b' : '#ef4444';
    const formatCurrency = (amount: number, currency: string = 'INR') =>
        currency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `$${amount.toLocaleString()}`;

    const totalTasks = report.action_plan.days.reduce((s, d) => s + d.tasks.length, 0);
    const scoreColor = riskColor(report.risk_score);

    return (
        <div style={{
            height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
            padding: '16px clamp(16px,3vw,48px) 0',
        }}>
            {/* Page header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
                <button onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '0.82rem' }}>
                    ← New Query
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🚢</span>
                    <h1 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>Export Readiness Report</h1>
                </div>
                <div style={{ width: '90px' }} />
            </div>

            {/* Two-column layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '14px', flex: 1, overflow: 'hidden', paddingBottom: '16px' }}>

                {/* ── LEFT: Snapshot panel ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px' }}>

                    {/* Risk score ring */}
                    <div style={{
                        background: 'rgba(255,255,255,0.95)', borderRadius: '16px',
                        border: `1px solid ${scoreColor}20`, padding: '16px',
                        boxShadow: `0 4px 16px ${scoreColor}08`,
                        display: 'flex', alignItems: 'center', gap: '14px',
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
                            background: `conic-gradient(${scoreColor} ${report.risk_score * 3.6}deg, #e2e8f0 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{
                                width: '52px', height: '52px', borderRadius: '50%', background: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.1rem', fontWeight: 800, color: scoreColor,
                            }}>{report.risk_score}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '2px' }}>Overall Risk Score</div>
                            <div style={{ fontWeight: 700, color: scoreColor, fontSize: '0.88rem' }}>
                                {report.risk_score <= 30 ? 'Low Risk ✅' : report.risk_score <= 60 ? 'Medium Risk ⚠️' : 'High Risk 🚨'}
                            </div>
                        </div>
                    </div>

                    {/* HS Code */}
                    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.12)', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>📋 HS Code</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#4f46e5', fontFamily: 'monospace', marginBottom: '4px' }}>{report.hs_code.code}</div>
                        <div style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '8px', lineHeight: 1.4 }}>{report.hs_code.description}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${report.hs_code.confidence}%`, background: 'linear-gradient(90deg, #4f46e5, #06b6d4)', borderRadius: '3px' }} />
                            </div>
                            <span style={{ fontSize: '0.7rem', color: '#06b6d4', fontWeight: 600, flexShrink: 0 }}>{report.hs_code.confidence}%</span>
                        </div>
                        {report.hs_code.alternatives.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {report.hs_code.alternatives.map((alt, i) => (
                                    <span key={i} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '5px', background: '#f1f5f9', color: '#64748b' }}>
                                        {alt.code} ({alt.confidence}%)
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Cost breakdown */}
                    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.12)', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>💰 Cost Breakdown</div>
                        {[
                            { label: 'Certifications', val: report.costs.certifications, color: '#6366f1' },
                            { label: 'Documentation', val: report.costs.documentation, color: '#06b6d4' },
                            { label: 'Logistics', val: report.costs.logistics, color: '#f59e0b' },
                        ].map((c, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.label}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.color }}>{formatCurrency(c.val, report.costs.currency)}</span>
                            </div>
                        ))}
                        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '6px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Total</span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {formatCurrency(report.costs.total, report.costs.currency)}
                            </span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '14px', border: '1px solid rgba(6,182,212,0.12)', padding: '14px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                            ⏱ Timeline — {report.timeline.estimated_days} days
                        </div>
                        {report.timeline.breakdown.map((phase, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <div style={{
                                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                                    background: 'rgba(99,102,241,0.1)', border: '2px solid #6366f1',
                                    fontSize: '0.62rem', fontWeight: 700, color: '#6366f1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>{i + 1}</div>
                                <div style={{ flex: 1, fontSize: '0.76rem', color: '#475569' }}>{phase.phase}</div>
                                <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, color: '#06b6d4',
                                    background: 'rgba(6,182,212,0.1)', padding: '2px 7px', borderRadius: '6px',
                                }}>{phase.duration_days}d</span>
                            </div>
                        ))}
                    </div>

                    {/* Quick stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                            { label: 'Certifications', val: report.certifications.length, color: '#10b981' },
                            { label: 'Risks Found', val: report.risks.length, color: '#ef4444' },
                            { label: 'Subsidies', val: report.subsidies.length, color: '#f59e0b' },
                            { label: 'Action Tasks', val: totalTasks, color: '#6366f1' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                padding: '10px 12px', borderRadius: '12px', textAlign: 'center',
                                background: s.color, border: `1px solid ${s.color}`,
                                boxShadow: `0 4px 10px ${s.color}40`, color: 'white'
                            }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{s.val}</div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 500, opacity: 0.9 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT: Tabbed detail panel ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.95)', borderRadius: '18px',
                    border: '1px solid rgba(99,102,241,0.1)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.06)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    {/* Tab bar */}
                    <div style={{
                        display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.06)',
                        padding: '0 16px', gap: '2px', flexShrink: 0,
                    }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '11px 14px', border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: '0.78rem', fontWeight: activeTab === tab.id ? 700 : 500,
                                    color: activeTab === tab.id ? '#4f46e5' : '#94a3b8',
                                    borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
                                    transition: 'all 0.2s ease', fontFamily: 'inherit',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                }}
                            >
                                <span>{tab.icon}</span> {tab.label}
                                {tab.id === 'certs' && <span style={{ fontSize: '0.65rem', background: '#4f46e5', color: 'white', borderRadius: '8px', padding: '1px 5px' }}>{report.certifications.length}</span>}
                                {tab.id === 'risks' && <span style={{ fontSize: '0.65rem', background: '#ef4444', color: 'white', borderRadius: '8px', padding: '1px 5px' }}>{report.risks.length}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>

                        {/* Certifications */}
                        {activeTab === 'certs' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {report.certifications.map(cert => (
                                    <div
                                        key={cert.id}
                                        onClick={() => onCertClick?.(cert)}
                                        style={{
                                            background: '#f8f9fc', borderRadius: '12px', padding: '12px 14px',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            cursor: onCertClick ? 'pointer' : 'default', transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={e => { if (onCertClick) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)'; } }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLElement).style.background = '#f8f9fc'; }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{cert.name}</span>
                                                <span className={`badge badge-${cert.priority}`}>{cert.priority}</span>
                                                {cert.mandatory && (
                                                    <span style={{ fontSize: '0.65rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>MANDATORY</span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {formatCurrency(cert.estimated_cost.min)} – {formatCurrency(cert.estimated_cost.max)} · {cert.estimated_timeline_days} days
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '0.72rem', background: 'rgba(99,102,241,0.12)', color: '#6366f1', padding: '3px 8px', borderRadius: '7px', fontWeight: 600 }}>{cert.type}</span>
                                            {onCertClick && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>→</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Risks */}
                        {activeTab === 'risks' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {report.risks.map((risk, i) => (
                                    <div key={i} style={{ background: '#f8f9fc', borderRadius: '12px', padding: '12px 14px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>{risk.title}</span>
                                            <span className={`badge badge-${risk.severity}`}>{risk.severity}</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>{risk.description}</p>
                                        <div style={{ fontSize: '0.77rem', color: '#10b981', background: 'rgba(16,185,129,0.06)', borderRadius: '7px', padding: '7px 10px', borderLeft: '3px solid #10b981' }}>
                                            <strong>Mitigation:</strong> {risk.mitigation}
                                        </div>
                                    </div>
                                ))}
                                {report.restricted_substances.length > 0 && (
                                    <>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>🧪 Restricted Substances</div>
                                        {report.restricted_substances.map((sub, i) => (
                                            <div key={i} style={{ background: 'rgba(239,68,68,0.04)', borderRadius: '10px', padding: '10px 12px', border: '1px solid rgba(239,68,68,0.12)' }}>
                                                <strong style={{ color: '#f87171', fontSize: '0.85rem' }}>{sub.name}</strong>
                                                <p style={{ fontSize: '0.77rem', color: '#64748b', margin: '3px 0' }}>{sub.reason}</p>
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>📜 {sub.regulation}</span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Action Plan */}
                        {activeTab === 'action' && (
                            <div>
                                {/* Progress */}
                                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.78rem' }}>
                                        <span style={{ color: '#64748b' }}>Progress</span>
                                        <span style={{ color: '#4f46e5', fontWeight: 600 }}>{completedTasks.size} / {totalTasks} tasks</span>
                                    </div>
                                    <div style={{ height: '7px', borderRadius: '4px', background: '#e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${(completedTasks.size / Math.max(1, totalTasks)) * 100}%`, background: 'linear-gradient(90deg,#4f46e5,#06b6d4)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                                    </div>
                                </div>
                                {report.action_plan.days.map(day => (
                                    <div key={day.day} style={{ marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                            <span style={{ background: '#4f46e5', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.67rem', fontWeight: 700 }}>Day {day.day}</span>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#4f46e5' }}>{day.title}</span>
                                        </div>
                                        {day.tasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => toggleTask(task.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                                                    padding: '8px 10px', marginBottom: '4px', borderRadius: '8px', cursor: 'pointer',
                                                    background: completedTasks.has(task.id) ? 'rgba(16,185,129,0.05)' : '#f8f9fc',
                                                    border: `1px solid ${completedTasks.has(task.id) ? 'rgba(16,185,129,0.2)' : 'rgba(0,0,0,0.05)'}`,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0, marginTop: '2px',
                                                    border: `2px solid ${completedTasks.has(task.id) ? '#10b981' : '#cbd5e1'}`,
                                                    background: completedTasks.has(task.id) ? '#10b981' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', fontSize: '0.6rem', fontWeight: 700,
                                                }}>{completedTasks.has(task.id) && '✓'}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#1e293b', textDecoration: completedTasks.has(task.id) ? 'line-through' : 'none', opacity: completedTasks.has(task.id) ? 0.6 : 1 }}>{task.title}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>{task.description}</div>
                                                    {task.estimated_duration && <span style={{ fontSize: '0.65rem', color: '#06b6d4', marginTop: '2px', display: 'inline-block' }}>⏱ {task.estimated_duration}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subsidies */}
                        {activeTab === 'subsidies' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {report.subsidies.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '0.9rem' }}>No subsidies found for this product/country combination.</div>
                                ) : report.subsidies.map((sub, i) => (
                                    <div key={i} style={{ background: '#f8f9fc', borderRadius: '12px', padding: '12px 14px', borderLeft: '3px solid #10b981' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b', marginBottom: '3px' }}>{sub.name}</div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', marginBottom: '3px' }}>{formatCurrency(sub.amount)}</div>
                                        <div style={{ fontSize: '0.77rem', color: '#64748b', marginBottom: sub.how_to_apply ? '4px' : 0 }}>{sub.eligibility}</div>
                                        {sub.how_to_apply && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>📝 {sub.how_to_apply}</div>}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sources */}
                        {activeTab === 'sources' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {report.retrieved_sources.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px', fontSize: '0.9rem' }}>No sources recorded.</div>
                                ) : report.retrieved_sources.map((source, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9fc', borderRadius: '9px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <div>
                                            <span style={{ fontWeight: 500, fontSize: '0.82rem', color: '#1e293b' }}>{source.title}</span>
                                            {source.source && <span style={{ color: '#94a3b8', marginLeft: '6px', fontSize: '0.75rem' }}>— {source.source}</span>}
                                        </div>
                                        {source.relevance_score && (
                                            <span style={{ color: '#06b6d4', fontWeight: 600, fontSize: '0.72rem', flexShrink: 0 }}>{Math.round(source.relevance_score * 100)}% match</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
