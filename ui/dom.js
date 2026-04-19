export function $(id) {
  return document.getElementById(id);
}

export function $all(selector) {
  return document.querySelectorAll(selector);
}

export function create(tag, className = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}