import { loadFromStorage } from "./services/storage.js";
import { updateUI } from "./ui/render.js";
import { attachEventListeners } from "./ui/events.js";

document.addEventListener("DOMContentLoaded", () => {
  loadFromStorage();
  attachEventListeners();
  updateUI();
});