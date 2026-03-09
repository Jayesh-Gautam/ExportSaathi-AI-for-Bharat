import { useState, useEffect } from 'react';
import type { QueryInput, BusinessType, CompanySize } from '../types';

interface QueryFormProps {
    onSubmit: (query: QueryInput) => void;
    isLoading: boolean;
}

const COUNTRIES = [
    'United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia',
    'Japan', 'China', 'South Korea', 'Singapore', 'UAE', 'Saudi Arabia',
    'Netherlands', 'Italy', 'Spain', 'Brazil', 'Mexico', 'South Africa',
    'Nigeria', 'Kenya', 'Thailand', 'Vietnam', 'Indonesia', 'Malaysia',
    'Turkey', 'Russia', 'Poland', 'Sweden', 'Norway', 'Belgium',
];

/* ── Animated Counter Hook ─────────────────────────────────────────── */
function useCounter(target: number, duration = 1200, startDelay = 0) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const timer = setTimeout(() => {
            const start = performance.now();
            const step = (now: number) => {
                const elapsed = now - start;
                const p = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                setCount(Math.floor(eased * target));
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }, startDelay);
        return () => clearTimeout(timer);
    }, [target, duration, startDelay]);
    return count;
}

/* ── Compact Stat Pill ─────────────────────────────────────────────── */
function StatPill({ value, suffix, label, color, delay }: {
    value: number; suffix: string; label: string; color: string; delay: number;
}) {
    const count = useCounter(value, 1200, delay);
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                fontSize: '1.5rem', fontWeight: 800, lineHeight: 1,
                background: `linear-gradient(135deg, ${color}, ${color}99)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{count}{suffix}</div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, marginTop: '2px' }}>{label}</div>
        </div>
    );
}

/* ── Feature Row Item ──────────────────────────────────────────────── */
function FeatureRow({ icon, text, desc, color }: { icon: string; text: string; desc: string; color: string }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'flex-start', gap: '10px',
                padding: '10px 12px', borderRadius: '12px',
                background: hov ? `${color}08` : 'transparent',
                border: `1px solid ${hov ? color + '25' : 'transparent'}`,
                transition: 'all 0.25s ease', cursor: 'default',
            }}
        >
            <div style={{
                width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                background: `linear-gradient(135deg, ${color}20, ${color}0e)`,
                border: `1px solid ${color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
                transform: hov ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
                transition: 'transform 0.25s ease',
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', marginBottom: '1px' }}>{text}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.35 }}>{desc}</div>
            </div>
        </div>
    );
}

