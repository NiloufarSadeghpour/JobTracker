// src/components/AuthPage/AuthPage.js
import React, { useState } from 'react';
import './AuthPage.css';
import axios, { tokenStore } from '../utils/axios'; // <-- import tokenStore
import { useNavigate } from 'react-router-dom';

const AuthPage = ({ setUser }) => {   // 👈 accept setUser from App.js 
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(true);
  const [rememberMe, setRememberMe] = useState(false); // <-- new
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  const toggleMode = () => setIsRegistering(!isRegistering);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic client validation BEFORE hitting the API
    if (isRegistering) {
      if (formData.password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
      }
      // (optional) stronger regex if you want:
      // const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      // if (!strong.test(formData.password)) { alert('Use upper, lower, number, symbol.'); return; }
    }

    setSubmitting(true);
    try {
      if (isRegistering) {
        await axios.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        alert('Registration successful! Please login.');
        setIsRegistering(false);
      } else {
        const { data } = await axios.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          rememberMe, // <-- important
        });
        // Save short-lived access token IN MEMORY (not localStorage)
        tokenStore.set(data.accessToken);
        setUser(data.user);
        navigate('/dashboard');
      }
    } catch (err) {
console.error('LOGIN ERROR (raw):', {
  message: err.message,
  code: err.code,
  toJSON: err.toJSON?.(),
  config: err.config,
  response: err.response // will be undefined on true network errors
});      alert(err?.response?.data?.message || err?.message || 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left section */}
        <div className="auth-welcome">
          <h1>Welcome!</h1>
          <p>Sign up to track your job applications and manage your portfolio.</p>
          <img
            src="https://static.vecteezy.com/system/resources/previews/017/221/968/original/business-man-waving-hand-hello-gesture-character-illustration-png.png"
            alt="Welcome"
          />
        </div>

        {/* Right section */}
        <div className="auth-form">
          <div className="auth-toggle">
            <button onClick={() => setIsRegistering(false)} className={!isRegistering ? 'active' : ''}>Login</button>
            <button onClick={() => setIsRegistering(true)} className={isRegistering ? 'active' : ''}>Register</button>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegistering && (
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {!isRegistering && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me on this device
              </label>
            )}

            {isRegistering ? (
              <>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Registering…' : 'Register'}
                </button>
                <p>Already have an account? <span className="switch-link" onClick={toggleMode}>Login</span></p>
              </>
            ) : (
              <>
                <p className="forgot-password">Forgot password?</p>
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? 'Logging in…' : 'Login'}
                </button>
                <p>Don't have an account? <span className="switch-link" onClick={toggleMode}>Register</span></p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
