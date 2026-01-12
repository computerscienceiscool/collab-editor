// Lightweight error banner for user-visible failures
let hideTimer;

export function showErrorBanner(message, duration = 6000) {
  if (!message) return;
  let banner = document.getElementById('error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'error-banner';
    banner.className = 'error-banner hidden';
    document.body.prepend(banner);
  }
  banner.textContent = message;
  banner.classList.remove('hidden');
  banner.classList.add('show');

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    banner.classList.add('hidden');
  }, duration);
}
