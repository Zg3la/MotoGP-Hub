// ============================================================
// ADMIN MODULE – moderation panel (posts + comments + pending)
// ============================================================

const Admin = (() => {

  // ----------------------------
  // Helpers
  // ----------------------------
  function timeAgo(date) {
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  // ----------------------------
  // PENDING POSTS
  // ----------------------------
  function renderPendingCard(post) {
    const card = document.createElement('div');
    card.className = 'pending-card';
    card.dataset.id = post._id;

    card.innerHTML = `
      <div class="pending-card-header">
        <div class="avatar-mini" style="background:${post.authorAvatarColor}">
          ${post.authorAvatar}
        </div>
        <div class="pending-card-meta">
          <div class="pending-card-name">
            ${escapeHtml(post.authorName)}
            <span style="color:var(--text-muted);font-weight:400;font-size:0.82rem">
              @${post.username}
            </span>
          </div>
          <div class="pending-card-sub">
            Submitted ${timeAgo(post.createdAt)}
          </div>
        </div>
      </div>

      <div class="pending-card-content">
        ${escapeHtml(post.content)}
      </div>

      <div class="pending-card-actions">
        <button class="btn-approve">✓ Approve</button>
        <button class="btn-reject">✕ Reject</button>
      </div>
    `;

    card.querySelector('.btn-approve')
      .addEventListener('click', () => handleApprove(post._id, card));

    card.querySelector('.btn-reject')
      .addEventListener('click', () => handleReject(post._id, card));

    return card;
  }

  async function handleApprove(postId, card) {
    const btn = card.querySelector('.btn-approve');
    btn.disabled = true;
    btn.textContent = 'Approving...';

    try {
      await api.approvePost(postId);

      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(10px)';

      setTimeout(() => card.remove(), 400);

      showToast('Post approved and published!', 'success');
      updatePendingBadge(-1);

    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.textContent = '✓ Approve';
    }
  }

  async function handleReject(postId, card) {
    if (!confirm('Reject and permanently delete this post?')) return;

    const btn = card.querySelector('.btn-reject');
    btn.disabled = true;
    btn.textContent = 'Rejecting...';

    try {
      await api.rejectPost(postId);

      card.style.transition = 'all 0.4s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateX(-10px)';

      setTimeout(() => card.remove(), 400);

      showToast('Post rejected and removed.', 'error');
      updatePendingBadge(-1);

    } catch (e) {
      showToast(e.message, 'error');
      btn.disabled = false;
      btn.textContent = '✕ Reject';
    }
  }

  // ----------------------------
  // DELETE POSTS (published)
  // ----------------------------
  async function handleDeletePost(postId, element) {
    if (!confirm('Permanently delete this post?')) return;

    const btn = element.querySelector('.btn-delete-post');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Deleting...';
    }

    try {
      await api.deletePost(postId);

      element.style.transition = 'all 0.3s ease';
      element.style.opacity = '0';
      element.style.transform = 'translateY(-10px)';

      setTimeout(() => element.remove(), 300);

      showToast('Post deleted.', 'success');

    } catch (e) {
      showToast(e.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }
  }

  // ----------------------------
  // DELETE COMMENTS
  // ----------------------------
  async function handleDeleteComment(commentId, element) {
    if (!confirm('Delete this comment permanently?')) return;

    const btn = element.querySelector('.btn-delete-comment');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Deleting...';
    }

    try {
      await api.deleteComment(commentId);

      element.style.transition = 'all 0.3s ease';
      element.style.opacity = '0';
      element.style.transform = 'translateX(-10px)';

      setTimeout(() => element.remove(), 300);

      showToast('Comment deleted.', 'success');

    } catch (e) {
      showToast(e.message, 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }
  }

  // ----------------------------
  // BADGE UPDATE
  // ----------------------------
  function updatePendingBadge(delta) {
    const badge = document.getElementById('pending-badge');
    if (!badge) return;

    const current = parseInt(badge.textContent) || 0;
    const next = Math.max(0, current + delta);

    badge.textContent = next;

    if (next === 0) {
      badge.style.background = 'var(--text-dim)';
      const container = document.getElementById('pending-posts-container');
      if (container && !container.querySelector('.pending-card')) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p>No pending posts — all clear!</p>
          </div>
        `;
      }
    }

    const navBadge = document.getElementById('admin-nav-badge');
    if (navBadge) {
      navBadge.textContent = next;
      navBadge.style.display = next > 0 ? 'inline' : 'none';
    }
  }

  // ----------------------------
  // LOAD ADMIN PANEL
  // ----------------------------
  async function loadAdminPanel() {
    const container = document.getElementById('pending-posts-container');
    const statsRow  = document.getElementById('admin-stats-row');
    const badge     = document.getElementById('pending-badge');

    container.innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading pending posts...</div>';

    try {
      const pending = await api.getPendingPosts();

      if (statsRow) {
        statsRow.innerHTML = `
          <div class="admin-stat-card">
            <div class="admin-stat-number">${pending.length}</div>
            <div class="admin-stat-label">Pending</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-number">✓</div>
            <div class="admin-stat-label">Approve to publish</div>
          </div>
          <div class="admin-stat-card">
            <div class="admin-stat-number">✕</div>
            <div class="admin-stat-label">Reject to remove</div>
          </div>
        `;
      }

      if (badge) badge.textContent = pending.length;

      container.innerHTML = '';

      if (!pending.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✅</div>
            <p>No pending posts — all clear!</p>
          </div>
        `;
        return;
      }

      pending.forEach(p => container.appendChild(renderPendingCard(p)));

    } catch (e) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Failed to load: ${e.message}</p>
        </div>
      `;
    }
  }

  // ----------------------------
  // EXPOSE API
  // ----------------------------
  return {
    loadAdminPanel,
    handleDeletePost,
    handleDeleteComment
  };

})();
