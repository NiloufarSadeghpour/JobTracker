import React, { useMemo, useState } from 'react';
import './AuthPage.css';
import axios, { tokenStore } from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import welcomeMan from '../images/Welcome-Man.png';



export default function AuthPage({ setUser }) {
const navigate = useNavigate();
const [mode, setMode] = useState('register'); 
const [rememberMe, setRememberMe] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState('');


const [form, setForm] = useState({
name: '',
email: '',
password: '',
});


const isRegistering = mode === 'register';


const title = useMemo(
() => (isRegistering ? 'Create your account' : 'Welcome back'),
[isRegistering]
);


const handleChange = (e) => {
const { name, value, type, checked } = e.target;
if (type === 'checkbox') return setRememberMe(checked);
setForm((f) => ({ ...f, [name]: value }));
};


const validate = () => {
if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
return 'Please enter a valid email address.';
}
if (!form.password || form.password.length < 8) {
return 'Password must be at least 8 characters.';
}
if (isRegistering && !form.name.trim()) {
return 'Please enter your name.';
}
return '';
};


const onSubmit = async (e) => {
e.preventDefault();
const problem = validate();
if (problem) {
setError(problem);
return;
}


setSubmitting(true);
setError('');
try {
if (isRegistering) {
await axios.post('/auth/register', {
name: form.name.trim(),
email: form.email.trim(),
password: form.password,
});
setMode('login');
} else {
const { data } = await axios.post('/auth/login', {
email: form.email.trim(),
password: form.password,
rememberMe,
});
tokenStore.set(data.accessToken);
setUser(data.user);
navigate(data.user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
}
} catch (err) {
  const msg = err?.response?.data?.message || err?.message || 'Authentication failed.';
setError(msg);
console.error('AUTH ERROR:', err);
} finally {
setSubmitting(false);
}
};


return (
<main className="auth-shell">
<section className="auth-card">
  <aside className="auth-brand">
<div className="brand-wrap">
<h1 className="brand-title">JobTracker</h1>
<p className="brand-sub">Track applications, build a portfolio, and stay organised.</p>
<div className="hero-illustration">
<img
className="hero-img"
alt="WelcomeMan"
src={welcomeMan} 
/>
<div className="hero-glow" aria-hidden="true"/>
</div>
</div>
</aside>

<section className="auth-panel">
<div className="panel-head">
<div role="tablist" aria-label="Authentication tabs" className="tabs">
<button
role="tab"
aria-selected={!isRegistering}
className={`tab ${!isRegistering ? 'active' : ''}`}
onClick={() => setMode('login')}
type="button"
>
Login
</button>
<button
role="tab"
aria-selected={isRegistering}
className={`tab ${isRegistering ? 'active' : ''}`}
onClick={() => setMode('register')}
type="button"
>
Register
</button>
</div>
<h2 className="panel-title">{title}</h2>
<p className="panel-sub">Use your email and password. We respect your privacy—no spam.</p>
</div>

{error && (
<div className="alert" role="alert">
{error}
</div>
)}

<form className="auth-form" onSubmit={onSubmit} noValidate>
{isRegistering && (
<div className="field">
<label htmlFor="name">Name</label>
<input
id="name"
name="name"
type="text"
autoComplete="name"
placeholder="Your full name"
value={form.name}
onChange={handleChange}
disabled={submitting}
required
/>
</div>
)}

<div className="field">
<label htmlFor="email">Email</label>
<input
id="email"
name="email"
type="email"
autoComplete="email"
placeholder="you@example.com"
value={form.email}
onChange={handleChange}
disabled={submitting}
required
/>
</div>

<div className="field">
<label htmlFor="password">Password</label>
<input
id="password"
name="password"
type="password"
autoComplete={isRegistering ? 'new-password' : 'current-password'}
placeholder={isRegistering ? 'Create a strong password' : 'Your password'}
value={form.password}
onChange={handleChange}
disabled={submitting}
required
/>
<small className="hint">Minimum 8 characters</small>
</div>

{!isRegistering && (
<div className="row between">
<label className="checkbox">
<input
type="checkbox"
checked={rememberMe}
onChange={handleChange}
/>
Remember me on this device
</label>
<button type="button" className="link">Forgot password?</button>
</div>
)}

<button className="cta" type="submit" disabled={submitting}>
{submitting ? (isRegistering ? 'Creating account…' : 'Signing in…') : (isRegistering ? 'Create account' : 'Sign in')}
</button>

<p className="swap">
{isRegistering ? (
<>Already have an account?{' '}<button type="button" className="link" onClick={() => setMode('login')}>Login</button></>
) : (
<>Don’t have an account?{' '}<button type="button" className="link" onClick={() => setMode('register')}>Register</button></>
)}
</p>
</form>
</section>
</section>
</main>
);
}