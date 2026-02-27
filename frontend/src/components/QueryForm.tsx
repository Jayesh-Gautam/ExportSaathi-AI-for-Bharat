import { useState } from 'react';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.product_name || !formData.destination_country) return;
        onSubmit(formData);
    };

    const update = (field: keyof QueryInput, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '12px',
                    marginBottom: '16px'
                }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        🚢
                    </div>
                    <h1 style={{
                        fontSize: '2.2rem', fontWeight: 800,
                        background: 'linear-gradient(135deg, #fff 0%, var(--color-primary-light) 50%, var(--color-accent) 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em'
                    }}>
                        ExportSaathi
                    </h1>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
                    AI-Powered Export Compliance Co-Pilot for Indian MSMEs.
                    <br />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        Start exporting within 7 days — no expensive consultants needed.
                    </span>
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '32px' }}>
                <h2 style={{
                    fontSize: '1.15rem', fontWeight: 700, marginBottom: '24px',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{ color: 'var(--color-primary-light)' }}>📦</span>
                    Tell us about your product
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Product Name */}
                    <div>
                        <label className="label">Product Name *</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="e.g., LED Bulb, Organic Turmeric Powder, SaaS Analytics Platform"
                            value={formData.product_name}
                            onChange={e => update('product_name', e.target.value)}
                            required
                        />
                    </div>

                    {/* Two columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Destination Country *</label>
                            <select
                                className="input-field"
                                value={formData.destination_country}
                                onChange={e => update('destination_country', e.target.value)}
                                required
                            >
                                <option value="">Select country</option>
                                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Business Type *</label>
                            <select
                                className="input-field"
                                value={formData.business_type}
                                onChange={e => update('business_type', e.target.value as BusinessType)}
                            >
                                <option value="Manufacturing">Manufacturing MSME</option>
                                <option value="SaaS">SaaS / Service Exporter</option>
                                <option value="Merchant">Merchant Exporter</option>
                            </select>
                        </div>
                    </div>

                    {/* Two columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="label">Company Size</label>
                            <select
                                className="input-field"
                                value={formData.company_size}
                                onChange={e => update('company_size', e.target.value as CompanySize)}
                            >
                                <option value="Micro">Micro Enterprise</option>
                                <option value="Small">Small Enterprise</option>
                                <option value="Medium">Medium Enterprise</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Monthly Volume (units)</label>
                            <input
                                className="input-field"
                                type="number"
                                placeholder="e.g., 5000"
                                value={formData.monthly_volume || ''}
                                onChange={e => update('monthly_volume', Number(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Ingredients / BOM */}
                    <div>
                        <label className="label">Ingredients / Bill of Materials</label>
                        <textarea
                            className="input-field"
                            placeholder="List your product ingredients or components (helps with HS code prediction and restricted substance checks)"
                            value={formData.ingredients || ''}
                            onChange={e => update('ingredients', e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="label">Price Range (per unit)</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="e.g., ₹200-500 or $5-15"
                            value={formData.price_range || ''}
                            onChange={e => update('price_range', e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isLoading || !formData.product_name || !formData.destination_country}
                        style={{
                            width: '100%', marginTop: '8px', padding: '16px',
                            fontSize: '1rem', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', gap: '10px'
                        }}
                    >
                        {isLoading ? (
                            <>
                                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                                Generating Export Readiness Report...
                            </>
                        ) : (
                            <>
                                🚀 Generate Export Readiness Report
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Info Cards */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
                marginTop: '24px'
            }}>
                {[
                    { icon: '📋', text: 'HS Code Prediction' },
                    { icon: '✅', text: 'Certification Guide' },
                    { icon: '📅', text: '7-Day Action Plan' },
                ].map((item, i) => (
                    <div
                        key={i}
                        className={`animate-fade-in-delay-${i + 1}`}
                        style={{
                            background: 'var(--color-bg-secondary)', borderRadius: '12px',
                            padding: '14px', textAlign: 'center',
                            border: '1px solid var(--color-border-light)',
                            fontSize: '0.85rem', color: 'var(--color-text-secondary)'
                        }}
                    >
                        <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '6px' }}>{item.icon}</span>
                        {item.text}
                    </div>
                ))}
            </div>
        </div>
    );
}
