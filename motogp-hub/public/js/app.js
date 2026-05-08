// ============================================================
// APP – Router, profile page, init
// ============================================================

// ---- TOGGLE NEWS ARTICLE ----
function toggleArticle(id) {
  const article = document.getElementById(id);
  if (!article) return;
  article.classList.toggle('expanded');
  const icon = article.querySelector('.news-toggle-icon');
  const label = article.querySelector('.news-toggle-btn');
  if (article.classList.contains('expanded')) {
    if (icon) icon.textContent = '▴';
    if (label) label.innerHTML = '<span class="news-toggle-icon">▴</span> Collapse';
  } else {
    if (icon) icon.textContent = '▾';
    if (label) label.innerHTML = '<span class="news-toggle-icon">▾</span> Read article';
  }
}

// ---- TOAST ----
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// ---- ROUTER ----
const Router = (() => {
  let currentPage = 'feed';

  function navigate(page, param = null) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    currentPage = page;

    if (page === 'feed') {
      document.getElementById('page-feed').classList.add('active');
      document.querySelector('[data-page="feed"]')?.classList.add('active');
      Posts.load(true);
      Drivers.loadSidebar();
    } else if (page === 'drivers') {
      document.getElementById('page-drivers').classList.add('active');
      document.querySelector('[data-page="drivers"]')?.classList.add('active');
      Drivers.loadGrid();
    } else if (page === 'news') {
      document.getElementById('page-news').classList.add('active');
      document.querySelector('[data-page="news"]')?.classList.add('active');
    } else if (page === 'teams') {
      document.getElementById('page-teams').classList.add('active');
      document.querySelector('[data-page="teams"]')?.classList.add('active');
      Teams.loadTeams();
    } else if (page === 'admin') {
      const user = Auth.getUser();
      if (!user || user.role !== 'admin') { Router.navigate('feed'); return; }
      document.getElementById('page-admin').classList.add('active');
      document.querySelector('[data-page="admin"]')?.classList.add('active');
      Admin.loadAdminPanel();
    } else if (page === 'profile') {
      document.getElementById('page-profile').classList.add('active');
      loadProfilePage(param);
    }
  }

  function init() {
    // Nav link clicks
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.page);
        document.getElementById('nav-links').classList.remove('mobile-open');
        document.getElementById('user-dropdown').classList.remove('open');
      });
    });

    // Hamburger
    document.getElementById('hamburger').addEventListener('click', () => {
      document.getElementById('nav-links').classList.toggle('mobile-open');
    });
  }

  return { navigate, init };
})();

