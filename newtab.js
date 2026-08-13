


// ---------------------------------- Set up storage ------------------------------------------

const storage = window.folioStorage || {
  get(keys, callback) {
    callback({});
  },
  set(items, callback) {
    if (typeof callback === "function") setTimeout(() => callback(items), 0);
  }
};

const runtimeSendMessage = typeof chrome !== "undefined" && chrome?.runtime?.sendMessage ? chrome.runtime.sendMessage.bind(chrome.runtime) : null;

console.log("chrome.history:", !!chrome?.history);

// ------------------------------------------------------------------------------------------



// Storage keys
const SEARCH_BAR_KEY = "showSearchBar";



// Is it a preview?
const isPreview = new URLSearchParams(location.search).has("preview");

















async function loadSearchBar() {
  const container = document.getElementById("searchBar");

  const response = await fetch("bar.html");
  container.innerHTML = await response.text();

  const script = document.createElement("script");
  script.src = "bar.js";
  document.body.appendChild(script);
}


(async () => {

  await loadSearchBar();
  // -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  // Everything below this line happens after the bar is loaded.





  // Global storage

  const runtimeSendMessage = typeof chrome !== "undefined" && chrome?.runtime?.sendMessage
    ? chrome.runtime.sendMessage.bind(chrome.runtime)
    : null;













  /* =========================
     FOLIO DEFAULT CONFIG
     ========================= */

  const FOLIO_DEFAULTS = {
    // Background
    bgEnabled: true,
    bgImage: "Images/theme_bg.png",
    bgBlur: 15,
    bgRandom: false,
    bgUseImageLink: false,
    bgImageLink: "",

    // Search
    showSearchBar: true,

    // AI
    selectedAI: "chatgpt",

    // History
    showHistory: false,

    // Theme
    systemTheme: true
  };


  /* Apply defaults only when missing */
  function applyFolioDefaults() {
    storage.get(null, (data) => {
      const missing = {};

      for (const key in FOLIO_DEFAULTS) {
        if (data[key] === undefined) {
          missing[key] = FOLIO_DEFAULTS[key];
        }
      }

      if (Object.keys(missing).length > 0) {
        console.log("Folio: Applying default settings", missing);

        storage.set(missing, () => {
          location.reload();
        });
      }
    });
  }

  applyFolioDefaults();










  function setFavicon() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const icon = isDark
      ? "https://assets.msn.com/statics/icons/favicon_newtabpage_dark.png"
      : "https://assets.msn.com/statics/icons/favicon_newtabpage.png";

    document.getElementById("favicon").href = icon;
  }

  setFavicon();

  window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', setFavicon);

  /* ===== CANVAS STARFIELD ===== */
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  let w, h;
  const STAR_COUNT = 500;
  let stars = [];

  let pivot = { x: 0, y: 0 };
  let angle = 0;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;

    pivot.x = w / 2;
    pivot.y = -h;

    initStars();
  }
  window.addEventListener("resize", resize);
  resize();

  function initStars() {
    stars = [];
    const radius = Math.max(w, h) * 2.6;

    for (let i = 0; i < STAR_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * radius;

      stars.push({
        x: Math.cos(a) * r,
        y: Math.sin(a) * r,
        r: Math.random() * 0.9 + 0.08,
        alpha: 1,
        targetAlpha: 1
      });
    }
  }

  function rotate(x, y, cx, cy, a) {
    const s = Math.sin(a);
    const c = Math.cos(a);

    x -= cx;
    y -= cy;

    return {
      x: x * c - y * s + cx,
      y: x * s + y * c + cy
    };
  }

  function draw() {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    ctx.fillStyle = isDark ? "#212121" : "#f0f0f0";
    ctx.fillRect(0, 0, w, h);

    angle += 0.00012;

    for (let s of stars) {
      s.alpha += (s.targetAlpha - s.alpha) * 0.12;
      const p = rotate(s.x, s.y, pivot.x, pivot.y, angle);
      ctx.beginPath();
      ctx.arc(p.x, p.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(235,240,255,${s.alpha * 0.85})`
        : `rgba(30,30,60,${s.alpha * 0.6})`;   // dark blue-ish stars on light bg
      ctx.shadowBlur = 2;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }


  draw();






















  // ==========================================
  // AI SELECTOR
  // ==========================================

  let AI_MAP = {};

  const aiMenu = document.getElementById("aiMenu");
  const aiSelected = document.getElementById("aiSelected");
  const aiBubble = document.getElementById("aiBubble");

  let selectedAI = localStorage.getItem("selectedAI") || "chatgpt";


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

      console.log("Folio: Loaded AI providers:", AI_MAP);

      populateAISelector();

    } catch (error) {

      console.error(
        "Folio: Failed to load AI providers:",
        error
      );

    }
  }


  // ------------------------------------------
  // Populate dropdown
  // ------------------------------------------

  function populateAISelector() {

    if (!aiMenu) {
      console.error("Folio: #aiMenu not found");
      return;
    }

    aiMenu.innerHTML = "";

    Object.entries(AI_MAP).forEach(([key, ai]) => {

      const option = document.createElement("div");

      option.className = "ai-option";
      option.dataset.value = key;
      option.textContent = ai.name;

      aiMenu.appendChild(option);

    });

    initializeAISelector();
  }


  // ------------------------------------------
  // Initialize selector behavior
  // ------------------------------------------

  function initializeAISelector() {

    if (!aiMenu || !aiSelected || !aiBubble) {
      console.error("Folio: AI selector elements missing");
      return;
    }

    const aiOptions =
      aiMenu.querySelectorAll(".ai-option");


    // Make sure saved provider still exists
    if (!AI_MAP[selectedAI]) {
      selectedAI = "chatgpt";

      if (!AI_MAP[selectedAI]) {
        const firstAI = Object.keys(AI_MAP)[0];

        if (firstAI) {
          selectedAI = firstAI;
        }
      }

      localStorage.setItem(
        "selectedAI",
        selectedAI
      );

      storage.set({
        selectedAI
      });
    }


    // ----------------------------------------
    // Restore selected provider
    // ----------------------------------------

    aiOptions.forEach(opt => {

      const match =
        opt.dataset.value === selectedAI;

      opt.classList.toggle(
        "active",
        match
      );

      if (match) {

        aiSelected.firstChild.textContent =
          opt.textContent + " ";

      }

    });


    // ----------------------------------------
    // Toggle dropdown
    // ----------------------------------------

    aiBubble.onclick = (e) => {

      e.stopPropagation();

      aiBubble.classList.toggle("open");

    };


    // ----------------------------------------
    // Select provider
    // ----------------------------------------

    aiOptions.forEach(opt => {

      opt.addEventListener("click", (e) => {

        e.stopPropagation();

        selectedAI =
          opt.dataset.value;

        localStorage.setItem(
          "selectedAI",
          selectedAI
        );

        storage.set({
          selectedAI
        });


        aiSelected.firstChild.textContent =
          opt.textContent + " ";


        aiOptions.forEach(o => {

          o.classList.remove("active");

        });


        opt.classList.add("active");

        aiBubble.classList.remove("open");

      });

    });

  }


  // ------------------------------------------
  // Close dropdown when clicking elsewhere
  // ------------------------------------------

  document.addEventListener("click", () => {

    if (aiBubble) {
      aiBubble.classList.remove("open");
    }

  });


  // ------------------------------------------
  // ACTUALLY LOAD THE JSON
  // ------------------------------------------

  loadAIProviders();
















  /* --------------------------------- User settings --------------------------------- */













  /* =========================
     CUSTOM BACKGROUND SYSTEM
     ========================= */

  const RANDOM_KEY = "bgRandomCache";
  const RANDOM_ACTIVE_KEY = "bgRandom";
  const BG_USE_LINK_KEY = "bgUseImageLink";
  const BG_LINK_KEY = "bgImageLink";

  /* ---------- helper: create background layer ---------- */
  function createLayer() {
    const layer = document.createElement("div");
    layer.id = "bg-layer";

    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "0",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      pointerEvents: "none",
      opacity: "1"
    });

    document.body.prepend(layer);
    return layer;
  }

  /* ---------- helper: fetch random image ---------- */
  async function fetchRandomImageAsDataURL() {
    const url = `https://picsum.photos/1920/1080?random=${Date.now()}`;

    const res = await fetch(url, { cache: "no-store" });
    const blob = await res.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  /* ---------- apply image ---------- */
  function applyImage(layer, img, blur) {
    layer.style.backgroundImage = `url(${img})`;
    layer.style.filter = `blur(${blur}px)`;
    layer.style.opacity = "1";
  }

  /* ---------- MAIN ---------- */
  storage.get(
    ["bgImage", "bgEnabled", "bgBlur", RANDOM_KEY, RANDOM_ACTIVE_KEY, BG_USE_LINK_KEY, BG_LINK_KEY],
    async (data) => {

      const enabled = data.bgEnabled === true;
      const blur = data.bgBlur || 0;
      const randomOn = data[RANDOM_ACTIVE_KEY] === true;
      const useImageLink = data[BG_USE_LINK_KEY] === true;
      const imageLink = data[BG_LINK_KEY] || "";

      const canvas = document.getElementById("c");

      if (!enabled) return;

      let layer = document.getElementById("bg-layer");
      if (!layer) layer = createLayer();

      /* =========================
         USER IMAGE MODE
         ========================= */
      if (!randomOn) {
        if (useImageLink && imageLink) {
          applyImage(layer, imageLink, blur);
        } else {
          const img = data.bgImage || "";
          applyImage(layer, img, blur);
        }

        if (canvas) canvas.style.display = "block";
        return;
      }

      /* =========================
         RANDOM IMAGE MODE (FIXED)
         ========================= */

      let cached = data[RANDOM_KEY];

      // If no cache exists, fetch immediately
      if (!cached) {
        cached = await fetchRandomImageAsDataURL();
        storage.set({ [RANDOM_KEY]: cached });
      }

      applyImage(layer, cached, blur);

      if (canvas) canvas.style.display = "block";

      // Preload next image in background (non-blocking)
      fetchRandomImageAsDataURL()
        .then((img) => {
          storage.set({ [RANDOM_KEY]: img });
        })
        .catch((e) => console.warn("Random cache failed:", e));
    }
  );
  /* Redirect if the user wants */

  storage.get(
    ["redirectEnabled", "redirectUrl"],
    (data) => {
      if (data.redirectEnabled && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    }
  );





  /* Custom CSS Applier (LAST-WINS VERSION) */

  function applyCustomCSS() {
    console.log("CSS CHECK: running");

    storage.get(null, (data) => {
      const css = data.customCSS;

      if (!css) {
        console.log("CSS CHECK: no css found");
        return;
      }

      console.log("CSS CHECK: applying css");

      let styleTag = document.getElementById("custom-css");

      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "custom-css";
      }

      // always update content
      styleTag.textContent = css;

      // 🔥 FORCE IT TO BE LAST IN HEAD
      document.head.appendChild(styleTag);
    });
  }

  /* run AFTER full page load */
  window.addEventListener("load", () => {
    applyCustomCSS();

    // 🔥 catch late overrides from other scripts/extensions
    setTimeout(applyCustomCSS, 100);
    setTimeout(applyCustomCSS, 300);
  });







  /* Hide search bar if user wants */

  function updateSearchBarVisibility(enabled) {

    const searchBar = document.querySelector(".search-bar");
    const aiSelectorItem = document.querySelector(".ai-bubble");

    if (!searchBar || !aiSelectorItem)
      return;


    searchBar.style.display = enabled ? "" : "none";
    aiSelectorItem.style.display = enabled ? "" : "none";
  }


  // initial load
  storage.get(SEARCH_BAR_KEY, (data) => {
    updateSearchBarVisibility(data[SEARCH_BAR_KEY] ?? true);
  });


  // live updates
  storage.watch(SEARCH_BAR_KEY, (value) => {
    updateSearchBarVisibility(value ?? true);
  });


  /* ---------------------------------------------------------------------------------- */




















  // ===== HISTORY PANEL VISIBILITY =====
  function updateHistoryVisibility() {
    const historyPanel = document.getElementById("historyPanel");

    if (!historyPanel) return;

    storage.get("showHistory", (data) => {
      const enabled = data.showHistory === true;

      historyPanel.classList.toggle("hidden", !enabled || isPreview);
    });
  }

  // run on load
  window.addEventListener("load", updateHistoryVisibility);




















  function getDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  }

  function loadHistory() {
    const el = document.getElementById("historyList");
    if (!el) return;

    if ((!runtimeSendMessage) || isPreview) {
      el.innerHTML = `<div class="history-item"><div class="history-icon"></div><div class="history-text">History is unavailable in browser mode</div></div>`;
      return;
    }

    runtimeSendMessage({ action: "getHistory" }, (results = []) => {
      el.innerHTML = "";

      if (results.length === 0) {
        el.innerHTML = `<div class="history-item"><div class="history-icon"></div><div class="history-text">No recent activity</div></div>`;
        return;
      }

      results.forEach(item => {
        const domain = getDomain(item.url);
        const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;

        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
        <div class="history-icon" style="background-image: url('https://www.google.com/s2/favicons?sz=32&domain=${domain}')"></div>
        <div class="history-text">${domain}</div>
      `;
        div.onclick = () => location.href = item.url;
        el.appendChild(div);
      });
    });
  }

  window.addEventListener("load", () => setTimeout(loadHistory, 300));











  // Generic fetch helper for widgets

  window.folioFetch = async function (url, options = {}) {

    try {

      const response = await fetch(url, {
        method: options.method || "GET",
        headers: options.headers || {}
      });


      if (!response.ok) {

        console.error(
          "Fetch failed:",
          response.status,
          url
        );

        return null;

      }


      const type =
        options.type || "text";


      if (type === "json")
        return await response.json();


      return await response.text();

    }
    catch (error) {

      console.error(
        "Fetch error:",
        url,
        error
      );

      return null;

    }

  };




  loadAIProviders()

})(); // Everything above this line happens after the bar is loaded.
