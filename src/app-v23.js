import './app.js';
import { initPullRefresh } from './pull-refresh.js';
import { initTaskButtonSymbols } from './ui-symbols-v25.js';

function bootExtras(){
  initPullRefresh();
  initTaskButtonSymbols();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootExtras, { once: true });
} else {
  bootExtras();
}
