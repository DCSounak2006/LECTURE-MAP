export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function $(id) {
  return document.getElementById(id);
}

export function create(tag, className = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}
