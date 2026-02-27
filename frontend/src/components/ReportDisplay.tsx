import { useState } from 'react';
import type { ExportReadinessReport, Certification } from '../types';

interface ReportDisplayProps {
    report: ExportReadinessReport;
    onBack: () => void;
    onCertClick?: (cert: Certification) => void;
}

export default function ReportDisplay({ report, onBack, onCertClick }: ReportDisplayProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['hs_code', 'certifications', 'risks', 'action_plan'])
    );
    const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    const toggleTask = (taskId: string) => {
        setCompletedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const riskColor = (score: number) => {
        if (score <= 30) return '#10b981';
        if (score <= 60) return '#f59e0b';
        return '#ef4444';
    };

    const formatCurrency = (amount: number, currency: string = 'INR') => {
        if (currency === 'INR') return `₹${amount.toLocaleString('en-IN')}`;
        return `$${amount.toLocaleString()}`;
    };

    const SectionHeader = ({ id, icon, title, count }: { id: string; icon: string; title: string; count?: number }) => (
        <button
            onClick={() => toggleSection(id)}
            style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text)', fontSize: '1rem', fontWeight: 600, textAlign: 'left',
                fontFamily: 'inherit'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                {title}
                {count !== undefined && (
                    <span style={{
                        background: 'var(--color-primary)', color: 'white',
                        borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700
                    }}>
                        {count}
                    </span>
                )}
            </div>
            <span style={{
                transform: expandedSections.has(id) ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease', fontSize: '0.8rem', color: 'var(--color-text-muted)'
            }}>
                ▼
            </span>
        </button>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <button onClick={onBack} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ← New Query
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px'
                    }}>
                        🚢
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Export Readiness Report</h1>
                </div>
            </div>

            {/* Risk Score Overview */}
            <div className="glass-card animate-fade-in-delay-1" style={{ padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '24px', alignItems: 'center' }}>
                    <div className="risk-score-ring" style={{
                        background: `conic-gradient(${riskColor(report.risk_score)} ${report.risk_score * 3.6}deg, var(--color-bg-secondary) 0deg)`
                    }}>
                        <span className="risk-score-value" style={{ color: riskColor(report.risk_score) }}>
                            {report.risk_score}
                        </span>
                    </div>
                    <div>
                        <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Overall Risk Score</h3>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                <strong style={{ color: 'var(--color-text)' }}>Timeline:</strong> {report.timeline.estimated_days} days
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                <strong style={{ color: 'var(--color-text)' }}>Total Cost:</strong> {formatCurrency(report.costs.total, report.costs.currency)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                <strong style={{ color: 'var(--color-text)' }}>Certifications:</strong> {report.certifications.length}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HS Code Section */}
            <div className="glass-card animate-fade-in-delay-2" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                <SectionHeader id="hs_code" icon="📋" title="HS Code Prediction" />
                {expandedSections.has('hs_code') && (
                    <div style={{ padding: '0 20px 20px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '16px',
                            background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '16px'
                        }}>
                            <div style={{
                                fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-primary-light)',
                                fontFamily: 'monospace'
                            }}>
                                {report.hs_code.code}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{report.hs_code.description}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div className="progress-bar" style={{ width: '120px' }}>
                                        <div className="progress-bar-fill" style={{ width: `${report.hs_code.confidence}%` }} />
                                    </div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                                        {report.hs_code.confidence}% confidence
                                    </span>
                                </div>
                            </div>
                        </div>
                        {report.hs_code.alternatives.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
                                    Alternative codes:
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {report.hs_code.alternatives.map((alt, i) => (
                                        <span key={i} style={{
                                            padding: '4px 10px', borderRadius: '8px',
                                            background: 'var(--color-bg-secondary)', fontSize: '0.8rem',
                                            border: '1px solid var(--color-border-light)',
                                            color: 'var(--color-text-secondary)'
                                        }}>
                                            {alt.code} ({alt.confidence}%)
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Certifications */}
            <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                <SectionHeader id="certifications" icon="✅" title="Required Certifications" count={report.certifications.length} />
                {expandedSections.has('certifications') && (
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {report.certifications.map(cert => (
                            <div
                                key={cert.id}
                                onClick={() => onCertClick?.(cert)}
                                style={{
                                    background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '14px 16px',
                                    border: '1px solid var(--color-border-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    cursor: onCertClick ? 'pointer' : 'default',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={e => { if (onCertClick) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.4)'; (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'; } }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-light)'; (e.currentTarget as HTMLElement).style.background = 'var(--color-bg-secondary)'; }}
                            >
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 600 }}>{cert.name}</span>
                                        <span className={`badge badge-${cert.priority}`}>{cert.priority}</span>
                                        {cert.mandatory && (
                                            <span style={{
                                                fontSize: '0.7rem', background: 'rgba(239,68,68,0.1)',
                                                color: '#f87171', padding: '2px 6px', borderRadius: '4px', fontWeight: 600
                                            }}>
                                                MANDATORY
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {formatCurrency(cert.estimated_cost.min)} - {formatCurrency(cert.estimated_cost.max)} · {cert.estimated_timeline_days} days
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        background: 'rgba(99,102,241,0.15)', color: 'var(--color-primary-light)',
                                        padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700
                                    }}>
                                        {cert.type}
                                    </span>
                                    {onCertClick && (
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>→</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Risks */}
            <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                <SectionHeader id="risks" icon="⚠️" title="Identified Risks" count={report.risks.length} />
                {expandedSections.has('risks') && (
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {report.risks.map((risk, i) => (
                            <div key={i} style={{
                                background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '14px 16px',
                                border: '1px solid var(--color-border-light)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontWeight: 600 }}>{risk.title}</span>
                                    <span className={`badge badge-${risk.severity}`}>{risk.severity}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                                    {risk.description}
                                </p>
                                <div style={{
                                    fontSize: '0.8rem', color: 'var(--color-success)',
                                    background: 'rgba(16,185,129,0.08)', borderRadius: '8px', padding: '8px 12px',
                                    borderLeft: '3px solid var(--color-success)'
                                }}>
                                    <strong>Mitigation:</strong> {risk.mitigation}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Restricted Substances */}
            {report.restricted_substances.length > 0 && (
                <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                    <SectionHeader id="substances" icon="🧪" title="Restricted Substances" count={report.restricted_substances.length} />
                    {expandedSections.has('substances') && (
                        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {report.restricted_substances.map((sub, i) => (
                                <div key={i} style={{
                                    background: 'var(--color-bg-secondary)', borderRadius: '10px', padding: '12px 14px',
                                    border: '1px solid rgba(239,68,68,0.15)'
                                }}>
                                    <strong style={{ color: '#f87171' }}>{sub.name}</strong>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: '4px 0' }}>{sub.reason}</p>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📜 {sub.regulation}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Costs */}
            <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                <SectionHeader id="costs" icon="💰" title="Cost Breakdown" />
                {expandedSections.has('costs') && (
                    <div style={{ padding: '0 20px 20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                            {[
                                { label: 'Certifications', value: report.costs.certifications, color: 'var(--color-primary-light)' },
                                { label: 'Documentation', value: report.costs.documentation, color: 'var(--color-accent)' },
                                { label: 'Logistics', value: report.costs.logistics, color: 'var(--color-warning)' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '16px', textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>{item.label}</div>
                                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: item.color }}>
                                        {formatCurrency(item.value, report.costs.currency)}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.1))',
                            borderRadius: '12px', padding: '16px', textAlign: 'center',
                            border: '1px solid var(--color-border)'
                        }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Total Estimated Cost</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {formatCurrency(report.costs.total, report.costs.currency)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                <SectionHeader id="timeline" icon="⏱️" title={`Timeline — ${report.timeline.estimated_days} days`} />
                {expandedSections.has('timeline') && (
                    <div style={{ padding: '0 20px 20px' }}>
                        {report.timeline.breakdown.map((phase, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'
                            }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'var(--color-bg-secondary)', border: '2px solid var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary-light)', flexShrink: 0
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{phase.phase}</div>
                                </div>
                                <span style={{
                                    fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-accent)',
                                    background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '8px'
                                }}>
                                    {phase.duration_days}d
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Subsidies */}
            {report.subsidies.length > 0 && (
                <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                    <SectionHeader id="subsidies" icon="🏛️" title="Available Subsidies" count={report.subsidies.length} />
                    {expandedSections.has('subsidies') && (
                        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {report.subsidies.map((sub, i) => (
                                <div key={i} style={{
                                    background: 'var(--color-bg-secondary)', borderRadius: '12px', padding: '14px 16px',
                                    borderLeft: '3px solid var(--color-success)'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{sub.name}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '4px' }}>
                                        {formatCurrency(sub.amount)}
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{sub.eligibility}</div>
                                    {sub.how_to_apply && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                            📝 {sub.how_to_apply}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 7-Day Action Plan */}
            <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                <SectionHeader id="action_plan" icon="📅" title="7-Day Action Plan" />
                {expandedSections.has('action_plan') && (
                    <div style={{ padding: '0 20px 20px' }}>
                        {/* Progress */}
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem' }}>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Progress</span>
                                <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>
                                    {completedTasks.size} / {report.action_plan.days.reduce((sum, d) => sum + d.tasks.length, 0)} tasks
                                </span>
                            </div>
                            <div className="progress-bar" style={{ height: '8px' }}>
                                <div className="progress-bar-fill" style={{
                                    width: `${(completedTasks.size / Math.max(1, report.action_plan.days.reduce((s, d) => s + d.tasks.length, 0))) * 100}%`
                                }} />
                            </div>
                        </div>

                        {report.action_plan.days.map(day => (
                            <div key={day.day} style={{ marginBottom: '14px' }}>
                                <div style={{
                                    fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)',
                                    marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                    <span style={{
                                        background: 'var(--color-primary)', color: 'white',
                                        padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem'
                                    }}>
                                        Day {day.day}
                                    </span>
                                    {day.title}
                                </div>
                                {day.tasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => toggleTask(task.id)}
                                        style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                                            padding: '10px 12px', marginBottom: '4px',
                                            background: completedTasks.has(task.id) ? 'rgba(16,185,129,0.05)' : 'var(--color-bg-secondary)',
                                            borderRadius: '8px', cursor: 'pointer',
                                            border: `1px solid ${completedTasks.has(task.id) ? 'rgba(16,185,129,0.2)' : 'var(--color-border-light)'}`,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{
                                            width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                                            border: `2px solid ${completedTasks.has(task.id) ? 'var(--color-success)' : 'var(--color-text-muted)'}`,
                                            background: completedTasks.has(task.id) ? 'var(--color-success)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', fontSize: '0.65rem', fontWeight: 700
                                        }}>
                                            {completedTasks.has(task.id) && '✓'}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 500, fontSize: '0.88rem',
                                                textDecoration: completedTasks.has(task.id) ? 'line-through' : 'none',
                                                opacity: completedTasks.has(task.id) ? 0.6 : 1
                                            }}>
                                                {task.title}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                                {task.description}
                                            </div>
                                            {task.estimated_duration && (
                                                <span style={{
                                                    fontSize: '0.7rem', color: 'var(--color-accent)',
                                                    marginTop: '4px', display: 'inline-block'
                                                }}>
                                                    ⏱ {task.estimated_duration}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sources */}
            {report.retrieved_sources.length > 0 && (
                <div className="glass-card" style={{ marginBottom: '12px', overflow: 'hidden' }}>
                    <SectionHeader id="sources" icon="📚" title="Sources & References" count={report.retrieved_sources.length} />
                    {expandedSections.has('sources') && (
                        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {report.retrieved_sources.map((source, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 12px', background: 'var(--color-bg-secondary)', borderRadius: '8px',
                                    fontSize: '0.82rem'
                                }}>
                                    <div>
                                        <span style={{ fontWeight: 500 }}>{source.title}</span>
                                        {source.source && (
                                            <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>— {source.source}</span>
                                        )}
                                    </div>
                                    {source.relevance_score && (
                                        <span style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.75rem' }}>
                                            {Math.round(source.relevance_score * 100)}% match
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
