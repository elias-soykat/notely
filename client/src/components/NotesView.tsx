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
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    try {
      setEditError(null);
      await request(`/notes/${editingNote._id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      setEditingNote(null);
      fetchNotes(page);
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  const openDeleteModal = (note: Note) => {
    setDeletingNote(note);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    try {
      setDeleteError(null);
      await request(`/notes/${deletingNote._id}`, { method: 'DELETE' });
      setDeletingNote(null);
      fetchNotes(page);
    } catch (err: any) {
      setDeleteError(err.message);
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
                  <td><strong>{note.title}</strong></td>
                  <td>{note.content}</td>
                  <td>{new Date(note.createdAt).toLocaleString()}</td>
                  {currentUser.role === 'admin' && <td><code>{note.userId}</code></td>}
                  <td>
                    {note.userId === currentUser.id && (
                      <button onClick={() => openEditModal(note)}>
                        Edit
                      </button>
                    )}{' '}
                    {(note.userId === currentUser.id || currentUser.role === 'admin') && (
                      <button
                        className="danger"
                        onClick={() => openDeleteModal(note)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
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

      {/* Edit Note Modal */}
      {editingNote && (
        <div className="modal-overlay" onClick={() => setEditingNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Edit Note</h3>
            {editError && <div style={{ color: 'red', marginBottom: 8 }}>{editError}</div>}
            <form onSubmit={handleSaveEdit}>
              <div>
                <label><strong>Title:</strong></label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginTop: 10 }}>
                <label><strong>Content:</strong></label>
                <textarea
                  required
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  style={{ background: '#777' }}
                >
                  Cancel
                </button>
                <button type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deletingNote && (
        <div className="modal-overlay" onClick={() => setDeletingNote(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, color: '#cc0000' }}>Confirm Deletion</h3>
            {deleteError && <div style={{ color: 'red', marginBottom: 8 }}>{deleteError}</div>}
            <p>
              Are you sure you want to delete the note <strong>"{deletingNote.title}"</strong>?
            </p>
            <p style={{ fontSize: 13, color: '#666' }}>
              This action is permanent and cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                style={{ background: '#777' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleConfirmDelete}
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
