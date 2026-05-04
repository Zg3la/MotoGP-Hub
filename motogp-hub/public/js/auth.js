// ============================================================
// AUTH MODULE – login, register, session management
// ============================================================

const Auth = (() => {
  let currentUser = null;

  function getUser() { return currentUser; }

  function saveSession(token, user) {
    localStorage.setItem('motogp_token', token);
    localStorage.setItem('motogp_user', JSON.stringify(user));
    currentUser = user;
    updateNavbar();
  }

  function clearSession() {
    localStorage.removeItem('motogp_token');
    localStorage.removeItem('motogp_user');
    currentUser = null;
    updateNavbar();
  }

  function loadSession() {
    const t = localStorage.getItem('motogp_token');
    const u = localStorage.getItem('motogp_user');
    if (t && u) {
      currentUser = JSON.parse(u);
      updateNavbar();
    }
  }

  function updateNavbar() {
    const guestEl = document.getElementById('nav-guest');
    const userEl = document.getElementById('nav-user');
    const navAvatar = document.getElementById('nav-avatar');
    const navUsername = document.getElementById('nav-username');

    if (currentUser) {
      guestEl.style.display = 'none';
      userEl.style.display = 'block';
      navAvatar.textContent = currentUser.avatar;
      navAvatar.style.background = currentUser.avatarColor;
      navUsername.textContent = currentUser.username;
      document.getElementById('create-post-card').style.display = 'block';
      // Show admin nav link
      const adminLink = document.getElementById('admin-nav-link');
      if (adminLink) adminLink.style.display = currentUser.role === 'admin' ? 'inline-flex' : 'none';
      document.getElementById('guest-post-prompt').style.display = 'none';
      const pa = document.getElementById('post-avatar');
      if (pa) { pa.textContent = currentUser.avatar; pa.style.background = currentUser.avatarColor; }
    } else {
      guestEl.style.display = 'flex';
      userEl.style.display = 'none';
      document.getElementById('create-post-card').style.display = 'none';
      document.getElementById('guest-post-prompt').style.display = 'block';
      const adminLinkOut = document.getElementById('admin-nav-link');
      if (adminLinkOut) adminLinkOut.style.display = 'none';
    }
  }

  // ---- MODAL SHOW/HIDE ----
  function showModal(form = 'login') {
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('form-login').style.display = form === 'login' ? 'block' : 'none';
    document.getElementById('form-register').style.display = form === 'register' ? 'block' : 'none';
    clearErrors();
  }

  function hideModal() {
    document.getElementById('auth-modal').style.display = 'none';
    clearErrors();
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  }

  function clearErrors() {
    ['login-error','register-error'].forEach(id => {
      const el = document.getElementById(id);
      el.style.display = 'none'; el.textContent = '';
    });
    ['err-name','err-username','err-email','err-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    ['reg-name','reg-username','reg-email','reg-password'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
    });
  }

  // ---- CLIENT-SIDE VALIDATION ----
  function validateRegister(name, username, email, password) {
    let valid = true;
    clearErrors();

    if (!name || name.trim().length < 2) {
      document.getElementById('err-name').textContent = 'Name must be at least 2 characters';
      document.getElementById('reg-name').classList.add('input-error');
      valid = false;
    }
    if (!username || username.length < 3 || username.length > 20) {
      document.getElementById('err-username').textContent = 'Username must be 3–20 characters';
      document.getElementById('reg-username').classList.add('input-error');
      valid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      document.getElementById('err-username').textContent = 'Only letters, numbers, underscores';
      document.getElementById('reg-username').classList.add('input-error');
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('err-email').textContent = 'Enter a valid email address';
      document.getElementById('reg-email').classList.add('input-error');
      valid = false;
    }
    if (!password || password.length < 6) {
      document.getElementById('err-password').textContent = 'Password must be at least 6 characters';
      document.getElementById('reg-password').classList.add('input-error');
      valid = false;
    }
    return valid;
  }

  // ---- SUBMIT HANDLERS ----
  async function handleLogin() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');

    if (!username || !password) {
      const err = document.getElementById('login-error');
      err.textContent = 'Please fill in all fields'; err.style.display = 'block'; return;
    }

    btn.disabled = true; btn.textContent = 'Logging in...';
    try {
      const { token, user } = await api.login(username, password);
      saveSession(token, user);
      hideModal();
      showToast('Welcome back, ' + user.name + '! 🏁', 'success');
      Posts.reload();
    } catch (e) {
      const err = document.getElementById('login-error');
      err.textContent = e.message; err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'LOG IN';
    }
  }

  async function handleRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!validateRegister(name, username, email, password)) return;

    const btn = document.getElementById('register-submit-btn');
    btn.disabled = true; btn.textContent = 'Creating account...';
    try {
      const { token, user } = await api.register(name, username, email, password);
      saveSession(token, user);
      hideModal();
      showToast('Welcome to MotoGP Social Hub, ' + user.name + '! 🏍️', 'success');
      Posts.reload();
    } catch (e) {
      const err = document.getElementById('register-error');
      err.textContent = e.message; err.style.display = 'block';
    } finally {
      btn.disabled = false; btn.textContent = 'CREATE ACCOUNT';
    }
  }

  function init() {
    loadSession();

    document.getElementById('nav-login-btn').addEventListener('click', () => showModal('login'));
    document.getElementById('nav-register-btn').addEventListener('click', () => showModal('register'));
    document.getElementById('modal-close').addEventListener('click', hideModal);
    document.getElementById('auth-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('auth-modal')) hideModal();
    });

    document.getElementById('switch-to-register').addEventListener('click', (e) => { e.preventDefault(); showModal('register'); });
    document.getElementById('switch-to-login').addEventListener('click', (e) => { e.preventDefault(); showModal('login'); });

    document.getElementById('login-submit-btn').addEventListener('click', handleLogin);
    document.getElementById('register-submit-btn').addEventListener('click', handleRegister);

    document.getElementById('login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    document.getElementById('reg-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      clearSession();
      showToast('Logged out. See you on the track! 👋');
      Posts.reload();
      Router.navigate('feed');
    });

    document.getElementById('user-avatar-btn').addEventListener('click', () => {
      document.getElementById('user-dropdown').classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!document.getElementById('nav-user').contains(e.target)) {
        document.getElementById('user-dropdown').classList.remove('open');
      }
    });

    document.getElementById('prompt-login').addEventListener('click', (e) => { e.preventDefault(); showModal('login'); });
    document.getElementById('prompt-register').addEventListener('click', (e) => { e.preventDefault(); showModal('register'); });
  }

  return { init, getUser, showModal, saveSession, clearSession };
})();
