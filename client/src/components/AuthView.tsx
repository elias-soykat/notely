import React, { useState } from 'react';
import { request, setToken } from '../api';

interface AuthViewProps {
  onLoginSuccess: (user: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState('reading, chess');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        const interestList = interests
          .split(',')
          .map((i) => i.trim().toLowerCase())
          .filter(Boolean);
        const data = await request('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name, email, password, interests: interestList }),
        });
        setToken(data.token);
        onLoginSuccess(data.user);
      } else {
        const data = await request('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setToken(data.token);
        onLoginSuccess(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 400, margin: '40px auto' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div>
            <label>Name:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        )}
        <div>
          <label>Email:</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        {isRegister && (
          <div>
            <label>Interests (comma-separated):</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <button type="submit" style={{ width: '100%' }}>
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      </form>
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setError(null);
          }}
          style={{ background: 'transparent', color: '#0066cc', padding: 0 }}
        >
          {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register'}
        </button>
      </div>
    </div>
  );
};
