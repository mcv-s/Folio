const storage = window.folioStorage || {
    get(keys, callback) {
        callback({});
    },

    set(items, callback) {
        if (typeof callback === "function") {
            setTimeout(() => callback(items), 0);
        }
    },

    watch(key, callback) {
        // fallback does nothing
    },

    exportData(filename) {
        console.warn("Folio storage unavailable. Cannot export.");
    },

    importData(file, callback) {
        console.warn("Folio storage unavailable. Cannot import.");

        if (typeof callback === "function") {
            callback(false);
        }
    }
};

const hasChromeTabs = typeof chrome !== "undefined" && chrome?.tabs?.create;
const runtimeGetURL = typeof chrome !== "undefined" && chrome?.runtime?.getURL ? chrome.runtime.getURL.bind(chrome.runtime) : (path) => path;







const GRID_SNAP_KEY = "widgetGridSnap";


const widgetGridSnapToggle = document.getElementById("widgetGridSnapToggle");

if (widgetGridSnapToggle) {
    storage.get(GRID_SNAP_KEY, (data) => {
        const saved = data[GRID_SNAP_KEY] ?? localStorage.getItem(GRID_SNAP_KEY) === "true";
        widgetGridSnapToggle.checked = saved === true;
        localStorage.setItem(GRID_SNAP_KEY, String(saved));
    });

    widgetGridSnapToggle.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        localStorage.setItem(GRID_SNAP_KEY, String(enabled));
        storage.set({ [GRID_SNAP_KEY]: enabled });
    });
}












// ===== SYSTEM THEME AUTO =====
function applyTheme() {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    if (prefersLight) {
        document.body.classList.add("light");
    } else {
        document.body.classList.remove("light");
    }
}

applyTheme();

window.matchMedia('(prefers-color-scheme: light)')
    .addEventListener('change', applyTheme);










// ---------- Integrations -------------

const INTEGRATIONS_KEY = "integrations";
const WIDGET_SETTINGS_URL = "widgetSettings.json";
const widgetSettingsContainer = document.getElementById("widgetSettingsContainer");

function getIntegrations(cb) {
    storage.get(INTEGRATIONS_KEY, (data) => {
        cb(data[INTEGRATIONS_KEY] || {});
    });
}

function setIntegrations(update) {
    storage.get(INTEGRATIONS_KEY, (data) => {
        const current = data[INTEGRATIONS_KEY] || {};
        const next = { ...current, ...update };

        storage.set({
            [INTEGRATIONS_KEY]: next
        });
    });
}

function saveWidgetSetting(widgetKey, settingKey, value) {
    getIntegrations((current) => {
        const widgetState = { ...(current[widgetKey] || {}) };
        widgetState[settingKey] = value;

        setIntegrations({
            [widgetKey]: widgetState
        });
    });
}

function loadWidgetSettingsConfig() {
    return fetch(WIDGET_SETTINGS_URL).then(async (res) => {
        const settings = await res.json();
        return settings.widgets || [];
    });
}

function createSettingInput(setting, widgetState) {
    const wrapper = document.createElement("div");
    wrapper.className = "row";

    if (setting.type === "link") {
        const link = document.createElement("a");

        link.textContent = setting.label;
        link.href = setting.value;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        link.style.color = "var(--accent)";
        link.style.textDecoration = "underline";
        link.style.cursor = "pointer";

        wrapper.appendChild(link);

        return wrapper;
    }

    if (setting.type === "h4") {
        const text = document.createElement("h4");

        text.textContent = setting.label;

        text.style.margin = "4px 0";
        text.style.fontSize = "13px";
        text.style.fontWeight = "600";

        wrapper.appendChild(text);

        return wrapper;
    }


    if (setting.type === "info") {
        const text = document.createElement("div");

        text.textContent = setting.label;
        text.className = "info";

        text.style.margin = "4px 0";
        text.style.fontSize = "13px";
        text.style.fontWeight = "600";

        wrapper.appendChild(text);

        return wrapper;
    }


    const label = document.createElement("span");
    label.textContent = setting.label;
    wrapper.appendChild(label);

    if (setting.type === "toggle") {
        const control = document.createElement("label");
        control.className = "switch";

        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = !!(widgetState[setting.key] ?? setting.default);

        input.addEventListener("change", () => {
            saveWidgetSetting(setting.widgetKey, setting.key, input.checked);
        });

        const slider = document.createElement("span");
        slider.className = "slider";

        control.appendChild(input);
        control.appendChild(slider);
        wrapper.appendChild(control);
    } else {
        const isTextarea = setting.type === "textarea";
        const input = isTextarea
            ? document.createElement("textarea")
            : document.createElement("input");

        if (!isTextarea) {
            input.type = "text";
        }

        input.placeholder = setting.placeholder || "";
        input.value = widgetState[setting.key] ?? setting.default ?? "";
        input.style.width = "100%";
        input.style.padding = "10px";
        input.style.borderRadius = "10px";
        input.style.border = "none";
        input.style.outline = "none";
        input.style.background = "rgba(0,0,0,0.2)";
        input.style.color = "var(--text)";
        input.style.fontSize = "12px";
        input.style.boxSizing = "border-box";
        input.style.marginTop = "6px";

        if (isTextarea) {
            input.style.minHeight = "90px";
            input.style.resize = "vertical";
            input.style.overflow = "auto";
            input.style.scrollbarGutter = "stable";
        }

        input.addEventListener("input", () => {
            saveWidgetSetting(setting.widgetKey, setting.key, input.value);
        });

        wrapper.appendChild(input);
    }

    return wrapper;
}

