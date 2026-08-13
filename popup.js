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

// ===== STORAGE KEYS =====
const ENTER_KEY = "enterLaunch";
const SEARCH_BAR_KEY = "showSearchBar";
const REDIRECT_ENABLED_KEY = "redirectEnabled";
const REDIRECT_URL_KEY = "redirectUrl";
const SHOW_HISTORY_KEY = "showHistory";
const GRID_SNAP_KEY = "widgetGridSnap";
const SITELAUNCHER_KEY = "siteLauncher";
const AUTO_SUGGEST_KEY = "autoSuggest";
const CONTEXT_MENU_KEY = "askAiContextMenu";




// ===== ENTER TO SUBMIT =====
const enterToggle = document.getElementById("enterToggle");
enterToggle.checked = localStorage.getItem(ENTER_KEY) !== "false";

enterToggle.addEventListener("change", e => {
  localStorage.setItem(ENTER_KEY, e.target.checked);
});





// ===== SHOW SEARCH BAR =====
const searchBarToggle = document.getElementById("searchBarToggle");

storage.get(SEARCH_BAR_KEY, (data) => {
  searchBarToggle.checked = data[SEARCH_BAR_KEY] ?? true;
});

searchBarToggle.addEventListener("change", e => {
  storage.set({
    [SEARCH_BAR_KEY]: e.target.checked
  });
});















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






// ===== CUSTOM CSS STORAGE =====
const cssBox = document.getElementById("cssBox");

storage.get("customCSS", (data) => {
  cssBox.value = data.customCSS || "";
});

document.getElementById("saveCss").addEventListener("click", () => {
  storage.set({
    customCSS: cssBox.value
  });
});

















// ===== 24-HOUR TIME =====
const _24hourTimeToggle = document.getElementById("_24hourTimeToggle");

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

// restore state (default = false)
storage.get("24hourTime", (data) => {
  _24hourTimeToggle.checked = data["24hourTime"] === true;
});

// save on change
_24hourTimeToggle.addEventListener("change", (e) => {
  storage.set({
    "24hourTime": e.target.checked
  });
});













// ===== SHOW HISTORY =====
const showHistoryToggle = document.getElementById("showHistory");


// restore state (default = false)
storage.get(SHOW_HISTORY_KEY, (data) => {
  showHistoryToggle.checked = data[SHOW_HISTORY_KEY] === true;
});

// save on change
showHistoryToggle.addEventListener("change", (e) => {
  storage.set({
    [SHOW_HISTORY_KEY]: e.target.checked
  });
});







// ===== SITE LAUNCHER =====
const siteLauncherToggle = document.getElementById("siteLauncher");

// restore state (default = true)
storage.get(SITELAUNCHER_KEY, (data) => {
  siteLauncherToggle.checked = data[SITELAUNCHER_KEY] ?? true;
});

// save on change
siteLauncherToggle.addEventListener("change", (e) => {
  storage.set({
    [SITELAUNCHER_KEY]: e.target.checked
  });
});





// ===== AUTOSUGGEST =====
const autoSuggestToggle = document.getElementById("autoSuggest");

// restore state (default = true)
storage.get(AUTO_SUGGEST_KEY, (data) => {
  autoSuggestToggle.checked = data[AUTO_SUGGEST_KEY] ?? true;
});

// save on change
autoSuggestToggle.addEventListener("change", (e) => {
  storage.set({
    [AUTO_SUGGEST_KEY]: e.target.checked
  });
});









// ==========================================
// AI PROVIDER SELECTOR
// ==========================================

const AI_PROVIDER_KEY = "selectedAI";

let AI_MAP = {};

const aiProviderSelect =
  document.getElementById("aiProvider");


// ------------------------------------------
// Load AI providers from JSON
// ------------------------------------------

