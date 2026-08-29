

// Loading Storage System
const storage = {
  get(keys, callback) {
    chrome.storage.local.get(keys, callback);
  },

  set(items, callback) {
    chrome.storage.local.set(items, callback);
  }
};

const SITELAUNCHER_KEY = "siteLauncher";







let AI_MAP = {};

fetch(chrome.runtime.getURL("aiProviders.json"))
  .then(response => response.json())
  .then(data => {
    AI_MAP = data;
  })
  .catch(error => {
    console.error("Failed to load AI providers:", error);
  });







const DEFAULT_AI = "grok";

const MENU_ID = "ask-ai";

/* -----------------------------
   SAFE STORAGE READ
------------------------------*/
function getAI(cb) {
  chrome.storage.local.get("selectedAI", (data) => {
    const ai = data.selectedAI;
    cb(AI_MAP[ai] ? ai : DEFAULT_AI);
  });
}






/* -----------------------------
   MENU TITLE UPDATE (IMPORTANT)
------------------------------*/
function updateMenu() {
  getAI((aiKey) => {
    const name = AI_MAP[aiKey].name;

    chrome.contextMenus.update(MENU_ID, {
      title: `Ask ${name} about "%s"`
    }, () => {
      // ignore harmless errors during service worker wake
      void chrome.runtime.lastError;
    });
  });
}


const CONTEXT_MENU_KEY = "askAiContextMenu";

/* -----------------------------
   CONTEXT MENU
-----------------------------*/

function updateMenu() {
  getAI((aiKey) => {
    const name = AI_MAP[aiKey].name;

    chrome.contextMenus.update(MENU_ID, {
      title: `Ask ${name} about "%s"`
    }, () => {
      void chrome.runtime.lastError;
    });
  });
}

function createAskAIContextMenu() {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Ask AI about \"%s\"",
    contexts: ["selection"]
  }, () => {
    if (chrome.runtime.lastError) {
      void chrome.runtime.lastError;
      return;
    }

    updateMenu();
  });
}

function removeAskAIContextMenu() {
  chrome.contextMenus.remove(MENU_ID, () => {
    void chrome.runtime.lastError;
  });
}

function syncAskAIContextMenu() {
  chrome.storage.local.get(CONTEXT_MENU_KEY, (data) => {
    const enabled = data[CONTEXT_MENU_KEY] ?? true;

    if (enabled) {
      createAskAIContextMenu();
    } else {
      removeAskAIContextMenu();
    }
  });
}


/* -----------------------------
   INIT
-----------------------------*/

function init() {
  chrome.contextMenus.removeAll(() => {
    syncAskAIContextMenu();
  });
}


/* -----------------------------
   EVENTS
-----------------------------*/

chrome.runtime.onInstalled.addListener(() => {
  init();
});

chrome.runtime.onStartup.addListener(() => {
  init();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;

  // AI selection changed
  if (changes.selectedAI) {
    updateMenu();
  }

  // Context-menu setting changed
  if (changes[CONTEXT_MENU_KEY]) {
    syncAskAIContextMenu();
  }
});













/* -----------------------------
   CLICK HANDLER
------------------------------*/
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;

  const text = info.selectionText || "";

  getAI((aiKey) => {
    const ai = AI_MAP[aiKey];

    const prompt = `tell me about "${text}"`;

    const url = ai.url + encodeURIComponent(prompt);

    chrome.tabs.create({ url });
  });
});









// Get recent history
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {

  if (req.action === "getHistory") {
    chrome.history.search(
      { text: "", maxResults: 20, startTime: 0 },
      sendResponse
    );
    return true;
  }

  if (req.action === "autocomplete") {

    fetch(
      "https://duckduckgo.com/ac/?q=" +
      encodeURIComponent(req.query)
    )
      .then(r => r.json())
      .then(data => sendResponse(data.map(x => x.phrase)))
      .catch(() => sendResponse([]));

    return true;
  }

});











chrome.commands.onCommand.addListener(async (command) => {

  if (command === "open-folio-search") {

    storage.get(SITELAUNCHER_KEY, async (data) => {

      const enabled = data[SITELAUNCHER_KEY] ?? true;

      if (!enabled) return;


      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });


      if (!tab?.id) return;


      chrome.tabs.sendMessage(tab.id, {
        action: "open-folio-search"
      });

    });

  }

});















chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  console.log("[Folio] Background received message:", message);


  if (message.type !== "CHATGPT_USAGE") {
    return;
  }


  const data = message.data;

  const primaryWindow =
    data?.rate_limit?.primary_window;


  if (!primaryWindow) {

    console.error(
      "[Folio] No primary usage window found!"
    );

    sendResponse({
      ok: false,
      error: "No primary usage window"
    });

    return;
  }


  const usage = {

    usedPercent:
      primaryWindow.used_percent,

    limitWindowSeconds:
      primaryWindow.limit_window_seconds,

    resetAfterSeconds:
      primaryWindow.reset_after_seconds,

    resetAt:
      primaryWindow.reset_at,

    lastUpdated:
      Date.now()

  };


  console.log(
    "[Folio] About to save usage:",
    usage
  );


  chrome.storage.local.set(
    {
      chatgptUsage: usage
    },
    () => {

      if (chrome.runtime.lastError) {

        console.error(
          "[Folio] STORAGE ERROR:",
          chrome.runtime.lastError.message
        );

        sendResponse({
          ok: false,
          error: chrome.runtime.lastError.message
        });

        return;
      }


      console.log(
        `[Folio] Saved usage percentage (${usage.usedPercent}%) to storage`
      );

      console.log(
        `[Folio] Saved usage reset date (${new Date(
          usage.resetAt * 1000
        ).toLocaleString()}) to storage`
      );

      console.log(
        `[Folio] Saved reset countdown (${usage.resetAfterSeconds} seconds) to storage`
      );

      console.log(
        `[Folio] Saved usage window (${usage.limitWindowSeconds} seconds) to storage`
      );

      console.log(
        `[Folio] Saved last updated (${new Date(
          usage.lastUpdated
        ).toLocaleString()}) to storage`
      );


      console.log(
        "[Folio] >>> CHATGPT USAGE SAVED <<<",
        usage
      );


      sendResponse({
        ok: true,
        usage: usage
      });

    }
  );


  // IMPORTANT:
  // chrome.storage.local.set() is asynchronous.
  // Keep the message channel alive until its callback runs.
  return true;

});

