// ---- PROFILE PAGE ----
async function loadProfilePage(username) {
  const container = document.getElementById('profile-content');
  const currentUser = Auth.getUser();

  // If no username passed, show own profile
  if (!username && currentUser) username = currentUser.username;
  if (!username) { Router.navigate('feed'); return; }

  container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted)">Loading profile...</div>';

  try {
    const [user, posts] = await Promise.all([
      api.getUser(username),
      api.getUserPosts(username)
    ]);

    const isOwn = currentUser && currentUser.id === user._id;
    const isDriver = user.role === 'driver';

    container.innerHTML = `
      <div class="profile-header">
        <div class="avatar-large" style="background:${user.avatarColor}">${user.avatar}</div>
        <div class="profile-info">
          ${isDriver ? '<div class="profile-driver-badge">🏍️ MotoGP Rider</div>' : ''}
          <div class="profile-name">${escapeHtml(user.name)}</div>
          <div class="profile-username">@${user.username}</div>
          <div class="profile-bio" id="profile-bio-text">${escapeHtml(user.bio || 'No bio yet.')}</div>
          ${isOwn ? `
            <div class="profile-bio-edit" id="bio-edit-form" style="display:none;">
              <input type="text" id="bio-input" placeholder="Write a short bio..." maxlength="200" value="${escapeHtml(user.bio || '')}">
              <button class="btn btn-primary" id="bio-save-btn" style="padding:8px 14px;">Save</button>
              <button class="btn btn-ghost" id="bio-cancel-btn" style="padding:8px 14px;">✕</button>
            </div>
            <button class="btn btn-ghost" id="edit-bio-btn" style="margin-bottom:16px;font-size:0.8rem;padding:6px 12px;">✏️ Edit bio</button>
          ` : ''}
          <div class="profile-meta">
            <div class="profile-meta-item">
              <strong>${posts.length}</strong>
              <span>Posts</span>
            </div>
            <div class="profile-meta-item">
              <strong>${user.followers || 0}</strong>
              <span>Followers</span>
            </div>
            ${isDriver ? `<div class="profile-meta-item"><strong>#${user.number}</strong><span>Number</span></div>` : ''}
          </div>
        </div>
        ${!isOwn ? `<button class="btn btn-follow ${user.isFollowing ? 'following' : ''}" id="profile-follow-btn" data-username="${username}">${user.isFollowing ? 'Following ✓' : '+ Follow'}</button>` : ''}
      </div>

      <div class="section-header" style="margin-top:32px;">
        <h2 class="section-title" style="font-size:1.8rem;">POSTS</h2>
      </div>
      <div id="profile-posts-container"></div>
    `;

    // Edit bio
    if (isOwn) {
      document.getElementById('edit-bio-btn').addEventListener('click', () => {
        document.getElementById('bio-edit-form').style.display = 'flex';
        document.getElementById('edit-bio-btn').style.display = 'none';
        document.getElementById('bio-input').focus();
      });
      document.getElementById('bio-cancel-btn').addEventListener('click', () => {
        document.getElementById('bio-edit-form').style.display = 'none';
        document.getElementById('edit-bio-btn').style.display = 'inline-flex';
      });
      document.getElementById('bio-save-btn').addEventListener('click', async () => {
        const bio = document.getElementById('bio-input').value.trim();
        try {
          await api.updateBio(bio);
          document.getElementById('profile-bio-text').textContent = bio || 'No bio yet.';
          document.getElementById('bio-edit-form').style.display = 'none';
          document.getElementById('edit-bio-btn').style.display = 'inline-flex';
          showToast('Bio updated!', 'success');
        } catch (e) { showToast(e.message, 'error'); }
      });
    }

    // Follow button
    const followBtn = document.getElementById('profile-follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async () => {
        if (!Auth.getUser()) { Auth.showModal('login'); return; }
        followBtn.disabled = true;
        try {
          const updated = await api.followUser(username);
          followBtn.textContent = updated.isFollowing ? 'Following ✓' : '+ Follow';
          followBtn.classList.toggle('following', updated.isFollowing);
          const followersEl = container.querySelector('.profile-meta-item strong');
          // Update count in second meta item (followers)
          const metas = container.querySelectorAll('.profile-meta-item strong');
          if (metas[1]) metas[1].textContent = updated.followers || 0;
          showToast(updated.isFollowing ? `Following ${updated.name}! 🏍️` : `Unfollowed ${updated.name}`, 'success');
          Drivers.loadSidebar();
        } catch (e) { showToast(e.message, 'error'); }
        finally { followBtn.disabled = false; }
      });
    }

    // Render posts
    const postsContainer = document.getElementById('profile-posts-container');
    if (!posts.length) {
      postsContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>No posts yet</p></div>';
    } else {
      posts.forEach(p => {
        const card = document.createElement('div');
        card.className = 'post-card' + (p.authorRole === 'driver' ? ' driver-post' : '');
        card.innerHTML = `
          <div class="post-content" style="margin-bottom:12px;">${escapeHtml(p.content)}</div>
          <div style="font-size:0.82rem;color:var(--text-dim);">${new Date(p.createdAt).toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})} · 👍 ${p.likes||0} · 💬 ${p.commentCount||0}</div>
        `;
        postsContainer.appendChild(card);
      });
    }

  } catch (e) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">😔</div><p>User not found</p></div>';
  }
}

// ---- INIT ----
window.addEventListener('DOMContentLoaded', async () => {
  // Hide loading screen after a brief delay
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    ls.style.opacity = '0';
    setTimeout(() => {
      ls.style.display = 'none';
      document.getElementById('app').style.display = 'block';
    }, 500);
  }, 1200);

  Auth.init();
  Posts.init();
  Router.init();
  LiveDiscussion.init();

  // Initial page load
  Router.navigate('feed');
  Drivers.loadSidebar();
});
