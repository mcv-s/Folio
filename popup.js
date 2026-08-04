// ===== STORAGE KEYS =====
const ENTER_KEY = "enterLaunch";
const SEARCH_BAR_KEY = "showSearchBar";
const REDIRECT_ENABLED_KEY = "redirectEnabled";
const REDIRECT_URL_KEY = "redirectUrl";
const SHOW_HISTORY_KEY = "showHistory";
const GRID_SNAP_KEY = "widgetGridSnap";




// ===== ENTER TO SUBMIT =====
const enterToggle = document.getElementById("enterToggle");
enterToggle.checked = localStorage.getItem(ENTER_KEY) !== "false";

enterToggle.addEventListener("change", e => {
  localStorage.setItem(ENTER_KEY, e.target.checked);
});





// ===== SHOW SEARCH BAR =====
const searchBarToggle = document.getElementById("searchBarToggle");
searchBarToggle.checked = localStorage.getItem(SEARCH_BAR_KEY) !== "false";

searchBarToggle.addEventListener("change", e => {
  localStorage.setItem(SEARCH_BAR_KEY, e.target.checked);
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

chrome.storage.local.get("customCSS", (data) => {
  cssBox.value = data.customCSS || "";
});

document.getElementById("saveCss").addEventListener("click", () => {
  chrome.storage.local.set({
    customCSS: cssBox.value
  });
});





// ===== 24-HOUR TIME =====
const _24hourTimeToggle = document.getElementById("_24hourTimeToggle");

const widgetGridSnapToggle = document.getElementById("widgetGridSnapToggle");

if (widgetGridSnapToggle) {
  chrome.storage.local.get(GRID_SNAP_KEY, (data) => {
    const saved = data[GRID_SNAP_KEY] ?? localStorage.getItem(GRID_SNAP_KEY) === "true";
    widgetGridSnapToggle.checked = saved === true;
    localStorage.setItem(GRID_SNAP_KEY, String(saved));
  });

  widgetGridSnapToggle.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    localStorage.setItem(GRID_SNAP_KEY, String(enabled));
    chrome.storage.local.set({ [GRID_SNAP_KEY]: enabled });
  });
}

// restore state (default = false)
chrome.storage.local.get("24hourTime", (data) => {
  _24hourTimeToggle.checked = data["24hourTime"] === true;
});

// save on change
_24hourTimeToggle.addEventListener("change", (e) => {
  chrome.storage.local.set({
    "24hourTime": e.target.checked
  });
});













// ===== SHOW HISTORY =====
const showHistoryToggle = document.getElementById("showHistory");

// restore state (default = false)
chrome.storage.local.get(SHOW_HISTORY_KEY, (data) => {
  showHistoryToggle.checked = data[SHOW_HISTORY_KEY] === true;
});

// save on change
showHistoryToggle.addEventListener("change", (e) => {
  chrome.storage.local.set({
    [SHOW_HISTORY_KEY]: e.target.checked
  });
});





















// Image enabled storage

const BG_ENABLED_KEY = "bgEnabled";
const bgToggle = document.getElementById("bgToggle");


// restore state
chrome.storage.local.get(BG_ENABLED_KEY, (data) => {
  bgToggle.checked = data[BG_ENABLED_KEY] === true;
});

// save state on change
bgToggle.addEventListener("change", (e) => {
  chrome.storage.local.set({
    [BG_ENABLED_KEY]: e.target.checked
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
chrome.storage.local.get(BG_KEY, (data) => {
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
    chrome.storage.local.set({
      [BG_KEY]: imgData
    });

    // show preview
    preview.src = imgData;
    preview.style.display = "block";
    previewWrapper.style.display = "block";
  };

  reader.readAsDataURL(file);
});


const BLUR_KEY = "bgBlur";
const blurSlider = document.getElementById("blurSlider");

// restore
chrome.storage.local.get(BLUR_KEY, (data) => {
  blurSlider.value = data[BLUR_KEY] || 0;
});

// save
blurSlider.addEventListener("input", (e) => {
  chrome.storage.local.set({
    [BLUR_KEY]: Number(e.target.value)
  });
});












// ===== RANDOM BACKGROUND (CHROME STORAGE) =====
const RANDOM_KEY = "bgRandom";
const randomToggle = document.getElementById("toggleRandom");

// restore state (DEFAULT = OFF)
chrome.storage.local.get(RANDOM_KEY, (data) => {
  randomToggle.checked = data[RANDOM_KEY] === true;
});

// save on change
randomToggle.addEventListener("change", (e) => {
  chrome.storage.local.set({
    [RANDOM_KEY]: e.target.checked
  });
});











// ===== REDIRECT TOGGLE =====
const redirectToggle = document.getElementById("redirectToggle");
const redirectUrlInput = document.getElementById("redirectUrl");

// restore toggle
chrome.storage.local.get(REDIRECT_ENABLED_KEY, (data) => {
  redirectToggle.checked = data[REDIRECT_ENABLED_KEY] === true;
});

// save toggle
redirectToggle.addEventListener("change", (e) => {
  chrome.storage.local.set({
    [REDIRECT_ENABLED_KEY]: e.target.checked
  });
});

// restore URL
chrome.storage.local.get(REDIRECT_URL_KEY, (data) => {
  redirectUrlInput.value = data[REDIRECT_URL_KEY] || "";
});

// save URL (on input)
redirectUrlInput.addEventListener("input", (e) => {
  chrome.storage.local.set({
    [REDIRECT_URL_KEY]: e.target.value
  });
});




















// ---------- Integrations -------------

const INTEGRATIONS_KEY = "integrations";
const WIDGET_SETTINGS_URL = "widgetSettings.json";
const widgetSettingsContainer = document.getElementById("widgetSettingsContainer");

function getIntegrations(cb) {
  chrome.storage.local.get(INTEGRATIONS_KEY, (data) => {
    cb(data[INTEGRATIONS_KEY] || {});
  });
}

function setIntegrations(update) {
  chrome.storage.local.get(INTEGRATIONS_KEY, (data) => {
    const current = data[INTEGRATIONS_KEY] || {};
    const next = { ...current, ...update };

    chrome.storage.local.set({
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
    }

    input.addEventListener("input", () => {
      saveWidgetSetting(setting.widgetKey, setting.key, input.value);
    });

    wrapper.appendChild(input);
  }

  return wrapper;
}

function renderWidgetSettings() {
  loadWidgetSettingsConfig().then((widgets) => {
    getIntegrations((integrations) => {
      widgetSettingsContainer.innerHTML = "";

      widgets.forEach((widget) => {
        widgetSettingsContainer.appendChild(document.createElement("br"));

        
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
      });
    });
  });
}

renderWidgetSettings();




