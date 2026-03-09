import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/report', label: 'Report', icon: '📋' },
    { path: '/documents', label: 'Docs', icon: '📄' },
    { path: '/finance', label: 'Finance', icon: '💰' },
    { path: '/logistics', label: 'Logistics', icon: '🚢' },
];

export default function Navbar() {
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 20);
            setHidden(y > 120 && y > lastScroll);
            setLastScroll(y);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [lastScroll]);

    // Close mobile menu on route change
    useEffect(() => { setMobileOpen(false); }, [location]);

    return (
        <>
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                background: scrolled
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: scrolled
                    ? '1px solid rgba(99,102,241,0.1)'
                    : '1px solid rgba(99,102,241,0.05)',
                padding: '0 2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: '64px',
                transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
                transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
                boxShadow: scrolled
                    ? '0 1px 24px rgba(99,102,241,0.07), 0 1px 4px rgba(0,0,0,0.03)'
                    : 'none',
            }}>
                {/* Logo */}
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4f46e5, #0891b2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px',
                        boxShadow: '0 2px 12px rgba(79,70,229,0.2)',
                        flexShrink: 0,
                    }}>🚢</div>
                    <div>
                        <span style={{
                            fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em',
                            background: 'linear-gradient(135deg, #1e293b, #4f46e5)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>ExportSaathi</span>
                    </div>
                </Link>

                {/* Desktop nav items */}
                <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    {navItems.map(item => {
                        const active = location.pathname === item.path;
                        const hovered = hoveredItem === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onMouseEnter={() => setHoveredItem(item.path)}
                                onMouseLeave={() => setHoveredItem(null)}
                                style={{
                                    textDecoration: 'none',
                                    padding: '7px 14px',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: active ? 600 : 500,
                                    color: active ? '#4f46e5' : hovered ? '#4f46e5' : '#475569',
                                    background: active
                                        ? 'rgba(79,70,229,0.08)'
                                        : hovered
                                            ? 'rgba(79,70,229,0.05)'
                                            : 'transparent',
                                    transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    position: 'relative',
                                }}
                            >
                                <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                                {item.label}
                                {active && (
                                    <span style={{
                                        position: 'absolute', bottom: '2px', left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '16px', height: '2px', borderRadius: '2px',
                                        background: 'linear-gradient(90deg, #4f46e5, #0891b2)',
                                    }} />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* AI Ready pill */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: '24px',
                        background: 'rgba(5,150,105,0.06)',
                        border: '1px solid rgba(5,150,105,0.12)',
                    }}>
                        <span style={{
                            width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                            display: 'inline-block',
                            boxShadow: '0 0 6px rgba(16,185,129,0.6)',
                            animation: 'pulseGreen 2s ease-in-out infinite',
                        }} />
                        <span style={{ fontSize: '0.73rem', fontWeight: 600, color: '#059669' }}>AI Ready</span>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        style={{
                            display: 'none',
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'rgba(99,102,241,0.08)', border: 'none',
                            cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
                            flexDirection: 'column', gap: '4px',
                            transition: 'all 0.2s ease',
                        }}
                        aria-label="Toggle menu"
                    >
                        {[0, 1, 2].map(i => (
                            <span key={i} style={{
                                display: 'block', width: '16px', height: '2px',
                                background: '#475569', borderRadius: '2px',
                                transition: 'all 0.3s ease',
                                opacity: mobileOpen && i === 1 ? 0 : 1,
                                transform: mobileOpen && i === 0
                                    ? 'rotate(45deg) translateY(6px)'
                                    : mobileOpen && i === 2
                                        ? 'rotate(-45deg) translateY(-6px)'
                                        : 'none',
                            }} />
                        ))}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', top: '64px', left: 0, right: 0, zIndex: 999,
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                    padding: '12px 16px 16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column', gap: '4px',
                    animation: 'slideDown 0.2s ease',
                }}>
                    {navItems.map(item => {
                        const active = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    textDecoration: 'none',
                                    padding: '11px 14px',
                                    borderRadius: '12px',
                                    fontSize: '0.92rem',
                                    fontWeight: active ? 600 : 500,
                                    color: active ? '#4f46e5' : '#374151',
                                    background: active ? 'rgba(79,70,229,0.08)' : 'transparent',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <span>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}

            <style>{`
                @keyframes pulseGreen {
                    0%, 100% { box-shadow: 0 0 6px rgba(16,185,129,0.6); }
                    50% { box-shadow: 0 0 12px rgba(16,185,129,0.9); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 768px) {
                    nav > div:nth-child(2) { display: none !important; }
                    nav button[aria-label="Toggle menu"] { display: flex !important; }
                }
            `}</style>
        </>
    );
}