/* ── Main Component ────────────────────────────────────────────────── */
export default function QueryForm({ onSubmit, isLoading }: QueryFormProps) {
    const [formData, setFormData] = useState<QueryInput>({
        product_name: '',
        ingredients: '',
        bom: '',
        destination_country: '',
        business_type: 'Manufacturing',
        company_size: 'Micro',
        monthly_volume: undefined,
        price_range: '',
    });

    const [visible, setVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_name || !formData.destination_country) return;
        onSubmit(formData);
    };

    const update = (field: keyof QueryInput, value: string | number) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const inputStyle = (field: string): React.CSSProperties => ({
        width: '100%',
        padding: '9px 12px',
        background: focusedField === field ? '#fafbff' : '#ffffff',
        border: `1.5px solid ${focusedField === field ? '#4f46e5' : '#e2e8f0'}`,
        borderRadius: '10px',
        color: '#1e293b',
        fontFamily: "'Inter', sans-serif",
        fontSize: '0.84rem',
        transition: 'all 0.2s ease',
        outline: 'none',
        boxShadow: focusedField === field ? '0 0 0 3px rgba(99,102,241,0.08)' : 'none',
    });

    const labelStyle: React.CSSProperties = {
        display: 'block', fontSize: '0.74rem', fontWeight: 600,
        color: '#374151', marginBottom: '4px', letterSpacing: '0.02em',
    };

    const selectStyle = (field: string): React.CSSProperties => ({
        ...inputStyle(field),
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12' fill='%2394a3b8'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '32px',
    });

    const canSubmit = !isLoading && formData.product_name && formData.destination_country;

    return (
        <div style={{
            height: 'calc(100vh - 80px)',
            display: 'flex', alignItems: 'center',
            padding: '0 clamp(16px, 3vw, 48px)',
            overflow: 'hidden',
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.05fr',
                gap: 'clamp(24px, 3vw, 56px)',
                width: '100%',
                maxWidth: '1280px',
                margin: '0 auto',
                alignItems: 'center',
            }}>

                {/* ── LEFT PANEL: Brand + Info ───────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: '#10b981', display: 'inline-block',
                            boxShadow: '0 0 8px rgba(16,185,129,0.6)',
                            animation: 'pulseGreen 2s ease-in-out infinite',
                        }} />
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10b981', letterSpacing: '0.06em' }}>
                            AI-POWERED · LIVE
                        </span>
                    </div>

                    {/* Brand heading */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                            <div style={{
                                width: '54px', height: '54px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '26px', flexShrink: 0,
                                boxShadow: '0 8px 28px rgba(79,70,229,0.25)',
                                animation: 'float 4s ease-in-out infinite',
                            }}>🚢</div>
                            <div>
                                <h1 style={{
                                    fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
                                    fontWeight: 900, lineHeight: 1.05,
                                    background: 'linear-gradient(135deg, #0f172a 0%, #4f46e5 55%, #0891b2 100%)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    letterSpacing: '-0.04em', margin: 0,
                                }}>ExportSaathi</h1>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0', fontWeight: 500 }}>
                                    AI Co-Pilot for Indian MSMEs
                                </p>
                            </div>
                        </div>
                        <p style={{
                            color: '#374151', fontSize: 'clamp(0.9rem, 1.4vw, 1.05rem)',
                            lineHeight: 1.6, fontWeight: 500, maxWidth: '460px', margin: 0,
                        }}>
                            Generate a full export readiness report in{' '}
                            <span style={{ color: '#4f46e5', fontWeight: 700 }}>under 30 seconds.</span>{' '}
                            No consultants. No paperwork chaos.
                        </p>
                    </div>

                    {/* Stats row */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '12px', padding: '14px 18px',
                        background: 'rgba(255,255,255,0.85)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '14px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                    }}>
                        <StatPill value={7} suffix="d" label="Export Ready" color="#4f46e5" delay={300} />
                        <StatPill value={30} suffix="s" label="Report Time" color="#0891b2" delay={450} />
                        <StatPill value={50} suffix="+" label="Countries" color="#10b981" delay={600} />
                        <StatPill value={100} suffix="%" label="AI-Powered" color="#f59e0b" delay={750} />
                    </div>

                    {/* Feature rows */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <FeatureRow icon="📋" text="HS Code Prediction" color="#4f46e5"
                            desc="AI-predicted tariff classification with confidence scoring" />
                        <FeatureRow icon="✅" text="Certification Guide" color="#10b981"
                            desc="All mandatory certifications for your destination market" />
                        <FeatureRow icon="📅" text="7-Day Action Plan" color="#0891b2"
                            desc="Day-by-day checklist to start exporting fast" />
                        <FeatureRow icon="💰" text="Cost & Subsidy Breakdown" color="#f59e0b"
                            desc="RoDTEP, ECGC, MEIS schemes with savings estimate" />
                    </div>

                    {/* Trust strip */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['🔒 Secure & Private', '⚡ Gemini AI', '🇮🇳 Made for Bharat', '✅ DGFT / FSSAI'].map(t => (
                            <span key={t} style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '3px 10px', borderRadius: '20px',
                                background: 'rgba(99,102,241,0.06)',
                                border: '1px solid rgba(99,102,241,0.12)',
                                fontSize: '0.68rem', color: '#475569', fontWeight: 500,
                            }}>{t}</span>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT PANEL: Form ──────────────────────────────── */}
                <div style={{
                    background: 'rgba(255,255,255,0.97)',
                    border: '1px solid rgba(99,102,241,0.1)',
                    borderRadius: '24px',
                    padding: 'clamp(20px, 2.5vw, 32px)',
                    boxShadow: '0 20px 60px rgba(99,102,241,0.08), 0 4px 20px rgba(0,0,0,0.04)',
                    backdropFilter: 'blur(12px)',
                }}>
                    {/* Form header */}
                    <div style={{ marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <h2 style={{
                            fontSize: '1rem', fontWeight: 700, margin: 0,
                            display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b',
                        }}>
                            <span style={{
                                width: '30px', height: '30px', borderRadius: '9px',
                                background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(8,145,178,0.08))',
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
                            }}>📦</span>
                            Tell us about your product
                        </h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.74rem', margin: '4px 0 0 38px' }}>
                            Fill in the details to generate your personalized export report.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                        {/* Product Name */}
                        <div>
                            <label style={labelStyle}>
                                Product Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                style={inputStyle('product_name')}
                                type="text"
                                placeholder="e.g., LED Bulb, Organic Turmeric, SaaS Platform"
                                value={formData.product_name}
                                onChange={e => update('product_name', e.target.value)}
                                onFocus={() => setFocusedField('product_name')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                        </div>

                        {/* Row: Country + Business Type */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>
                                    Destination Country <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <select
                                    style={selectStyle('destination_country')}
                                    value={formData.destination_country}
                                    onChange={e => update('destination_country', e.target.value)}
                                    onFocus={() => setFocusedField('destination_country')}
                                    onBlur={() => setFocusedField(null)}
                                    required
                                >
                                    <option value="">Select country</option>
                                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Business Type</label>
                                <select
                                    style={selectStyle('business_type')}
                                    value={formData.business_type}
                                    onChange={e => update('business_type', e.target.value as BusinessType)}
                                    onFocus={() => setFocusedField('business_type')}
                                    onBlur={() => setFocusedField(null)}
                                >
                                    <option value="Manufacturing">🏭 Manufacturing MSME</option>
                                    <option value="SaaS">💻 SaaS / Service</option>
                                    <option value="Merchant">🛒 Merchant Exporter</option>
                                </select>
                            </div>
                        </div>

                        {/* Row: Company Size + Monthly Volume */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={labelStyle}>Company Size</label>
                                <select
                                    style={selectStyle('company_size')}
                                    value={formData.company_size}
                                    onChange={e => update('company_size', e.target.value as CompanySize)}
                                    onFocus={() => setFocusedField('company_size')}
                                    onBlur={() => setFocusedField(null)}
                                >
                                    <option value="Micro">🌱 Micro Enterprise</option>
                                    <option value="Small">🌿 Small Enterprise</option>
                                    <option value="Medium">🌳 Medium Enterprise</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Monthly Volume (units)</label>
                                <input
                                    style={inputStyle('monthly_volume')}
                                    type="number"
                                    placeholder="e.g., 5000"
                                    value={formData.monthly_volume || ''}
                                    onChange={e => update('monthly_volume', Number(e.target.value) || 0)}
                                    onFocus={() => setFocusedField('monthly_volume')}
                                    onBlur={() => setFocusedField(null)}
                                />
                            </div>
                        </div>

                        {/* Ingredients / BOM */}
                        <div>
                            <label style={labelStyle}>
                                Ingredients / Bill of Materials
                                <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '5px' }}>(optional)</span>
                            </label>
                            <textarea
                                style={{ ...inputStyle('ingredients'), resize: 'none', lineHeight: 1.5 }}
                                placeholder="List ingredients or components — helps with HS code prediction & restricted substance checks"
                                value={formData.ingredients || ''}
                                onChange={e => update('ingredients', e.target.value)}
                                onFocus={() => setFocusedField('ingredients')}
                                onBlur={() => setFocusedField(null)}
                                rows={2}
                            />
                        </div>

                        {/* Price Range */}
                        <div>
                            <label style={labelStyle}>
                                Price Range (per unit)
                                <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '5px' }}>(optional)</span>
                            </label>
                            <input
                                style={inputStyle('price_range')}
                                type="text"
                                placeholder="e.g., ₹200–500 or $5–15"
                                value={formData.price_range || ''}
                                onChange={e => update('price_range', e.target.value)}
                                onFocus={() => setFocusedField('price_range')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            style={{
                                width: '100%', marginTop: '4px', padding: '14px',
                                fontSize: '0.92rem', fontWeight: 700,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                borderRadius: '12px', border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
                                background: canSubmit
                                    ? 'linear-gradient(135deg, #4f46e5 0%, #4338ca 50%, #0891b2 100%)'
                                    : '#e2e8f0',
                                color: canSubmit ? 'white' : '#94a3b8',
                                boxShadow: canSubmit ? '0 6px 24px rgba(79,70,229,0.28)' : 'none',
                                transition: 'all 0.25s ease',
                                fontFamily: "'Inter', sans-serif",
                            }}
                            onMouseEnter={e => {
                                if (canSubmit) {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(79,70,229,0.35)';
                                }
                            }}
                            onMouseLeave={e => {
                                if (canSubmit) {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 24px rgba(79,70,229,0.28)';
                                }
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <div style={{
                                        width: '16px', height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white',
                                        borderRadius: '50%', animation: 'spin 0.75s linear infinite',
                                    }} />
                                    Generating Report...
                                </>
                            ) : (
                                <>
                                    🚀 Generate Export Readiness Report
                                    {canSubmit && (
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 500 }}>~30s</span>
                                    )}
                                </>
                            )}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.68rem', color: '#94a3b8', margin: 0 }}>
                            🔒 Your data is never stored or shared · Powered by Google Gemini
                        </p>
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes pulseGreen {
                    0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(16,185,129,0.5); }
                    50% { opacity: 0.7; box-shadow: 0 0 16px rgba(16,185,129,0.9); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                /* Responsive: stack on smaller screens */
                @media (max-width: 900px) {
                    .qf-grid { grid-template-columns: 1fr !important; height: auto !important; overflow: auto !important; }
                }
            `}</style>
        </div>
    );
}
