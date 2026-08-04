const widgetLayer = document.getElementById("widgetLayer");
const widgetStateKey = "widgetState";
const GRID_SNAP_KEY = "widgetGridSnap";
const GRID_SIZE = 24;

export let is24Hour = false;

export function set24HourPreference(value) {
  is24Hour = value;
}

function getGridSnapEnabled() {
  try {
    return localStorage.getItem(GRID_SNAP_KEY) === "true";
  } catch {
    return false;
  }
}

function snapValue(value, step = GRID_SIZE) {
  return Math.round(value / step) * step;
}

function getViewportCenter() {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
}

function getWidgetCenterPosition(el) {
  const center = getViewportCenter();
  const left = Number.parseFloat(el.style.left || "0") || 0;
  const top = Number.parseFloat(el.style.top || "0") || 0;

  return {
    centerX: left - center.x,
    centerY: top - center.y
  };
}

function applyWidgetCenterPosition(el, centerX, centerY) {
  const center = getViewportCenter();
  const snappedCenterX = getGridSnapEnabled() ? snapValue(centerX) : centerX;
  const snappedCenterY = getGridSnapEnabled() ? snapValue(centerY) : centerY;

  el.style.position = "absolute";
  el.style.left = `${snappedCenterX + center.x}px`;
  el.style.top = `${snappedCenterY + center.y}px`;
}

function readWidgetStatePosition(state) {
  if (typeof state?.centerX === "number" || typeof state?.centerX === "string") {
    return {
      centerX: Number.parseFloat(state.centerX) || 0,
      centerY: Number.parseFloat(state.centerY) || 0
    };
  }

  if (typeof state?.left === "number" || typeof state?.left === "string") {
    const center = getViewportCenter();
    return {
      centerX: (Number.parseFloat(state.left) || 0) - center.x,
      centerY: (Number.parseFloat(state.top) || 0) - center.y
    };
  }

  return { centerX: 0, centerY: 0 };
}

export function loadState() {
  return JSON.parse(localStorage.getItem(widgetStateKey) || "{}");
}

export function saveState(state) {
  localStorage.setItem(widgetStateKey, JSON.stringify(state));
}

export function createWidget(id, title) {
  let el = document.getElementById(id);

  if (!el) {
    el = document.createElement("div");
    el.className = "widget";
    el.id = id;

    el.innerHTML = `
      <div class="widget-header">${title}</div>
      <div class="widget-content"></div>
      <div class="widget-resize"></div>
    `;

    widgetLayer.appendChild(el);

    makeDraggable(el);
    makeResizable(el);
    restoreWidgetState(el);
  }

  return el.querySelector(".widget-content");
}

function makeDraggable(el) {
  const header = el.querySelector(".widget-header");

  let offsetX = 0;
  let offsetY = 0;
  let dragging = false;

  header.style.cursor = "grab";

  header.addEventListener("mousedown", (e) => {
    dragging = true;

    const rect = el.getBoundingClientRect();
    offsetX = e.clientX - rect.left + 20;
    offsetY = e.clientY - rect.top + 20;

    document.body.style.userSelect = "none";
  });

  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    const center = getViewportCenter();
    const centerX = x - center.x;
    const centerY = y - center.y;
    const snappedCenterX = getGridSnapEnabled() ? snapValue(centerX) : centerX;
    const snappedCenterY = getGridSnapEnabled() ? snapValue(centerY) : centerY;

    applyWidgetCenterPosition(el, snappedCenterX, snappedCenterY);
    saveWidget(el);
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
    document.body.style.userSelect = "";
  });
}

function makeResizable(el) {
  const handle = el.querySelector(".widget-resize");

  let resizing = false;
  let startX;
  let startY;
  let startW;
  let startH;

  handle.addEventListener("mousedown", (e) => {
    resizing = true;

    const rect = el.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    startW = rect.width;
    startH = rect.height;

    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!resizing) return;

    const w = startW + (e.clientX - startX - 2);
    const h = startH + (e.clientY - startY - 2);
    const snappedW = getGridSnapEnabled() ? Math.max(180, snapValue(w)) : Math.max(180, w);
    const snappedH = getGridSnapEnabled() ? Math.max(120, snapValue(h)) : Math.max(120, h);

    el.style.width = snappedW + "px";
    el.style.height = snappedH + "px";

    saveWidget(el);
  });

  window.addEventListener("mouseup", () => {
    resizing = false;
  });
}

export function saveWidget(el) {
  const state = loadState();
  const position = getWidgetCenterPosition(el);

  state[el.id] = {
    centerX: position.centerX,
    centerY: position.centerY,
    width: el.style.width,
    height: el.style.height
  };

  saveState(state);
}

export function restoreWidgetState(el) {
  const state = loadState()[el.id];
  if (!state) return;

  const position = readWidgetStatePosition(state);
  applyWidgetCenterPosition(el, position.centerX, position.centerY);

  if (state.width) el.style.width = state.width;
  if (state.height) el.style.height = state.height;
}

export function clearWidgetState(id) {
  const state = loadState();
  delete state[id];
  saveState(state);
}

let lastViewportScale = window.visualViewport?.scale ?? 1;

function handleViewportChange() {
  const currentScale = window.visualViewport?.scale ?? 1;

  if (Math.abs(currentScale - lastViewportScale) > 0.001) {
    lastViewportScale = currentScale;
    return;
  }

  lastViewportScale = currentScale;

  document.querySelectorAll(".widget").forEach((widget) => {
    restoreWidgetState(widget);
  });
}

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", handleViewportChange);
}

window.addEventListener("resize", handleViewportChange);
