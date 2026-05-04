// ============================================================
// API CLIENT – All AJAX calls to the backend
// ============================================================

const API_BASE = '/api';

const api = {
  _token: () => localStorage.getItem('motogp_token'),

  _headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },

  async _req(method, path, body) {
    const opts = { method, headers: this._headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  // AUTH
  register: (name, username, email, password) =>
    api._req('POST', '/auth/register', { name, username, email, password }),
  login: (username, password) =>
    api._req('POST', '/auth/login', { username, password }),
  getMe: () => api._req('GET', '/auth/me'),

  // POSTS
  getPosts:   (page = 1) => api._req('GET', `/posts?page=${page}&limit=10`),
  createPost: (content)  => api._req('POST', '/posts', { content }),
  deletePost: (id)        => api._req('DELETE', `/posts/${id}`),
  votePost:   (id, type) => api._req('POST', `/posts/${id}/vote`, { type }),

  // COMMENTS
  getComments:   (postId)           => api._req('GET',    `/posts/${postId}/comments`),
  addComment:    (postId, content)  => api._req('POST',   `/posts/${postId}/comments`, { content }),
  deleteComment: (postId, cid)      => api._req('DELETE', `/posts/${postId}/comments/${cid}`),

  // ADMIN
  getPendingPosts: ()   => api._req('GET',    '/posts/admin/pending'),
  approvePost:    (id)  => api._req('PATCH',  `/posts/admin/${id}/approve`),
  rejectPost:     (id)  => api._req('DELETE', `/posts/admin/${id}/reject`),

  // USERS
  getDrivers:  ()         => api._req('GET',   '/users/drivers'),
  getUser:     (username) => api._req('GET',   `/users/${username}`),
  getUserPosts:(username) => api._req('GET',   `/users/${username}/posts`),
  followUser:  (username) => api._req('POST',  `/users/${username}/follow`),
  updateBio:   (bio)      => api._req('PATCH', '/users/me/bio', { bio }),
};
