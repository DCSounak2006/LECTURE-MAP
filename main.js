import { state } from './state.js';
import { loadFromStorage, saveHistory } from './storage.js';
import { updateUI } from './render.js';
import { attachEventListeners } from './events.js';

document.addEventListener('DOMContentLoaded', () => {
  // Expose state + helpers to non-module scripts (readExcel.js)
  window.__appState = state;
  window.__appBridge = { saveHistory, updateUI };

  loadFromStorage();
  attachEventListeners();
  updateUI();
});
