import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/report', label: 'Report', icon: '📋' },
    { path: '/documents', label: 'Documents', icon: '📄' },
    { path: '/finance', label: 'Finance', icon: '💰' },
    { path: '/logistics', label: 'Logistics', icon: '🚢' },
];

export default function Navbar() {
    const location = useLocation();

    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
            background: 'rgba(15, 15, 35, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '0 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '64px',
        }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚢</span>
                <span style={{
                    fontSize: '1.25rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>ExportSaathi</span>
            </Link>

            <div style={{ display: 'flex', gap: '0.25rem' }}>
                {navItems.map(item => {
                    const active = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                textDecoration: 'none',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: active ? 600 : 400,
                                color: active ? '#a78bfa' : '#94a3b8',
                                background: active ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                                transition: 'all 0.2s ease',
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </div>

            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.4rem 1rem',
                borderRadius: '24px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
            }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>AI Ready</span>
            </div>
        </nav>
    );
}
