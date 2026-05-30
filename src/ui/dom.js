export const $ = id => document.getElementById(id);

export function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char] || char));
}

export function toast(message) {
  const element = $('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 2200);
}

export function showPanel(id) {
  $(id).classList.add('show');
  $('fab').style.display = 'none';
}

export function hidePanel(id) {
  $(id).classList.remove('show');
  $('fab').style.display = 'block';
}
