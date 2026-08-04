import { set24HourPreference } from "./widgetCore.js";

const widgetStateKey = "widgetState";

async function getWidgetDefinitions() {
  const res = await fetch("./widgetSettings.json");

  if (!res.ok) {
    throw new Error("Failed to load widget settings");
  }

  const settings = await res.json();
  return settings.widgets || [];
}

function resetDisabledWidgetState(integrations, widgetDefinitions) {
  const state = JSON.parse(localStorage.getItem(widgetStateKey) || "{}");

  widgetDefinitions.forEach((widget) => {
    const widgetId = `${widget.key}-widget`;
    const enabled = integrations?.[widget.key]?.enabled;

    if (!enabled) {
      delete state[widgetId];

      const existing = document.getElementById(widgetId);
      if (existing) {
        existing.remove();
      }
    }
  });

  localStorage.setItem(widgetStateKey, JSON.stringify(state));
}

async function loadEnabledWidgets(integrations, widgetDefinitions) {
  const enabledWidgets = widgetDefinitions.filter((widget) => {
    return integrations?.[widget.key]?.enabled;
  });

  await Promise.all(
    enabledWidgets.map(async (widget) => {
      try {
        const module = await import(`./widgets/${widget.key}.js`);
        await module.init?.(integrations[widget.key]);
      } catch (err) {
        console.error(`Failed to load widget module ${widget.key}:`, err);
      }
    })
  );
}

window.addEventListener("load", () => {
  chrome.storage.local.get(["integrations", "24hourTime"], async (data) => {
    const integrations = data.integrations || {};

    set24HourPreference(data["24hourTime"] === true);

    try {
      const widgetDefinitions = await getWidgetDefinitions();
      resetDisabledWidgetState(integrations, widgetDefinitions);
      await loadEnabledWidgets(integrations, widgetDefinitions);
    } catch (err) {
      console.error("Widget bootstrap failed:", err);
    }
  });
});
