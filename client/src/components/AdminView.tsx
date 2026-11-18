import React, { useState, useEffect } from 'react';
import { request } from '../api';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  interests: string[];
  createdAt: string;
}

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [interests, setInterests] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (p = page) => {
    try {
      setError(null);
      const data = await request(`/admin/users?page=${p}&limit=5`);
      setUsers(data.data);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const interestList = interests
        .split(',')
        .map((i) => i.trim().toLowerCase())
        .filter(Boolean);
      await request('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role, interests: interestList }),
      });
      setName('');
      setEmail('');
      setPassword('');
      setInterests('');
      fetchUsers(1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleRole = async (user: UserItem) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await request(`/admin/users/${user._id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user and all their notes/posts?')) return;
    try {
      await request(`/admin/users/${id}`, { method: 'DELETE' });
      fetchUsers(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <h3>Admin: Add New User</h3>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <form onSubmit={handleCreateUser}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="password"
              placeholder="Password (min 6)"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ flex: 1 }}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              placeholder="Interests (comma separated: e.g. chess, reading)"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" style={{ marginTop: 8 }}>
            Create User
          </button>
        </form>
      </div>

      <div className="card">
        <h3>User Management ({totalCount})</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Interests</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'admin' ? 'badge-admin' : ''}`}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td>{u.interests?.join(', ') || '-'}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleToggleRole(u)}>
                    Switch to {u.role === 'admin' ? 'User' : 'Admin'}
                  </button>{' '}
                  <button className="danger" onClick={() => handleDeleteUser(u._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            &laquo; Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};
