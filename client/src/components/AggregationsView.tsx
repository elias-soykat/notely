import React, { useState, useEffect } from 'react';
import { request } from '../api';

export const AggregationsView: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const [interestGroups, setInterestGroups] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState(currentUser.id || '');
  const [userPostsResult, setUserPostsResult] = useState<any | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [postPage, setPostPage] = useState(1);

  const fetchInterestsAggregation = async () => {
    try {
      setError(null);
      const data = await request('/aggregations/users-by-interests');
      setInterestGroups(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUserPosts = async (userId = targetUserId, p = postPage) => {
    if (!userId) return;
    try {
      setError(null);
      const data = await request(`/users/${userId}/posts?page=${p}&limit=5`);
      setUserPostsResult(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchInterestsAggregation();
    if (targetUserId) {
      fetchUserPosts(targetUserId, postPage);
    }
  }, [postPage]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/posts', {
        method: 'POST',
        body: JSON.stringify({ title: postTitle, content: postContent }),
      });
      setPostTitle('');
      setPostContent('');
      fetchUserPosts(targetUserId, 1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      {error && <div className="card" style={{ color: 'red' }}>{error}</div>}

      <div className="card">
        <h3>Scenario 1: Users Grouped by Interests (Single Pipeline)</h3>
        <p style={{ color: '#666', fontSize: 13 }}>
          Computed via single <code>User.aggregate()</code> pipeline using <code>$unwind</code> &rarr; <code>$group</code> &rarr; <code>$sort</code>.
        </p>
        <button type="button" className="btn-secondary" onClick={fetchInterestsAggregation}>Refresh Interests</button>
        {interestGroups.length === 0 ? (
          <p>No interest groups found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Interest</th>
                <th>Count</th>
                <th>Users</th>
              </tr>
            </thead>
            <tbody>
              {interestGroups.map((g) => (
                <tr key={g._id}>
                  <td><strong>{g._id}</strong></td>
                  <td><span className="badge">{g.count}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {g.users.map((u: any) => (
                        <button
                          key={u._id}
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setTargetUserId(u._id);
                            fetchUserPosts(u._id, 1);
                          }}
                          style={{
                            fontSize: 12,
                            padding: '4px 8px',
                          }}
                        >
                          {u.name} ({u.email})
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Create Public Post</h3>
        <form onSubmit={handleCreatePost}>
          <div>
            <input
              placeholder="Post title"
              required
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <textarea
              placeholder="Post content..."
              required
              rows={2}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit">Publish Post</button>
        </form>
      </div>

      <div className="card">
        <h3>Scenario 2: User Posts ($lookup Pipeline)</h3>
        <p style={{ color: '#666', fontSize: 13 }}>
          Computed via single <code>User.aggregate()</code> pipeline with <code>$match: &#123; _id: userId &#125;</code> and <code>$lookup</code> sub-pipeline with internal sorting and pagination.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <input
            placeholder="Enter User ObjectId"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="button" onClick={() => fetchUserPosts(targetUserId, 1)}>Fetch User Posts</button>
        </div>

        {userPostsResult && (
          <div>
            <h4>
              Author: {userPostsResult.name} ({userPostsResult.email}) - {userPostsResult.posts?.length || 0} posts shown
            </h4>
            {userPostsResult.posts?.length === 0 ? (
              <p>No posts written by this user yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Content</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {userPostsResult.posts.map((p: any) => (
                    <tr key={p._id}>
                      <td><strong>{p.title}</strong></td>
                      <td>{p.content}</td>
                      <td>{new Date(p.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="pagination">
              <button disabled={postPage <= 1} onClick={() => setPostPage((p) => Math.max(1, p - 1))}>
                &laquo; Prev
              </button>
              <span>Page {postPage}</span>
              <button onClick={() => setPostPage((p) => p + 1)}>
                Next &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
