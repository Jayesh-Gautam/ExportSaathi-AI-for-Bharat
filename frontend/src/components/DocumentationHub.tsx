import { useState } from 'react';
import { generateDocument, validateDocument } from '../services/api';

const DOC_TYPES = [
    { id: 'commercial_invoice', name: 'Commercial Invoice', icon: '🧾', category: 'shipping', color: '#6366f1' },
    { id: 'packing_list', name: 'Packing List', icon: '📦', category: 'shipping', color: '#06b6d4' },
    { id: 'shipping_bill', name: 'Shipping Bill', icon: '🚢', category: 'customs', color: '#f59e0b' },
    { id: 'gst_lut', name: 'GST LUT', icon: '🏛', category: 'tax', color: '#10b981' },
    { id: 'certificate_of_origin', name: 'Certificate of Origin', icon: '🌍', category: 'trade', color: '#8b5cf6' },
    { id: 'softex', name: 'SOFTEX Form', icon: '💻', category: 'services', color: '#ec4899' },
];

interface DocumentField { field_name: string; field_value: string; section: string; editable: boolean; required: boolean; help_text: string; }
interface GeneratedDoc { doc_type: string; doc_name: string; fields: DocumentField[]; notes: string[]; validation_warnings: { field: string; warning: string; severity: string }[]; generated_at?: string; }
interface ValidationResult { is_valid: boolean; score: number; issues: { field: string; issue: string; severity: string; suggestion: string }[]; rms_risk_flags: { keyword: string; context: string; risk: string }[]; compliance_notes: string[]; }

interface Props {
    reportData?: { product_name: string; hs_code: string; destination_country: string; business_type: string; };
}

