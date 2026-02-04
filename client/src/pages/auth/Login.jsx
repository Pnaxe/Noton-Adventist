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

    return (
        <div className="login-page">
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
                        <a href="https://praxis.co.zw" target="_blank" rel="noopener noreferrer" className="login-promo-dev-link">
                            Developed by Praxis — visit our website
                        </a>
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
                                style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                            >
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
