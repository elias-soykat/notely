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

  // Modal states
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: UserItem;
    targetRole: 'user' | 'admin';
  } | null>(null);
  const [roleChangeError, setRoleChangeError] = useState<string | null>(null);

  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openRoleChangeModal = (user: UserItem) => {
    const targetRole = user.role === 'admin' ? 'user' : 'admin';
    setRoleChangeTarget({ user, targetRole });
    setRoleChangeError(null);
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    try {
      setRoleChangeError(null);
      await request(`/admin/users/${roleChangeTarget.user._id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: roleChangeTarget.targetRole }),
      });
      setRoleChangeTarget(null);
      fetchUsers(page);
    } catch (err: any) {
      setRoleChangeError(err.message);
    }
  };

  const openDeleteModal = (user: UserItem) => {
    setDeletingUser(user);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      setDeleteError(null);
      await request(`/admin/users/${deletingUser._id}`, { method: 'DELETE' });
      setDeletingUser(null);
      fetchUsers(page);
    } catch (err: any) {
      setDeleteError(err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <h3>Admin: Add New User</h3>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <form onSubmit={handleCreateUser}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Name:</label>
              <input
                placeholder="Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Email:</label>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Password:</label>
              <input
                type="password"
                placeholder="Password (min 6)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Role:</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Interests (comma-separated):</label>
            <input
              placeholder="e.g. chess, reading, security"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
            />
          </div>
          <button type="submit">
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
                  <button onClick={() => openRoleChangeModal(u)}>
                    Switch to {u.role === 'admin' ? 'User' : 'Admin'}
                  </button>{' '}
                  <button className="danger" onClick={() => openDeleteModal(u)}>
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

      {/* Switch Role Confirmation Modal */}
      {roleChangeTarget && (
        <div className="modal-overlay" onClick={() => setRoleChangeTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Confirm Role Change</h3>
            {roleChangeError && (
              <div style={{ color: 'red', marginBottom: 8 }}>{roleChangeError}</div>
            )}
            <p>
              Are you sure you want to change <strong>{roleChangeTarget.user.name}</strong> (
              {roleChangeTarget.user.email}) from{' '}
              <span className="badge">{roleChangeTarget.user.role.toUpperCase()}</span> to{' '}
              <span className="badge badge-admin">
                {roleChangeTarget.targetRole.toUpperCase()}
              </span>
              ?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setRoleChangeTarget(null)}
                style={{ background: '#777' }}
              >
                Cancel
              </button>
              <button type="button" onClick={handleConfirmRoleChange}>
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Alert Modal */}
      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#cc0000' }}>Confirm User Deletion</h3>
            {deleteError && (
              <div style={{ color: 'red', marginBottom: 8 }}>{deleteError}</div>
            )}
            <p>
              Are you sure you want to delete user <strong>{deletingUser.name}</strong> (
              {deletingUser.email})?
            </p>
            <p style={{ fontSize: 13, color: '#666' }}>
              Warning: This action will permanently remove the account and cascade delete all
              associated notes and posts. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                style={{ background: '#777' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleConfirmDelete}
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