async function loadAIProviders() {

  try {

    const response = await fetch(
      chrome.runtime.getURL("aiProviders.json")
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    AI_MAP = await response.json();

    console.log(
      "Folio: Loaded AI providers:",
      AI_MAP
    );

    populateAIProviderSelector();

  } catch (error) {

    console.error(
      "Folio: Failed to load AI providers:",
      error
    );

  }

}


// ------------------------------------------
// Populate selector
// ------------------------------------------

function populateAIProviderSelector() {

  if (!aiProviderSelect) {
    console.error(
      "Folio: #aiProvider not found"
    );
    return;
  }

  aiProviderSelect.innerHTML = "";

  Object.entries(AI_MAP).forEach(
    ([key, ai]) => {

      const option =
        document.createElement("option");

      option.value = key;
      option.textContent = ai.name;

      aiProviderSelect.appendChild(option);

    }
  );


  // ----------------------------------------
  // Restore saved provider
  // ----------------------------------------

  const savedAI =
    localStorage.getItem(AI_PROVIDER_KEY);

  let selectedAI =
    savedAI || "chatgpt";


  // Make sure the saved provider exists
  if (!AI_MAP[selectedAI]) {

    selectedAI = "chatgpt";

    if (!AI_MAP[selectedAI]) {

      const firstProvider =
        Object.keys(AI_MAP)[0];

      if (firstProvider) {
        selectedAI = firstProvider;
      }

    }


    // Keep BOTH storage systems synchronized
    localStorage.setItem(
      AI_PROVIDER_KEY,
      selectedAI
    );

    storage.set({
      [AI_PROVIDER_KEY]: selectedAI
    });

  }


  aiProviderSelect.value = selectedAI;

}


// ------------------------------------------
// Save provider when changed
// ------------------------------------------

if (aiProviderSelect) {

  aiProviderSelect.addEventListener(
    "change",
    () => {

      const selectedAI =
        aiProviderSelect.value;


      // SAME storage used by newtab.js
      localStorage.setItem(
        AI_PROVIDER_KEY,
        selectedAI
      );


      // Also keep Folio storage synchronized
      storage.set({
        [AI_PROVIDER_KEY]: selectedAI
      });


      console.log(
        "Folio: Selected AI saved:",
        selectedAI
      );

    }
  );

}


// ------------------------------------------
// Start
// ------------------------------------------

loadAIProviders();



































// Image enabled storage

const BG_ENABLED_KEY = "bgEnabled";
const BG_USE_LINK_KEY = "bgUseImageLink";
const BG_LINK_KEY = "bgImageLink";
const bgToggle = document.getElementById("bgToggle");
const bgLinkToggle = document.getElementById("bgLinkToggle");
const bgLinkInput = document.getElementById("bgLink");

// restore state
storage.get([BG_ENABLED_KEY, BG_USE_LINK_KEY, BG_LINK_KEY], (data) => {
  bgToggle.checked = data[BG_ENABLED_KEY] === true;
  bgLinkToggle.checked = data[BG_USE_LINK_KEY] === true;
  bgLinkInput.value = data[BG_LINK_KEY] || "";
});

// save state on change
bgToggle.addEventListener("change", (e) => {
  storage.set({
    [BG_ENABLED_KEY]: e.target.checked
  });
});

bgLinkToggle.addEventListener("change", (e) => {
  storage.set({
    [BG_USE_LINK_KEY]: e.target.checked
  });
});

bgLinkInput.addEventListener("input", (e) => {
  storage.set({
    [BG_LINK_KEY]: e.target.value
  });
});

















// ===== BACKGROUND IMAGE STORAGE =====
const BG_KEY = "bgImage";

// elements
const bgUpload = document.getElementById("bgUpload");
const bgCard = bgUpload.closest(".card");

// create preview element (insert above upload button)
// wrapper gives us proper cropping behavior
const previewWrapper = document.createElement("div");
previewWrapper.style.width = "100%";
previewWrapper.style.aspectRatio = "16 / 9";
previewWrapper.style.borderRadius = "10px";
previewWrapper.style.overflow = "hidden";
previewWrapper.style.marginBottom = "8px";

previewWrapper.style.display = "none";

// actual image
const preview = document.createElement("img");
preview.style.width = "100%";
preview.style.height = "100%";
preview.style.objectFit = "cover";
preview.style.display = "none";

// build structure
previewWrapper.appendChild(preview);

const uploadBtn = bgUpload.closest(".upload-btn");
uploadBtn.parentNode.insertBefore(previewWrapper, uploadBtn);

// load saved image
storage.get(BG_KEY, (data) => {
  const img = data[BG_KEY];

  if (img) {
    preview.src = img;
    preview.style.display = "block";
    previewWrapper.style.display = "block";
  } else {
    previewWrapper.style.display = "none";
  }
});

// when user uploads image
bgUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    const imgData = reader.result;

    // save to storage
    storage.set({
      [BG_KEY]: imgData
    });

    // show preview
    preview.src = imgData;
    preview.style.display = "block";
    previewWrapper.style.display = "block";
    preview.style.filter = `blur(${blurSlider.value / 100}px)`;
  };

  reader.readAsDataURL(file);
});


const BLUR_KEY = "bgBlur";
const blurSlider = document.getElementById("blurSlider");

// restore
storage.get(BLUR_KEY, (data) => {
  blurSlider.value = data[BLUR_KEY] || 0;
  preview.style.filter = `blur(${blurSlider.value}px)`;
});

// save
blurSlider.addEventListener("input", (e) => {
  const value = Number(e.target.value);
  storage.set({
    [BLUR_KEY]: value
  });
  preview.style.filter = `blur(${value}px)`;
});












// ===== RANDOM BACKGROUND (CHROME STORAGE) =====
const RANDOM_KEY = "bgRandom";
const randomToggle = document.getElementById("toggleRandom");

// restore state (DEFAULT = OFF)
storage.get(RANDOM_KEY, (data) => {
  randomToggle.checked = data[RANDOM_KEY] === true;
});

// save on change
randomToggle.addEventListener("change", (e) => {
  storage.set({
    [RANDOM_KEY]: e.target.checked
  });
});











// ===== REDIRECT TOGGLE =====
const redirectToggle = document.getElementById("redirectToggle");
const redirectUrlInput = document.getElementById("redirectUrl");

// restore toggle
storage.get(REDIRECT_ENABLED_KEY, (data) => {
  redirectToggle.checked = data[REDIRECT_ENABLED_KEY] === true;
});

// save toggle
redirectToggle.addEventListener("change", (e) => {
  storage.set({
    [REDIRECT_ENABLED_KEY]: e.target.checked
  });
});

// restore URL
storage.get(REDIRECT_URL_KEY, (data) => {
  redirectUrlInput.value = data[REDIRECT_URL_KEY] || "";
});

// save URL (on input)
redirectUrlInput.addEventListener("input", (e) => {
  storage.set({
    [REDIRECT_URL_KEY]: e.target.value
  });
});




















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

    text.style.margin = "8px 0";
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
        widgetSettingsContainer.appendChild(document.createElement("hr"));

      });
    });
  });
}

renderWidgetSettings();
















// Opened as a full browser tab?
const isTab = new URLSearchParams(location.search).has("tab");
const isPreview = new URLSearchParams(location.search).has("preview");

if (isTab) {
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









