import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logoImage from '../../assets/norton_logo.png';
import praxisLogo from '../../assets/praxis_logo.png';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showMaintenance, setShowMaintenance] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(username, password);
            if (result?.success) {
                navigate('/dashboard', { replace: true });
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError(err.message || 'Invalid username or password');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (showMaintenance) {
        return (
            <div className="login-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1.5rem', padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#333', margin: 0 }}>Website under maintenance</h2>
                <p style={{ color: '#666', margin: 0 }}>Please check back later.</p>
                <button
                    type="button"
                    onClick={() => setShowMaintenance(false)}
                    className="login-submit-btn"
                    style={{ marginTop: '0.5rem' }}
                >
                    Back
                </button>
            </div>
        );
    }

    return (
        <div className="login-page">
            {/* Full-page loading overlay */}
            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(2px)'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '32px 48px',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                    }}>
                        <div className="loading-spinner" style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid #e5e7eb',
                            borderTopColor: '#2563eb',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: 0
                        }}></div>
                        <p style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 500,
                            color: '#1e293b',
                            fontFamily: 'Nunito, sans-serif'
                        }}>Logging in...</p>
                    </div>
                </div>
            )}
            <div className="login-main">
                {/* Left: Blue panel - portal intro & support */}
                <div className="login-promo">
                    <div className="login-promo-content">
                        <header className="login-promo-header">
                            <h2 className="login-promo-title">Welcome to the School Management Portal</h2>
                            <p className="login-promo-subtitle">
                                Manage your school operations in one place fast, simple, and secure.
                            </p>
                        </header>
                        <div className="login-promo-card-block">
                            <h3 className="login-promo-section-title">What you can do</h3>
                            <ul className="login-promo-list">
                                <li><span className="login-promo-check" aria-hidden>✓</span> Student admissions & records</li>
                                <li><span className="login-promo-check" aria-hidden>✓</span> Attendance, timetables & class management</li>
                                <li><span className="login-promo-check" aria-hidden>✓</span> Fees, invoices & receipts</li>
                                <li><span className="login-promo-check" aria-hidden>✓</span> Results, reports & performance tracking</li>
                            </ul>
                        </div>
                        <div className="login-promo-card-block login-promo-help">
                            <h3 className="login-promo-section-title">Need help?</h3>
                            <div className="login-promo-help-grid">
                                <span className="login-promo-label">Support</span>
                                <a href="mailto:support@praxiszim.co.zw" className="login-promo-link">support@praxiszim.co.zw</a>
                                <span className="login-promo-label">Call / WhatsApp</span>
                                <a href="tel:+263771472707" className="login-promo-link">+263 77 147 2707</a>
                                <span className="login-promo-label">Hours</span>
                                <span className="login-promo-muted">Mon–Fri, 08:00–17:00</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="login-promo-dev-link"
                            onClick={() => setShowMaintenance(true)}
                        >
                            Developed by Praxis — visit our website
                        </button>
                    </div>
                </div>

                {/* Right: Login form panel (white) */}
                <div className="login-form-panel">
                    <div className="login-form-panel-inner">
                        <div className="login-form-panel-logo">
                            <img src={logoImage} alt="Norton Adventist" className="login-form-panel-logo-img" />
                        </div>
                        <h2 className="login-form-greeting">Welcome back, good to see you again!</h2>
                        <form className="login-form" onSubmit={handleSubmit}>
                            {error && (
                                <div className="login-error-message">{error}</div>
                            )}
                            <div className="form-field">
                                <label htmlFor="username" className="form-label">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    className="login-input"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                                    required
                                    disabled={loading}
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="login-input"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    required
                                    disabled={loading}
                                    placeholder="Enter your password"
                                />
                            </div>
                            <button
                                type="submit"
                                className="login-submit-btn"
                                disabled={loading}
                                style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {loading && (
                                    <div className="login-spinner" style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderTopColor: '#ffffff',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite'
                                    }}></div>
                                )}
                                {loading ? 'Logging in...' : 'Log In'}
                            </button>
                            <div className="register-link-container">
                                <span className="register-text">Don't have an account? </span>
                                <a href="#" className="register-link">Sign up now</a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer: dark bar */}
            <footer className="login-footer-bar">
                <div className="login-footer-logo">
                    <img src={praxisLogo} alt="Praxis" className="login-footer-logo-img" />
                </div>
                <p className="login-footer-credits">
                    © All rights reserved by Praxis Systems 2025
                </p>
            </footer>
        </div>
    );
};

export default Login;