export default function DocumentationHub({ reportData }: Props) {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedDoc | null>(null);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [editValues, setEditValues] = useState<Record<string, string>>({});

    async function handleGenerate(docType: string) {
        setSelectedType(docType);
        setLoading(true);
        setGeneratedDoc(null);
        setValidation(null);
        try {
            const data = reportData || { product_name: 'Sample Product', hs_code: '0901.11.00', destination_country: 'United States', business_type: 'Manufacturing' };
            const result = await generateDocument(docType, data);
            const doc = result as unknown as GeneratedDoc;
            setGeneratedDoc(doc);
            const vals: Record<string, string> = {};
            doc.fields?.forEach((f: DocumentField) => { vals[f.field_name] = f.field_value; });
            setEditValues(vals);
        } catch {
            setGeneratedDoc(null);
        } finally {
            setLoading(false);
        }
    }

    async function handleValidate() {
        if (!generatedDoc) return;
        setValidating(true);
        try {
            const fields = generatedDoc.fields.map(f => ({ ...f, field_value: editValues[f.field_name] ?? f.field_value }));
            const result = await validateDocument({ doc_type: generatedDoc.doc_type, fields } as any);
            setValidation(result as unknown as ValidationResult);
        } catch {
            setValidation(null);
        } finally { setValidating(false); }
    }

    const sections = generatedDoc ? [...new Set(generatedDoc.fields.map(f => f.section))] : [];
    const activeDt = DOC_TYPES.find(d => d.id === selectedType);

    return (
        <div className="min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col pt-[16px] px-4 sm:px-8 lg:px-12 pb-10 lg:pb-0">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>📄</span>
                    <div>
                        <h1 style={{
                            fontSize: '1.2rem', fontWeight: 800, margin: 0,
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Smart Documentation</h1>
                        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.74rem' }}>Auto-generate &amp; validate export documents with AI</p>
                    </div>
                </div>
                {generatedDoc && (
                    <button onClick={() => { setGeneratedDoc(null); setValidation(null); setSelectedType(null); }}
                        className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                        ← All Documents
                    </button>
                )}
            </div>

            {/* Split layout */}
            <div className="flex flex-col lg:grid lg:grid-cols-[220px_1fr] gap-[14px] flex-1 pb-[16px] overflow-visible lg:overflow-hidden">

                {/* ── LEFT: Document type list ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                    {DOC_TYPES.map(dt => {
                        const isActive = selectedType === dt.id;
                        return (
                            <button
                                key={dt.id}
                                onClick={() => handleGenerate(dt.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 12px', borderRadius: '12px', cursor: 'pointer',
                                    textAlign: 'left', fontFamily: 'inherit', border: 'none',
                                    background: isActive ? `${dt.color}12` : 'rgba(255,255,255,0.9)',
                                    outline: isActive ? `2px solid ${dt.color}40` : '1px solid rgba(0,0,0,0.06)',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isActive ? `0 4px 16px ${dt.color}15` : '0 2px 6px rgba(0,0,0,0.03)',
                                }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = `${dt.color}08`; e.currentTarget.style.outline = `1px solid ${dt.color}30`; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.9)'; e.currentTarget.style.outline = '1px solid rgba(0,0,0,0.06)'; } }}
                            >
                                <span style={{
                                    width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                                    background: `${dt.color}18`, display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', fontSize: '18px',
                                }}>{dt.icon}</span>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isActive ? dt.color : '#1e293b' }}>{dt.name}</div>
                                    <div style={{
                                        fontSize: '0.62rem', padding: '1px 6px', borderRadius: '6px',
                                        background: `${dt.color}18`, color: dt.color,
                                        textTransform: 'uppercase', display: 'inline-block', marginTop: '2px',
                                    }}>{dt.category}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ── RIGHT: Content panel ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.95)', borderRadius: '18px',
                    border: '1px solid rgba(99,102,241,0.1)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.06)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                    {/* Empty state */}
                    {!loading && !generatedDoc && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#94a3b8', padding: '32px' }}>
                            <div style={{ fontSize: '3rem' }}>📋</div>
                            <p style={{ fontWeight: 600, color: '#475569', margin: 0, fontSize: '1rem' }}>Select a document to generate</p>
                            <p style={{ margin: 0, fontSize: '0.83rem', textAlign: 'center', maxWidth: '280px' }}>
                                Click any document type on the left to auto-generate it with AI
                            </p>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                            <div className="spinner" style={{ width: '40px', height: '40px' }} />
                            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>Generating {activeDt?.name}...</p>
                            <p style={{ color: '#cbd5e1', margin: 0, fontSize: '0.75rem' }}>This may take 10–20 seconds</p>
                        </div>
                    )}

                    {/* Generated document */}
                    {generatedDoc && !loading && (
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
                            {/* Doc header */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                                <div>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 2px' }}>{generatedDoc.doc_name}</h2>
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>
                                        Generated at {new Date(generatedDoc.generated_at || '').toLocaleString()}
                                    </p>
                                </div>
                                <button onClick={handleValidate} className="btn-secondary" disabled={validating}
                                    style={{ padding: '6px 14px', fontSize: '0.8rem', flexShrink: 0 }}>
                                    {validating ? '⏳ Validating...' : '✅ Validate'}
                                </button>
                            </div>

                            {/* Validation results */}
                            {validation && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: '10px', marginBottom: '14px',
                                    background: validation.is_valid ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                                    border: `1px solid ${validation.is_valid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: validation.issues.length > 0 ? '8px' : 0 }}>
                                        <span style={{ fontSize: '1.2rem' }}>{validation.is_valid ? '✅' : '⚠️'}</span>
                                        <span style={{ fontWeight: 700, color: validation.is_valid ? '#059669' : '#ef4444', fontSize: '0.85rem' }}>
                                            Compliance Score: {validation.score}/100
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{validation.issues.length} issue(s)</span>
                                    </div>
                                    {validation.issues.map((issue, i) => (
                                        <div key={i} style={{
                                            padding: '6px 10px', borderRadius: '7px', marginBottom: '4px',
                                            background: issue.severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(251,191,36,0.08)',
                                            fontSize: '0.78rem',
                                        }}>
                                            <span style={{ color: issue.severity === 'high' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{issue.field}: </span>
                                            <span style={{ color: '#94a3b8' }}>{issue.issue}</span>
                                            {issue.suggestion && <div style={{ color: '#059669', marginTop: '2px', fontSize: '0.72rem' }}>💡 {issue.suggestion}</div>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Warnings */}
                            {generatedDoc.validation_warnings?.length > 0 && (
                                <div style={{ padding: '8px 12px', borderRadius: '9px', marginBottom: '12px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)' }}>
                                    {generatedDoc.validation_warnings.map((w, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', color: '#fbbf24', marginBottom: '2px' }}>
                                            ⚠️ <strong>{w.field}:</strong> {w.warning}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Fields by section */}
                            {sections.map(section => (
                                <div key={section} style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        fontSize: '0.67rem', fontWeight: 700, color: '#6366f1',
                                        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px',
                                    }}>{section}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                                        {generatedDoc.fields.filter(f => f.section === section).map((field, i) => (
                                            <div key={i} style={{ padding: '8px 10px', borderRadius: '9px', background: '#f8f9fc', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                                    {field.field_name}{field.required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
                                                </label>
                                                {field.editable ? (
                                                    <input
                                                        type="text"
                                                        value={editValues[field.field_name] ?? field.field_value}
                                                        onChange={e => setEditValues(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                                        style={{
                                                            width: '100%', padding: '5px 8px', borderRadius: '7px',
                                                            background: '#ffffff', border: '1.5px solid #e2e8f0',
                                                            color: '#1e293b', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit',
                                                        }}
                                                    />
                                                ) : (
                                                    <div style={{ fontSize: '0.8rem', color: '#475569', padding: '4px 0' }}>{field.field_value}</div>
                                                )}
                                                {field.help_text && (
                                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '3px' }}>{field.help_text}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* Notes */}
                            {generatedDoc.notes?.length > 0 && (
                                <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6366f1', marginBottom: '6px' }}>📝 Notes</div>
                                    {generatedDoc.notes.map((note, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', color: '#475569', marginBottom: '3px' }}>• {note}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
