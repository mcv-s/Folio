
import { createWidget } from "../widgetCore.js";


export async function init(chatgpt_usage) {



  const box = createWidget(
    "chatgpt-usage",
    "ChatGPT Usage"
  );


  box.style.overflow = "hidden";


  // ------------------------------------------
  // Reset information in the top bar
  // ------------------------------------------

  const resetInfo = document.createElement("div");

  resetInfo.className = "chatgpt-reset";

  resetInfo.style.cssText = `
    position:absolute;
    right:10px;
    top:7px;

    font-size:11px;

    opacity:0;

    white-space:nowrap;

    pointer-events:none;

    transition:opacity .15s ease;
  `;


  box.appendChild(resetInfo);



  // ------------------------------------------
  // Usage settings button
  // ------------------------------------------

  const usageButton = document.createElement("a");

  usageButton.className = "chatgpt-usage-button";

  usageButton.href =
    "https://chatgpt.com/#settings/Usage";

  usageButton.target = "_blank";

  usageButton.innerHTML =
    `<i class="ph ph-arrows-clockwise"></i>`;

  usageButton.style.cssText = `
  position:absolute;
  right:7px;
  top:37px;

  background:none;
  border:none;

  color:inherit;

  cursor:pointer;

  font-size:18px;

  opacity:0;

  text-decoration:none;

  transition:opacity .15s ease;
`;

  box.appendChild(usageButton);







  // ------------------------------------------
  // Optimal usage information in the bottom
  // ------------------------------------------

  const optimalInfo = document.createElement("div");

  optimalInfo.className = "chatgpt-optimal";

  optimalInfo.style.cssText = `
    position:absolute;
    left:50%;
    bottom:7px;

    transform:translateX(-50%);

    font-size:11px;

    opacity:0;

    white-space:nowrap;

    pointer-events:none;

    transition:opacity .4s ease;
  `;






  box.appendChild(optimalInfo);



  // Show more usage information when hovering
  // over the widget.


  box.addEventListener("mouseenter", () => {

    const optimalBar =
      content.querySelector(".chatgpt-optimal-bar");

    resetInfo.style.opacity = "0.6";
    optimalInfo.style.opacity = "0.6";
    usageButton.style.opacity = "0.6";

    if (optimalBar) {
      optimalBar.style.opacity = "0.6";
    }

  });


  box.addEventListener("mouseleave", () => {

    const optimalBar =
      content.querySelector(".chatgpt-optimal-bar");

    resetInfo.style.opacity = "0";
    optimalInfo.style.opacity = "0";
    usageButton.style.opacity = "0";

    if (optimalBar) {
      optimalBar.style.opacity = "0";
    }

  });


  // ------------------------------------------
  // Styles
  // ------------------------------------------

  const style = document.createElement("style");

  style.textContent = `

  #chatgpt-usage .widget-content {
    opacity: 0.8;
  }


    .chatgpt-content {

      display:flex;
      flex-direction:column;
      gap:10px;

      transform-origin:center;

      white-space:nowrap;

      box-sizing:border-box;

      padding:6px 10px;

    }


    .chatgpt-main {

      display:flex;
      align-items:center;
      justify-content:center;

      gap:16px;

    }


    .chatgpt-number {

      font-size:14px;
      font-weight:700;
      line-height:1;

    }


    .chatgpt-label {

      opacity:0.65;
      font-size:12px;

      margin-top:3px;

    }


    .chatgpt-progress {

      position:relative;

      width:160px;
      height:8px;

      background:rgba(127,127,127,0.25);

      border-radius:999px;

      overflow:hidden;

    }

    .chatgpt-optimal-bar {

      position:absolute;

      left:0;
      top:0;

      height:100%;

      border-radius:999px;

      opacity: 0;

      pointer-events:none;

      transition:opacity .4s ease;

    }


    .chatgpt-optimal-good {

      background:rgba(150, 220, 170, 0.85);

    }


    .chatgpt-optimal-bad {

      background:rgba(220, 120, 120, 0.55);

    }



    .chatgpt-progress-bar {

      height:100%;

      border-radius:999px;

      background:currentColor;

    }


    /* ---------------------------------------
       Tall
       --------------------------------------- */

    .chatgpt-tall .chatgpt-main {

      flex-direction:column;

      gap:8px;

    }


    .chatgpt-tall .chatgpt-progress {

      width:140px;

    }



    /* ---------------------------------------
       Small
       --------------------------------------- */

    .chatgpt-small {

      gap:5px;

      padding:4px 6px;

    }


    .chatgpt-small .chatgpt-main {

      flex-direction:column;

      gap:5px;

    }


    .chatgpt-small .chatgpt-number {

      font-size:30px;

    }


    .chatgpt-small .chatgpt-progress {

      width:100px;
      height:6px;

    }


    .chatgpt-small .chatgpt-label {

      font-size:10px;

      margin-top:2px;

    }


  `;


  document.head.appendChild(style);


  // ------------------------------------------
  // Responsive wrapper
  // ------------------------------------------

  const scaleWrapper = document.createElement("div");

  scaleWrapper.style.cssText = `
    width:100%;
    height:100%;
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
  `;

  box.appendChild(scaleWrapper);


  const content = document.createElement("div");

  content.className = "chatgpt-content";

  scaleWrapper.appendChild(content);


  // ------------------------------------------
  // Responsive scaling
  // ------------------------------------------

  const resizeObserver = new ResizeObserver(() => {

    const width = scaleWrapper.clientWidth;
    const height = scaleWrapper.clientHeight;


    content.classList.remove(
      "chatgpt-wide",
      "chatgpt-tall",
      "chatgpt-small"
    );


    let scale = 1;


    // Very small widget

    if (width < 160 || height < 80) {

      content.classList.add(
        "chatgpt-small"
      );


      scale = Math.min(
        width / 120,
        height / 85
      );

    }


    // Wide widget

    else if (width > height * 1.5) {

      content.classList.add(
        "chatgpt-wide"
      );


      scale = Math.min(
        width / 230,
        height / 50
      );

    }


    // Normal / tall widget

    else {

      content.classList.add(
        "chatgpt-tall"
      );


      scale = Math.min(
        width / 155,
        height / 100
      );

    }


    // Never allow the content to touch the edges.

    scale *= 0.90;


    content.style.transform =
      `scale(${Math.max(0.5, scale)})`;

  });


  resizeObserver.observe(scaleWrapper);







  
  // ------------------------------------------
  // Formatting
  // ------------------------------------------

  function formatResetTime(timestamp) {

    if (!timestamp) {
      return "Unknown";
    }


    const difference =
      (timestamp * 1000) - Date.now();


    if (difference <= 0) {
      return "Resetting soon";
    }


    const totalMinutes =
      Math.ceil(
        difference / (1000 * 60)
      );


    const days =
      Math.floor(
        totalMinutes / (60 * 24)
      );


    const hours =
      Math.floor(
        (totalMinutes % (60 * 24)) / 60
      );


    const minutes =
      totalMinutes % 60;


    if (days > 0) {

      return `Resets in ${days} day${days === 1 ? "" : "s"}`;

    }


    if (hours > 0) {

      return `Resets in ${hours} hour${hours === 1 ? "" : "s"}`;

    }


    return `Resets in ${minutes} minute${minutes === 1 ? "" : "s"}`;

  }



  function calculateOptimalRemaining(resetAt) {

    if (!resetAt) {
      return null;
    }


    const resetTime = resetAt * 1000;
    const now = Date.now();


    // If the reset time has passed, we're effectively
    // at the beginning of a new usage cycle.

    if (resetTime <= now) {
      return 100;
    }


    // Assume a monthly cycle and work backwards from
    // the reset date to determine when this cycle began.
    //
    // Using 30 days gives us roughly the desired
    // ~3% per day progression.

    const cycleLength =
      30 * 24 * 60 * 60 * 1000;


    const cycleStart =
      resetTime - cycleLength;


    const elapsed =
      Math.max(
        0,
        Math.min(
          cycleLength,
          now - cycleStart
        )
      );


    const progress =
      elapsed / cycleLength;


    const optimalRemaining =
      Math.round(
        100 - (progress * 100)
      );


    return Math.max(
      0,
      Math.min(100, optimalRemaining)
    );

  }






  // ------------------------------------------
  // Render
  // ------------------------------------------

  function render(usage) {

    if (!usage) {

      resetInfo.textContent = "";

      content.innerHTML = `

        <div style="
          opacity:0.6;
          font-size:12px;
          text-align:center;
        ">

          

        </div>

      `;

      return;

    }


    const used =
      Number(usage.usedPercent) || 0;


    const remaining =
      Math.max(0, 100 - used);


    // Update the top-bar reset text.

    resetInfo.textContent =
      formatResetTime(
        usage.resetAt
      );


    // Update the bottom-bar optimal usage text.

    const optimalRemaining =
      calculateOptimalRemaining(
        usage.resetAt
      );


    optimalInfo.textContent =
      optimalRemaining === null
        ? ""
        : `Optimal: ${optimalRemaining}%`;






    content.innerHTML = `


    

      <div class="chatgpt-main">

        <div>

          <div class="chatgpt-number">
            ${remaining}%
          </div>

          <div class="chatgpt-label">
            remaining
          </div>

        </div>


        <div class="chatgpt-progress">

          <div
            class="chatgpt-progress-bar"
            style="
              width:${remaining}%;
            "
          ></div>

          ${optimalRemaining !== null
        ? `
                <div
                  class="
                    chatgpt-optimal-bar
                    ${remaining >= optimalRemaining
          ? "chatgpt-optimal-good"
          : "chatgpt-optimal-bad"
        }
                  "
                  style="
                    width:${optimalRemaining}%;
                  "
                ></div>
              `
        : ""
      }

        </div>

      </div>

    `;

  }


  // ------------------------------------------
  // Load from extension storage
  // ------------------------------------------

  function loadUsage() {

    chrome.storage.local.get(
      "chatgptUsage",
      result => {

        if (chrome.runtime.lastError) {

          console.error(
            "[Folio] Failed to read ChatGPT usage:",
            chrome.runtime.lastError.message
          );

          render(null);

          return;

        }


        const usage =
          result.chatgptUsage || null;


        console.log(
          "[Folio] ChatGPT usage widget loaded:",
          usage
        );


        render(usage);

      }
    );

  }


  // ------------------------------------------
  // React immediately when storage changes
  // ------------------------------------------

  const storageListener = (
    changes,
    areaName
  ) => {

    if (
      areaName !== "local" ||
      !changes.chatgptUsage
    ) {
      return;
    }


    console.log(
      "[Folio] ChatGPT usage storage changed:",
      changes.chatgptUsage.newValue
    );


    render(
      changes.chatgptUsage.newValue
    );

  };


  chrome.storage.onChanged.addListener(
    storageListener
  );


  // ------------------------------------------
  // Keep reset countdown current
  // ------------------------------------------

  const resetTimer = setInterval(() => {

    chrome.storage.local.get(
      "chatgptUsage",
      result => {

        if (result.chatgptUsage) {

          render(
            result.chatgptUsage
          );

        }

      }
    );

  }, 60 * 1000);


  // ------------------------------------------
  // Initial load
  // ------------------------------------------

  loadUsage();


  // ------------------------------------------
  // Cleanup
  // ------------------------------------------

  return () => {

    resizeObserver.disconnect();

    chrome.storage.onChanged.removeListener(
      storageListener
    );

    clearInterval(resetTimer);

    resetInfo.remove();
    optimalInfo.remove();

    style.remove();

  };

}
