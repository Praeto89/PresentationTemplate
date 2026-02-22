/**
 * ════════════════════════════════════════════════════════════════════════════
 * NOTIFICATION UTILITY
 * Lightweight toast notifications for edit-mode features
 * ════════════════════════════════════════════════════════════════════════════
 */

/**
 * Show a temporary notification toast
 * @param {string} message - Notification text
 * @param {'info'|'success'|'warning'|'error'} type - Notification type
 * @param {number} duration - Auto-dismiss after ms (default 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
  const notif = document.createElement('div');
  notif.className = 'notification-toast';
  if (type === 'error') notif.classList.add('error');

  notif.innerHTML = `
    <span class="icon">${type === 'error' ? '❌' : '✅'}</span>
    <span class="message">${message}</span>
  `;

  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), duration);
}
