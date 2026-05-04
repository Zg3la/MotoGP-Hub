// ============================================================
// DRIVERS MODULE – Grid view, follow/unfollow
// ============================================================

const Drivers = (() => {

  let driversCache = [];

  function renderDriverCard(driver) {
    const card = document.createElement('div');
    card.className = 'driver-card';
    card.dataset.username = driver.username;

    const followLabel = driver.isFollowing ? 'Following ✓' : '+ Follow';
    const followClass = driver.isFollowing ? 'following' : '';

    card.innerHTML = `
      <div class="driver-number">${driver.number || ''}</div>
      <div class="driver-avatar-wrap">
        <div class="avatar-large" style="background:${driver.avatarColor}">${driver.avatar}</div>
      </div>
      <div class="driver-name">${escapeHtml(driver.name)}</div>
      <div class="driver-team">${escapeHtml(driver.team || 'MotoGP')}</div>
      <div class="driver-nationality">🌍 ${escapeHtml(driver.nationality || '')}</div>
      <div class="driver-bio">${escapeHtml(driver.bio || '')}</div>
      <div class="driver-followers"><strong>${driver.followers || 0}</strong> followers</div>
      <button class="btn btn-follow ${followClass}" data-username="${driver.username}">${followLabel}</button>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-follow')) return;
      Router.navigate('profile', driver.username);
    });

    card.querySelector('.btn-follow').addEventListener('click', (e) => {
      e.stopPropagation();
      handleFollow(driver.username, e.target);
    });

    return card;
  }

  async function handleFollow(username, btn) {
    const user = Auth.getUser();
    if (!user) { Auth.showModal('login'); return; }
    if (user.username === username) { showToast("You can't follow yourself!", 'error'); return; }

    btn.disabled = true;
    try {
      const updated = await api.followUser(username);
      const isFollowing = updated.isFollowing;
      btn.textContent = isFollowing ? 'Following ✓' : '+ Follow';
      btn.classList.toggle('following', isFollowing);

      // Update followers count in card
      const card = btn.closest('.driver-card');
      const countEl = card.querySelector('.driver-followers strong');
      if (countEl) countEl.textContent = updated.followers || 0;

      showToast(isFollowing ? `Now following ${updated.name}! 🏍️` : `Unfollowed ${updated.name}`, 'success');

      // Refresh sidebar
      loadSidebar();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function loadGrid() {
    const grid = document.getElementById('drivers-grid');
    grid.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Loading riders...</div>';

    try {
      driversCache = await api.getDrivers();
      grid.innerHTML = '';
      if (!driversCache.length) {
        grid.innerHTML = '<div class="empty-state"><div class="empty-icon">🏍️</div><p>No drivers found</p></div>';
        return;
      }
      driversCache.forEach(d => grid.appendChild(renderDriverCard(d)));
    } catch (e) {
      grid.innerHTML = '<div class="empty-state"><p>Failed to load drivers</p></div>';
    }
  }

  async function loadSidebar() {
    const sidebar = document.getElementById('sidebar-drivers');
    try {
      const drivers = await api.getDrivers();
      sidebar.innerHTML = '';
      drivers.slice(0, 4).forEach(d => {
        const item = document.createElement('div');
        item.className = 'sidebar-driver-item';
        item.innerHTML = `
          <div class="avatar-mini" style="background:${d.avatarColor}">${d.avatar}</div>
          <div class="sidebar-driver-info">
            <div class="sidebar-driver-name" data-username="${d.username}">${escapeHtml(d.name)}</div>
            <div class="sidebar-driver-team">${escapeHtml(d.team || '')}</div>
          </div>
          <button class="btn btn-follow ${d.isFollowing ? 'following' : ''}" data-username="${d.username}" style="padding:4px 10px;font-size:0.75rem;">
            ${d.isFollowing ? '✓' : '+'}
          </button>
        `;
        item.querySelector('.sidebar-driver-name').addEventListener('click', () => Router.navigate('profile', d.username));
        item.querySelector('.btn-follow').addEventListener('click', (e) => handleFollow(d.username, e.target));
        sidebar.appendChild(item);
      });
    } catch {}
  }

  return { loadGrid, loadSidebar, handleFollow };
})();
