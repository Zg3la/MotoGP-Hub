// ============================================================
// LIVE DISCUSSION MODULE – Real-time chat via polling
// ============================================================

const LiveDiscussion = (() => {
  let pollInterval = null;
  let currentDiscussion = null;
  let lastMessageTime = null;
  let isOpen = false;

  function timeAgo(date) {
    const d = new Date(date);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
  }

  function renderMessage(msg) {
    const user = Auth.getUser();
    const isMe = user && user.username === msg.username;
    const isDriver = msg.authorRole === 'driver';
    const isAdmin = msg.authorRole === 'admin';

    const div = document.createElement('div');
    div.className = 'chat-message' + (isMe ? ' chat-me' : '');
    div.dataset.id = msg._id;
    div.innerHTML = `
      <div class="chat-avatar" style="background:${msg.authorAvatarColor}">${msg.authorAvatar}</div>
      <div class="chat-bubble">
        <div class="chat-meta">
          <span class="chat-author${isDriver ? ' chat-author-driver' : isAdmin ? ' chat-author-admin' : ''}">${escapeHtml(msg.authorName)}</span>
          ${isDriver ? '<span class="chat-badge">🏍️ Rider</span>' : isAdmin ? '<span class="chat-badge chat-badge-admin">⚙ Admin</span>' : ''}
          <span class="chat-time">${timeAgo(msg.createdAt)}</span>
        </div>
        <div class="chat-text">${escapeHtml(msg.content)}</div>
      </div>
    `;
    return div;
  }

  async function loadMessages(initial = false) {
    if (!currentDiscussion) return;
    try {
      const { messages } = await api.getMessages(initial ? null : lastMessageTime);
      if (!messages.length) return;

      const container = document.getElementById('chat-messages');
      const wasAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;

      messages.forEach(msg => {
        if (!document.querySelector(`.chat-message[data-id="${msg._id}"]`)) {
          container.appendChild(renderMessage(msg));
          if (msg.createdAt) lastMessageTime = msg.createdAt;
        }
      });

      if (initial || wasAtBottom) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (e) {
      // ignore poll errors silently
    }
  }

  function startPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(() => loadMessages(false), 2500);
  }

  function stopPolling() {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
  }

  async function openModal() {
    isOpen = true;
    const modal = document.getElementById('live-discussion-modal');
    modal.style.display = 'flex';

    // Reset
    document.getElementById('chat-messages').innerHTML = '';
    lastMessageTime = null;

    // Try to get active discussion
    try {
      const { discussion } = await api.getDiscussion();
      currentDiscussion = discussion;
      updateModalState();
      if (discussion) {
        await loadMessages(true);
        startPolling();
      }
    } catch (e) {
      currentDiscussion = null;
      updateModalState();
    }
  }

  function updateModalState() {
    const user = Auth.getUser();
    const isAdmin = user && user.role === 'admin';
    const title = document.getElementById('chat-title');
    const input = document.getElementById('chat-input-wrap');
    const loginPrompt = document.getElementById('chat-login-prompt');
    const adminPanel = document.getElementById('chat-admin-panel');
    const closedNotice = document.getElementById('chat-closed-notice');

    if (currentDiscussion) {
      title.textContent = currentDiscussion.title;
      closedNotice.style.display = 'none';
      if (user) {
        input.style.display = 'flex';
        loginPrompt.style.display = 'none';
      } else {
        input.style.display = 'none';
        loginPrompt.style.display = 'block';
      }
    } else {
      title.textContent = 'Live Discussion';
      closedNotice.style.display = 'block';
      input.style.display = 'none';
      loginPrompt.style.display = 'none';
    }

    if (isAdmin) {
      adminPanel.style.display = 'flex';
      const openBtn = document.getElementById('admin-open-disc-btn');
      const closeBtn = document.getElementById('admin-close-disc-btn');
      if (currentDiscussion) {
        openBtn.style.display = 'none';
        closeBtn.style.display = 'inline-flex';
      } else {
        openBtn.style.display = 'inline-flex';
        closeBtn.style.display = 'none';
      }
    } else {
      adminPanel.style.display = 'none';
    }
  }

  function closeModal() {
    isOpen = false;
    stopPolling();
    document.getElementById('live-discussion-modal').style.display = 'none';
  }

  async function sendMessage() {
    if (!currentDiscussion) return;
    const input = document.getElementById('chat-input');
    const content = input.value.trim();
    if (!content) return;

    const btn = document.getElementById('chat-send-btn');
    btn.disabled = true;
    try {
      await api.sendMessage(currentDiscussion._id, content);
      input.value = '';
      await loadMessages(false);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function adminOpenDiscussion() {
    const titleInput = document.getElementById('new-disc-title');
    const title = titleInput.value.trim();
    if (!title) { showToast('Enter a discussion title', 'error'); return; }
    try {
      const { discussion } = await api.openDiscussion(title);
      currentDiscussion = discussion;
      titleInput.value = '';
      updateModalState();
      document.getElementById('chat-messages').innerHTML = '';
      lastMessageTime = null;
      await loadMessages(true);
      startPolling();
      showToast('Discussion opened! 🏁', 'success');
      // Also refresh the session card badge
      refreshSessionCard();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function adminCloseDiscussion() {
    if (!confirm('Close the live discussion?')) return;
    try {
      await api.closeDiscussion();
      currentDiscussion = null;
      stopPolling();
      updateModalState();
      document.getElementById('chat-messages').innerHTML = '';
      showToast('Discussion closed', '');
      refreshSessionCard();
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  async function refreshSessionCard() {
    try {
      const { discussion } = await api.getDiscussion();
      const btn = document.getElementById('open-live-discussion-btn');
      if (!btn) return;
      if (discussion) {
        btn.innerHTML = `💬 Join: <em style="font-style:normal;color:var(--accent)">${escapeHtml(discussion.title)}</em>`;
        btn.classList.add('live-disc-active');
      } else {
        btn.innerHTML = '💬 Live Discussion';
        btn.classList.remove('live-disc-active');
      }
    } catch {}
  }

  function init() {
    // Modal close
    document.getElementById('live-modal-close').addEventListener('click', closeModal);
    document.getElementById('live-discussion-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('live-discussion-modal')) closeModal();
    });

    // Send message
    document.getElementById('chat-send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    // Admin controls
    document.getElementById('admin-open-disc-btn').addEventListener('click', adminOpenDiscussion);
    document.getElementById('admin-close-disc-btn').addEventListener('click', adminCloseDiscussion);

    // Sidebar button
    const openBtn = document.getElementById('open-live-discussion-btn');
    if (openBtn) openBtn.addEventListener('click', openModal);

    // Check if discussion is active and update sidebar badge
    refreshSessionCard();
    // Also periodically refresh the badge even when modal is closed
    setInterval(refreshSessionCard, 10000);
  }

  return { init, openModal, closeModal };
})();
