import { useState, useEffect } from 'react';
import type { Certification, CertificationGuidance } from '../types';
import { getCertificationGuidance } from '../services/api';

interface Props {
    certification: Certification;
    productType: string;
    destinationCountry: string;
    companySize: string;
    onClose: () => void;
}

export default function CertificationDetailModal({ certification, productType, destinationCountry, companySize, onClose }: Props) {
    const [guidance, setGuidance] = useState<CertificationGuidance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'steps' | 'docs' | 'labs' | 'subsidies' | 'rejections' | 'audit'>('steps');
    const [completedDocs, setCompletedDocs] = useState<Set<string>>(() => {
        const saved = localStorage.getItem(`cert_docs_${certification.id}`);
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        loadGuidance();
    }, [certification.id]);

    async function loadGuidance() {
        setLoading(true);
        setError('');
        try {
            const data = await getCertificationGuidance(
                certification.id, certification.name, certification.type,
                productType, destinationCountry, companySize
            );
            setGuidance(data);
        } catch (e) {
            setError('Failed to load guidance. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function toggleDoc(docId: string) {
        setCompletedDocs(prev => {
            const next = new Set(prev);
            if (next.has(docId)) next.delete(docId); else next.add(docId);
            localStorage.setItem(`cert_docs_${certification.id}`, JSON.stringify([...next]));
            return next;
        });
    }

    const tabs = [
        { key: 'steps', label: '📋 Steps', count: guidance?.steps.length },
        { key: 'docs', label: '📄 Documents', count: guidance?.document_checklist.length },
        { key: 'labs', label: '🧪 Test Labs', count: guidance?.test_labs.length },
        { key: 'subsidies', label: '💰 Subsidies', count: guidance?.subsidies.length },
        { key: 'rejections', label: '⚠️ Rejections', count: guidance?.common_rejection_reasons.length },
        { key: 'audit', label: '🎯 Mock Audit', count: guidance?.mock_audit_questions.length },
    ] as const;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '2rem',
        }} onClick={onClose}>
            <div style={{
                background: 'rgba(20, 20, 45, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                width: '100%', maxWidth: '900px', maxHeight: '85vh',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{
                                padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                                background: certification.mandatory ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                                color: certification.mandatory ? '#f87171' : '#4ade80',
                            }}>{certification.mandatory ? 'MANDATORY' : 'OPTIONAL'}</span>
                            <span style={{
                                padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.75rem',
                                background: 'rgba(99,102,241,0.15)', color: '#a78bfa',
                            }}>{certification.type}</span>
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#e2e8f0', margin: 0 }}>{certification.name}</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            Est. ₹{certification.estimated_cost.min.toLocaleString()} – ₹{certification.estimated_cost.max.toLocaleString()} · {certification.estimated_timeline_days} days
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '8px',
                        color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer',
                        width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{
                    padding: '0 2rem', display: 'flex', gap: '0.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    overflowX: 'auto',
                }}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            style={{
                                padding: '0.75rem 1rem', border: 'none', cursor: 'pointer',
                                background: 'none', fontSize: '0.8rem', whiteSpace: 'nowrap',
                                color: activeTab === t.key ? '#a78bfa' : '#64748b',
                                borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
                                fontWeight: activeTab === t.key ? 600 : 400,
                            }}>
                            {t.label}{t.count != null ? ` (${t.count})` : ''}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', flex: 1 }}>
                    {loading && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'pulse 2s infinite' }}>🔍</div>
                            <p>Generating detailed guidance with AI...</p>
                            <p style={{ fontSize: '0.75rem' }}>This may take 15-30 seconds</p>
                        </div>
                    )}
                    {error && <p style={{ color: '#f87171', textAlign: 'center' }}>{error}</p>}

                    {guidance && !loading && (
                        <>
                            {/* Overview */}
                            {activeTab === 'steps' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{
                                        padding: '1rem', borderRadius: '12px',
                                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                                    }}>
                                        <p style={{ color: '#c4b5fd', fontSize: '0.875rem', margin: 0 }}>{guidance.overview}</p>
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0.5rem 0 0' }}>
                                        Why Required
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{guidance.why_required}</p>

                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: '0.5rem 0 0' }}>
                                        Step-by-Step Process ({guidance.estimated_total_days} days total)
                                    </h3>
                                    {guidance.steps.map((s, i) => (
                                        <div key={i} style={{
                                            padding: '1rem', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                                }}>{s.step_number}</span>
                                                <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{s.title}</span>
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b' }}>~{s.estimated_days} days</span>
                                            </div>
                                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0 0 0.5rem 2.5rem' }}>{s.description}</p>
                                            {s.tips && (
                                                <div style={{ margin: '0 0 0 2.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>💡 {s.tips}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {guidance.consultant_advice && (
                                        <div style={{
                                            padding: '1rem', borderRadius: '12px',
                                            background: 'rgba(251,191,36,0.08)',
                                            border: '1px solid rgba(251,191,36,0.15)',
                                        }}>
                                            <span style={{ fontSize: '0.85rem', color: '#fbbf24' }}>👤 {guidance.consultant_advice}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Document Checklist */}
                            {activeTab === 'docs' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                                            Document Checklist
                                        </h3>
                                        <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>
                                            {completedDocs.size}/{guidance.document_checklist.length} completed
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)',
                                        marginBottom: '0.5rem',
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 2,
                                            background: 'linear-gradient(90deg, #6366f1, #22c55e)',
                                            width: `${guidance.document_checklist.length ? (completedDocs.size / guidance.document_checklist.length * 100) : 0}%`,
                                            transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                    {guidance.document_checklist.map(doc => (
                                        <label key={doc.id} style={{
                                            display: 'flex', gap: '0.75rem', padding: '0.75rem 1rem',
                                            borderRadius: '10px', cursor: 'pointer',
                                            background: completedDocs.has(doc.id) ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${completedDocs.has(doc.id) ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                            transition: 'all 0.2s ease',
                                        }}>
                                            <input type="checkbox" checked={completedDocs.has(doc.id)} onChange={() => toggleDoc(doc.id)}
                                                style={{ accentColor: '#6366f1', width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
                                            <div>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{
                                                        fontWeight: 600, color: completedDocs.has(doc.id) ? '#4ade80' : '#e2e8f0',
                                                        textDecoration: completedDocs.has(doc.id) ? 'line-through' : 'none',
                                                    }}>{doc.name}</span>
                                                    {doc.mandatory && <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>REQUIRED</span>}
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0.25rem 0 0' }}>{doc.description}</p>
                                                <p style={{ fontSize: '0.75rem', color: '#818cf8', margin: '0.25rem 0 0' }}>📁 {doc.where_to_get}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Test Labs */}
                            {activeTab === 'labs' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Approved Test Labs</h3>
                                    {guidance.test_labs.map((lab, i) => (
                                        <div key={i} style={{
                                            padding: '1rem', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}>
                                            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>{lab.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                📍 {lab.location} · 🏅 {lab.accreditation}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                                📞 {lab.contact} · 💰 ₹{lab.estimated_cost_inr.toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Subsidies */}
                            {activeTab === 'subsidies' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Available Subsidies</h3>
                                    {guidance.subsidies.map((s, i) => (
                                        <div key={i} style={{
                                            padding: '1rem', borderRadius: '12px',
                                            background: 'rgba(34,197,94,0.06)',
                                            border: '1px solid rgba(34,197,94,0.15)',
                                        }}>
                                            <div style={{ fontWeight: 600, color: '#4ade80', marginBottom: '0.25rem' }}>{s.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>🏛 {s.provider}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', margin: '0.5rem 0' }}>💰 {s.benefit}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>✅ Eligibility: {s.eligibility}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#818cf8', marginTop: '0.25rem' }}>📝 {s.how_to_apply}</div>
                                            {s.portal_url && <a href={s.portal_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#6366f1' }}>🔗 Apply Portal</a>}
                                        </div>
                                    ))}
                                    {guidance.subsidies.length === 0 && <p style={{ color: '#64748b' }}>No subsidies found for this certification.</p>}
                                </div>
                            )}

                            {/* Common Rejections */}
                            {activeTab === 'rejections' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Common Rejection Reasons</h3>
                                    {guidance.common_rejection_reasons.map((r, i) => (
                                        <div key={i} style={{
                                            padding: '1rem', borderRadius: '12px',
                                            background: 'rgba(239,68,68,0.06)',
                                            border: '1px solid rgba(239,68,68,0.12)',
                                        }}>
                                            <div style={{ fontWeight: 600, color: '#f87171', marginBottom: '0.5rem' }}>⚠️ {r.reason}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#4ade80' }}>✅ {r.how_to_avoid}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Mock Audit Questions */}
                            {activeTab === 'audit' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Mock Audit Questions</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Practice these questions before your certification audit.</p>
                                    {guidance.mock_audit_questions.map((q, i) => (
                                        <details key={i} style={{
                                            padding: '1rem', borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                            cursor: 'pointer',
                                        }}>
                                            <summary style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.9rem' }}>
                                                <span style={{
                                                    fontSize: '0.65rem', padding: '0.1rem 0.5rem', borderRadius: '6px',
                                                    background: 'rgba(99,102,241,0.15)', color: '#a78bfa',
                                                    marginRight: '0.5rem', textTransform: 'uppercase',
                                                }}>{q.category}</span>
                                                {q.question}
                                            </summary>
                                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.12)' }}>
                                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>💬 {q.suggested_answer}</span>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {guidance && !loading && (
                    <div style={{
                        padding: '1rem 2rem',
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Est. cost: ₹{guidance.estimated_total_cost_inr.min.toLocaleString()} – ₹{guidance.estimated_total_cost_inr.max.toLocaleString()} · {guidance.estimated_total_days} days
                        </span>
                        <button onClick={onClose} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
}
