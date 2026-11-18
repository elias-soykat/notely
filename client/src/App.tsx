import React, { useState, useEffect } from 'react';
import { getToken, clearToken, request } from './api';
import { AuthView } from './components/AuthView';
import { NotesView } from './components/NotesView';
import { AdminView } from './components/AdminView';
import { AggregationsView } from './components/AggregationsView';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notes' | 'aggregations' | 'admin'>('notes');

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await request('/auth/me');
      setCurrentUser(data.user);
    } catch {
      clearToken();
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading Notely...</div>;
  }

  if (!currentUser) {
    return (
      <div>
        <header style={{ textAlign: 'center', marginBottom: 20 }}>
          <h1>Notely</h1>
          <p>Secure Note-Taking Application with Role-Based Access Control</p>
        </header>
        <AuthView onLoginSuccess={(user) => setCurrentUser(user)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #ccc',
          paddingBottom: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Notely Platform</h2>
          <span style={{ fontSize: 13, color: '#555' }}>
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.email})
          </span>{' '}
          <span className={`badge ${currentUser.role === 'admin' ? 'badge-admin' : ''}`}>
            {currentUser.role.toUpperCase()}
          </span>
        </div>
        <button onClick={handleLogout} style={{ background: '#666' }}>
          Logout
        </button>
      </header>

      <nav className="nav-tabs" style={{ marginBottom: 16 }}>
        <button
          className={activeTab === 'notes' ? 'active' : ''}
          onClick={() => setActiveTab('notes')}
        >
          Notes CRUD
        </button>
        <button
          className={activeTab === 'aggregations' ? 'active' : ''}
          onClick={() => setActiveTab('aggregations')}
        >
          Aggregations & Posts
        </button>
        {currentUser.role === 'admin' && (
          <button
            className={activeTab === 'admin' ? 'active' : ''}
            onClick={() => setActiveTab('admin')}
          >
            Admin User Management
          </button>
        )}
      </nav>

      <main>
        {activeTab === 'notes' && <NotesView currentUser={currentUser} />}
        {activeTab === 'aggregations' && <AggregationsView currentUser={currentUser} />}
        {activeTab === 'admin' && currentUser.role === 'admin' && <AdminView />}
      </main>
    </div>
  );
};