function renderWidgetSettings(searchTerm = "") {
    loadWidgetSettingsConfig().then((widgets) => {
        getIntegrations((integrations) => {
            widgetSettingsContainer.innerHTML = "";

            widgets.forEach((widget) => {
                // widgetSettingsContainer.appendChild(document.createElement("br"));





                const search = searchTerm.trim().toLowerCase();

                const widgetMatches =
                    widget.title.toLowerCase().includes(search) ||
                    widget.key.toLowerCase().includes(search);

                const settingMatches = widget.settings.some(setting =>
                    Object.values(setting).some(value =>
                        String(value).toLowerCase().includes(search)
                    )
                );

                if (search && !widgetMatches && !settingMatches) {
                    return;
                }






                const section = document.createElement("div");
                section.style.marginTop = "12px";
                section.id = `addon-item`;

                const title = document.createElement("div");
                title.className = "title";
                title.textContent = widget.title;
                section.appendChild(title);

                const widgetState = integrations[widget.key] || {};

                widget.settings.forEach((setting) => {
                    const row = createSettingInput({ ...setting, widgetKey: widget.key }, widgetState);
                    section.appendChild(row);
                });


                widgetSettingsContainer.appendChild(section);
                // widgetSettingsContainer.appendChild(document.createElement("br"));

            });
        });
    });
}




renderWidgetSettings();
















// Opened as a full browser tab?
const isTab = new URLSearchParams(location.search).has("tab");
const isPreview = new URLSearchParams(location.search).has("preview");

if (isTab || true) {
    document.getElementById("openInTab")?.remove();
    document.getElementById("popupBanner")?.remove();

    // Apply styles for tab mode
    document.body.style.width = "min(100%, 550px)";
    document.body.style.padding = "32px";
    document.body.style.margin = "0 auto";

    document.body.style.zoom = "1.1";


} else {
    document.getElementById("openInTab")?.addEventListener("click", () => {
        const url = runtimeGetURL("popup.html?tab=1");

        if (hasChromeTabs) {
            chrome.tabs.create({ url });
        } else {
            window.open(url, "_blank");
        }

        window.close();
    });
}






// Make button to open addons page actuall work

document.getElementById("openAddonsPageButton")?.addEventListener("click", () => {
    const url = runtimeGetURL("addons.html?tab=1");

    if (hasChromeTabs) {
        chrome.tabs.create({ url });
    } else {
        window.open(url, "_blank");
    }

    window.close();
});









if (isPreview) {
    document.getElementById("openActualTabButton")?.addEventListener("click", () => {
        const url = runtimeGetURL("newtab.html?preview=1");

        document.getElementById("previewBanner")?.remove();
        window.open(url, "_blank");

    });
} else {
    document.getElementById("previewBanner")?.remove();
}




































// ===== IMPORT / EXPORT SETTINGS =====

const exportButton = document.getElementById("exportData");
const importButton = document.getElementById("importData");


// Export
if (exportButton) {
    exportButton.addEventListener("click", () => {
        storage.exportData("folio-backup.json");
    });
}


// Import
if (importButton) {
    importButton.addEventListener("click", () => {
        const input = document.createElement("input");

        input.type = "file";
        input.accept = ".json,application/json";

        input.onchange = () => {
            const file = input.files[0];

            if (!file) return;

            storage.importData(file, (success) => {
                if (success) {
                    alert("Folio settings imported successfully!");
                    location.reload();
                } else {
                    alert("Failed to import Folio settings.");
                }
            });
        };

        input.click();
    });
}




// ==========================================
// WIDGET SEARCH
// ==========================================

const widgetSearch = document.getElementById("widgetSearch");

if (widgetSearch) {
    widgetSearch.addEventListener("input", () => {
        renderWidgetSettings(widgetSearch.value);
    });
}









