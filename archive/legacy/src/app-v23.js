import './app.js';
import { initPullRefresh } from './pull-refresh.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPullRefresh, { once: true });
} else {
  initPullRefresh();
}
