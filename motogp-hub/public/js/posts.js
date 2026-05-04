// ============================================================
// POSTS MODULE – Feed, create, vote, comments
// ============================================================

const Posts = (() => {
  let page = 1;
  let hasMore = false;
  let currentCommentPostId = null;

  function timeAgo(date) {
    const d = new Date(date);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function renderPost(post) {
    const user = Auth.getUser();
    const isAdmin = user && user.role === 'admin';
    const isDriver = post.authorRole === 'driver';

    const card = document.createElement('div');
    card.className = 'post-card' + (isDriver ? ' driver-post' : '');
    card.dataset.id = post._id;

    const likeClass = post.userVote === 'like' ? ' liked' : '';
    const dislikeClass = post.userVote === 'dislike' ? ' disliked' : '';

    card.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          <div class="avatar-mini" style="background:${post.authorAvatarColor}">${post.authorAvatar}</div>
          <div class="post-author-info">
            <div class="post-author-name" data-username="${post.username}">${post.authorName}</div>
            <div class="post-author-meta">
              @${post.username}
              ${isDriver ? '<span class="driver-badge">🏍 Driver</span>' : ''}
              <span>· ${timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="post-content">${escapeHtml(post.content)}</div>
      <div class="post-actions">
        <button class="action-btn like-btn${likeClass}" data-id="${post._id}" data-type="like">
          👍 <span class="like-count">${post.likes || 0}</span>
        </button>
        <button class="action-btn dislike-btn${dislikeClass}" data-id="${post._id}" data-type="dislike">
          👎 <span class="dislike-count">${post.dislikes || 0}</span>
        </button>
        <button class="action-btn comment-btn" data-id="${post._id}">
          💬 <span>${post.commentCount || 0}</span>
        </button>
        ${isAdmin ? `<button class="action-btn delete-btn" data-id="${post._id}" title="Delete post (Admin)">🗑</button>` : ''}
      </div>
    `;

    // Author name click → profile
    card.querySelector('.post-author-name').addEventListener('click', () => {
      Router.navigate('profile', post.username);
    });

    // Like / Dislike
    card.querySelectorAll('.like-btn, .dislike-btn').forEach(btn => {
      btn.addEventListener('click', () => handleVote(post._id, btn.dataset.type, card));
    });

    // Comments
    card.querySelector('.comment-btn').addEventListener('click', () => openComments(post._id));

    // Delete
    const delBtn = card.querySelector('.delete-btn');
    if (delBtn) delBtn.addEventListener('click', () => handleDelete(post._id, card));

    return card;
  }

  async function handleVote(postId, type, card) {
    if (!Auth.getUser()) { Auth.showModal('login'); return; }
    try {
      const updated = await api.votePost(postId, type);
      // Update counts
      card.querySelector('.like-count').textContent = updated.likes || 0;
      card.querySelector('.dislike-count').textContent = updated.dislikes || 0;
      const likeBtn = card.querySelector('.like-btn');
      const dislikeBtn = card.querySelector('.dislike-btn');
      likeBtn.classList.toggle('liked', updated.userVote === 'like');
      dislikeBtn.classList.toggle('disliked', updated.userVote === 'dislike');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function handleDelete(postId, card) {
    if (!confirm('Delete this post?')) return;
    try {
      await api.deletePost(postId);
      card.style.opacity = '0';
      card.style.transform = 'translateX(-10px)';
      card.style.transition = 'all 0.3s';
      setTimeout(() => card.remove(), 300);
      showToast('Post deleted', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ---- COMMENTS MODAL ----
  async function openComments(postId) {
    currentCommentPostId = postId;
    const modal = document.getElementById('comments-modal');
    const container = document.getElementById('comments-container');
    const inputWrap = document.getElementById('comment-input-wrap');
    const loginPrompt = document.getElementById('comment-login-prompt');

    modal.style.display = 'flex';
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted)">Loading comments...</div>';

    const user = Auth.getUser();
    if (user) {
      inputWrap.style.display = 'block';
      loginPrompt.style.display = 'none';
      const ca = document.getElementById('comment-avatar');
      ca.textContent = user.avatar; ca.style.background = user.avatarColor;
    } else {
      inputWrap.style.display = 'none';
      loginPrompt.style.display = 'block';
    }

    try {
      const comments = await api.getComments(postId);
      renderComments(comments);
    } catch {
      container.innerHTML = '<div class="empty-state"><p>Failed to load comments</p></div>';
    }
  }

  function renderComments(comments) {
    const container = document.getElementById('comments-container');
    const user = Auth.getUser();

    if (!comments.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">💬</div><p>No comments yet. Be the first!</p></div>';
      return;
    }

    container.innerHTML = '';
    comments.forEach(c => {
      const div = document.createElement('div');
      div.className = 'comment-item';
      div.innerHTML = `
        <div class="avatar-mini" style="background:${c.authorAvatarColor}">${c.authorAvatar}</div>
        <div class="comment-body">
          <div class="comment-author">${escapeHtml(c.authorName)} <span style="color:var(--text-muted);font-weight:400;font-size:0.8rem">@${c.username}</span></div>
          <div class="comment-text">${escapeHtml(c.content)}</div>
          <div class="comment-meta">
            <span>${timeAgo(c.createdAt)}</span>
            ${user && user.role === 'admin' ? `<button class="comment-delete" data-id="${c._id}">Delete</button>` : ''}
          </div>
        </div>
      `;
      const del = div.querySelector('.comment-delete');
      if (del) del.addEventListener('click', () => handleDeleteComment(c._id, div));
      container.appendChild(div);
    });
  }

  async function handleDeleteComment(commentId, el) {
    try {
      await api.deleteComment(currentCommentPostId, commentId);
      el.style.opacity = '0'; el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
      showToast('Comment deleted', 'success');
      // update comment count in feed
      const card = document.querySelector(`.post-card[data-id="${currentCommentPostId}"]`);
      if (card) {
        const countEl = card.querySelector('.comment-btn span');
        if (countEl) countEl.textContent = Math.max(0, parseInt(countEl.textContent) - 1);
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function submitComment() {
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) return;

    const btn = document.getElementById('comment-submit-btn');
    btn.disabled = true;

    try {
      await api.addComment(currentCommentPostId, content);
      input.value = '';
      const comments = await api.getComments(currentCommentPostId);
      renderComments(comments);
      // update count in feed
      const card = document.querySelector(`.post-card[data-id="${currentCommentPostId}"]`);
      if (card) {
        const countEl = card.querySelector('.comment-btn span');
        if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  // ---- LOAD FEED ----
  async function load(reset = false) {
    if (reset) { page = 1; document.getElementById('posts-container').innerHTML = ''; }

    try {
      const { posts, hasMore: more } = await api.getPosts(page);
      hasMore = more;

      const container = document.getElementById('posts-container');
      if (reset) container.innerHTML = '';

      if (!posts.length && reset) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏁</div><p>No posts yet. Be the first to post!</p></div>';
      } else {
        posts.forEach(p => container.appendChild(renderPost(p)));
      }

      document.getElementById('load-more-wrap').style.display = hasMore ? 'block' : 'none';
    } catch (e) {
      if (reset) document.getElementById('posts-container').innerHTML = '<div class="empty-state"><p>Failed to load feed</p></div>';
    }
  }

  async function handleCreatePost() {
    const content = document.getElementById('post-content').value.trim();
    if (!content) return;
    const btn = document.getElementById('submit-post-btn');
    btn.disabled = true; btn.textContent = 'POSTING...';
    try {
      const post = await api.createPost(content);
      if (post.status !== 'pending') {
        document.getElementById('post-content').value = '';
        document.getElementById('char-count').textContent = '500';
      }
      const container = document.getElementById('posts-container');
      const empty = container.querySelector('.empty-state');
      if (empty) empty.remove();
      if (post.status !== 'pending') {
        const card = renderPost({ ...post, userVote: null });
        card.style.animation = 'fadeIn 0.3s ease';
        container.prepend(card);
      }
      if (post.status === 'pending') {
        showToast('Post submitted! Waiting for admin approval ⏳', '');
        // Show a pending indicator in the feed area without adding to feed
        document.getElementById('post-content').value = '';
        document.getElementById('char-count').textContent = '500';
        const notice = document.createElement('div');
        notice.className = 'post-card';
        notice.style.borderLeft = '3px solid #ffd700';
        notice.style.opacity = '0.7';
        notice.innerHTML = '<div style="color:var(--text-muted);font-size:0.9rem;">⏳ Your post is pending admin approval and will appear here once approved.</div>';
        const container = document.getElementById('posts-container');
        container.prepend(notice);
        setTimeout(() => { notice.style.transition='opacity 0.5s'; notice.style.opacity='0'; setTimeout(()=>notice.remove(),500); }, 5000);
      } else {
        showToast('Post published! 🏁', 'success');
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'POST';
    }
  }

  function reload() { load(true); }

  function init() {
    document.getElementById('submit-post-btn').addEventListener('click', handleCreatePost);
    document.getElementById('post-content').addEventListener('input', (e) => {
      document.getElementById('char-count').textContent = 500 - e.target.value.length;
    });

    document.getElementById('load-more-btn').addEventListener('click', () => {
      page++;
      load(false);
    });

    document.getElementById('comments-modal-close').addEventListener('click', () => {
      document.getElementById('comments-modal').style.display = 'none';
    });
    document.getElementById('comments-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('comments-modal')) document.getElementById('comments-modal').style.display = 'none';
    });

    document.getElementById('comment-submit-btn').addEventListener('click', submitComment);
    document.getElementById('comment-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitComment();
    });

    document.querySelectorAll('.comment-login-link').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('comments-modal').style.display = 'none';
        Auth.showModal('login');
      });
    });
  }

  return { init, load, reload };
})();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
