// src/components/AuthPage/AuthPage.js
import React, { useState } from 'react';
import './AuthPage.css';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';


const AuthPage = () => {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const toggleMode = () => setIsRegistering(!isRegistering);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  const endpoint = isRegistering ? '/auth/register' : '/auth/login';

  try {
    const res = await axios.post(endpoint, formData);

    if (isRegistering && formData.password.length < 8) {
  alert('Password must be at least 8 characters.');
  return;
}
    if (!isRegistering) {
      // Save token to localStorage
      localStorage.setItem('token', res.data.token);
      // Navigate to dashboard
      navigate('/dashboard');
    } else {
      alert('Registration successful! Please login.');
      setIsRegistering(false);
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Authentication failed.');
    console.error(err);
  }
};

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left section */}
        <div className="auth-welcome">
          <h1>Welcome!</h1>
          <p>Sign up to track your job applications and manage your portfolio.</p>
          <img src="https://static.vecteezy.com/system/resources/previews/017/221/968/original/business-man-waving-hand-hello-gesture-character-illustration-png.png" alt="Welcome" />
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

            {isRegistering ? (
              <>
                <button type="submit" className="submit-btn">Register</button>
                <p>Already have an account? <span className="switch-link" onClick={toggleMode}>Login</span></p>
              </>
            ) : (
              <>
                <p className="forgot-password">Forgot password?</p>
                <button type="submit" className="submit-btn">Login</button>
                <p>Don't have an account? <span className="switch-link" onClick={toggleMode}>Register</span></p>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

/*const logout = () => {
  localStorage.removeItem('token');
  navigate('/');
};*/


export default AuthPage;
