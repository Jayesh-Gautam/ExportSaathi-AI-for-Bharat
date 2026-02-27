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

interface DocumentField {
    field_name: string;
    field_value: string;
    section: string;
    editable: boolean;
    required: boolean;
    help_text: string;
}

interface GeneratedDoc {
    doc_type: string;
    doc_name: string;
    fields: DocumentField[];
    notes: string[];
    validation_warnings: { field: string; warning: string; severity: string }[];
    generated_at?: string;
}

interface ValidationResult {
    is_valid: boolean;
    score: number;
    issues: { field: string; issue: string; severity: string; suggestion: string }[];
    rms_risk_flags: { keyword: string; context: string; risk: string }[];
    compliance_notes: string[];
}

interface Props {
    reportData?: {
        product_name: string;
        hs_code: string;
        destination_country: string;
        business_type: string;
    };
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
            const data = reportData || {
                product_name: 'Sample Product', hs_code: '0901.11.00',
                destination_country: 'United States', business_type: 'Manufacturing',
            };
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
            const fields = generatedDoc.fields.map(f => ({
                ...f, field_value: editValues[f.field_name] ?? f.field_value,
            }));
            const result = await validateDocument({ doc_type: generatedDoc.doc_type, fields } as any);
            setValidation(result as unknown as ValidationResult);
        } catch {
            setValidation(null);
        } finally {
            setValidating(false);
        }
    }

    const sections = generatedDoc ? [...new Set(generatedDoc.fields.map(f => f.section))] : [];

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{
                    fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Smart Documentation</h1>
                <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Auto-generate export documents with AI validation</p>
            </div>

            {/* Document Type Selector */}
            {!generatedDoc && !loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {DOC_TYPES.map(dt => (
                        <button key={dt.id} onClick={() => handleGenerate(dt.id)} style={{
                            padding: '1.5rem', borderRadius: '16px', cursor: 'pointer', textAlign: 'left',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            color: '#e2e8f0',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = dt.color; e.currentTarget.style.background = `${dt.color}10`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                            <span style={{ fontSize: '2rem' }}>{dt.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{dt.name}</span>
                            <span style={{
                                fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '8px',
                                background: `${dt.color}20`, color: dt.color, textTransform: 'uppercase',
                                alignSelf: 'flex-start',
                            }}>{dt.category}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                    <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
                    <p>Generating {DOC_TYPES.find(d => d.id === selectedType)?.name}...</p>
                    <p style={{ fontSize: '0.8rem' }}>This may take 10-20 seconds</p>
                </div>
            )}

            {/* Generated Document */}
            {generatedDoc && !loading && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>
                                {generatedDoc.doc_name}
                            </h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Generated at {new Date(generatedDoc.generated_at || '').toLocaleString()}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={handleValidate} className="btn-secondary" disabled={validating}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                {validating ? '⏳ Validating...' : '✅ Validate'}
                            </button>
                            <button onClick={() => { setGeneratedDoc(null); setValidation(null); setSelectedType(null); }}
                                className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                ← Back
                            </button>
                        </div>
                    </div>

                    {/* Validation Results */}
                    {validation && (
                        <div style={{
                            padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem',
                            background: validation.is_valid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                            border: `1px solid ${validation.is_valid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{validation.is_valid ? '✅' : '⚠️'}</span>
                                <div>
                                    <span style={{ fontWeight: 700, color: validation.is_valid ? '#4ade80' : '#f87171' }}>
                                        Compliance Score: {validation.score}/100
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
                                        {validation.issues.length} issue(s) found
                                    </span>
                                </div>
                            </div>
                            {validation.issues.map((issue, i) => (
                                <div key={i} style={{
                                    padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.5rem',
                                    background: issue.severity === 'high' ? 'rgba(239,68,68,0.1)' : 'rgba(251,191,36,0.1)',
                                    fontSize: '0.85rem',
                                }}>
                                    <span style={{ color: issue.severity === 'high' ? '#f87171' : '#fbbf24', fontWeight: 600 }}>
                                        {issue.field}:
                                    </span>{' '}
                                    <span style={{ color: '#94a3b8' }}>{issue.issue}</span>
                                    {issue.suggestion && (
                                        <div style={{ fontSize: '0.8rem', color: '#4ade80', marginTop: '0.25rem' }}>💡 {issue.suggestion}</div>
                                    )}
                                </div>
                            ))}
                            {validation.rms_risk_flags.length > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <span style={{ fontWeight: 600, color: '#f87171', fontSize: '0.85rem' }}>🚨 RMS Risk Flags:</span>
                                    {validation.rms_risk_flags.map((flag, i) => (
                                        <div key={i} style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '0.25rem', paddingLeft: '1rem' }}>
                                            <strong>"{flag.keyword}"</strong> — {flag.risk}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Warnings */}
                    {generatedDoc.validation_warnings?.length > 0 && (
                        <div style={{
                            padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem',
                            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
                        }}>
                            {generatedDoc.validation_warnings.map((w, i) => (
                                <div key={i} style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '0.25rem' }}>
                                    ⚠️ <strong>{w.field}:</strong> {w.warning}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Document Fields by Section */}
                    {sections.map(section => (
                        <div key={section} style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                                fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa',
                                textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem',
                            }}>
                                {section}
                            </h3>
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem',
                            }}>
                                {generatedDoc.fields.filter(f => f.section === section).map((field, i) => (
                                    <div key={i} style={{
                                        padding: '0.75rem 1rem', borderRadius: '10px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                                                {field.field_name}
                                                {field.required && <span style={{ color: '#f87171', marginLeft: '0.25rem' }}>*</span>}
                                            </label>
                                        </div>
                                        {field.editable ? (
                                            <input
                                                type="text"
                                                value={editValues[field.field_name] ?? field.field_value}
                                                onChange={e => setEditValues(prev => ({ ...prev, [field.field_name]: e.target.value }))}
                                                style={{
                                                    width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px',
                                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#e2e8f0', fontSize: '0.85rem', outline: 'none',
                                                    fontFamily: 'inherit',
                                                }}
                                            />
                                        ) : (
                                            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#94a3b8' }}>
                                                {field.field_value}
                                            </div>
                                        )}
                                        {field.help_text && (
                                            <div style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: '0.25rem' }}>
                                                {field.help_text}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Notes */}
                    {generatedDoc.notes?.length > 0 && (
                        <div style={{
                            padding: '1rem', borderRadius: '12px', marginTop: '1rem',
                            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
                        }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a78bfa', marginBottom: '0.5rem' }}>📝 Notes</h4>
                            {generatedDoc.notes.map((note, i) => (
                                <div key={i} style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>• {note}</div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
