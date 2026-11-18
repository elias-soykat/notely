import React, { useState, useEffect } from 'react';
import { request } from '../api';

interface Note {
  _id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
}

interface NotesViewProps {
  currentUser: any;
}

export const NotesView: React.FC<NotesViewProps> = ({ currentUser }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = async (p = page) => {
    try {
      setError(null);
      const data = await request(`/notes?page=${p}&limit=5`);
      setNotes(data.data);
      setPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchNotes(page);
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/notes', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      setTitle('');
      setContent('');
      fetchNotes(1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await request(`/notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      setEditingId(null);
      fetchNotes(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await request(`/notes/${id}`, { method: 'DELETE' });
      fetchNotes(page);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="card">
        <h3>Create Note</h3>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <form onSubmit={handleCreate}>
          <div>
            <input
              type="text"
              placeholder="Note title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <textarea
              placeholder="Note content..."
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit">Add Note</button>
        </form>
      </div>

      <div className="card">
        <h3>
          {currentUser.role === 'admin' ? "Everyone's Notes (Admin View)" : 'My Notes'} ({totalCount})
        </h3>
        {notes.length === 0 ? (
          <p>No notes found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Created At</th>
                {currentUser.role === 'admin' && <th>User ID</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => (
                <tr key={note._id}>
                  {editingId === note._id ? (
                    <>
                      <td>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                      </td>
                      <td>{new Date(note.createdAt).toLocaleString()}</td>
                      {currentUser.role === 'admin' && <td>{note.userId}</td>}
                      <td>
                        <button onClick={() => handleUpdate(note._id)}>Save</button>{' '}
                        <button onClick={() => setEditingId(null)} style={{ background: '#777' }}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><strong>{note.title}</strong></td>
                      <td>{note.content}</td>
                      <td>{new Date(note.createdAt).toLocaleString()}</td>
                      {currentUser.role === 'admin' && <td><code>{note.userId}</code></td>}
                      <td>
                        {note.userId === currentUser.id && (
                          <button
                            onClick={() => {
                              setEditingId(note._id);
                              setEditTitle(note.title);
                              setEditContent(note.content);
                            }}
                          >
                            Edit
                          </button>
                        )}{' '}
                        {(note.userId === currentUser.id || currentUser.role === 'admin') && (
                          <button
                            className="danger"
                            onClick={() => handleDelete(note._id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
