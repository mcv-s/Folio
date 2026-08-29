console.log("[Folio] content.js loaded on:", location.href);

const script = document.createElement("script");

script.src = chrome.runtime.getURL("page-hook.js");

script.onload = () => {
  console.log("[Folio] page-hook.js injected");
  script.remove();
};

script.onerror = error => {
  console.error("[Folio] FAILED to inject page-hook.js", error);
};

(document.head || document.documentElement).appendChild(script);







// Add message listener

window.addEventListener("message", event => {

  if (event.source !== window) return;

  if (event.data?.source !== "folio") return;

  if (event.data?.type !== "CHATGPT_USAGE") return;


  console.log(
    "[Folio] >>> USAGE RESPONSE RECEIVED <<<",
    event.data.data
  );


  chrome.runtime.sendMessage({
    type: "CHATGPT_USAGE",
    data: event.data.data
  }, response => {

    if (chrome.runtime.lastError) {

      console.error(
        "[Folio] Background message failed:",
        chrome.runtime.lastError.message
      );

      return;
    }


    console.log(
      "[Folio] Background acknowledged:",
      response
    );

  });

});




















let folioBar = null;


chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "open-folio-search") {
        toggleFolioBar();
    }
});



const style = document.createElement("link");
style.rel = "stylesheet";
style.href = chrome.runtime.getURL("bar.css");

document.documentElement.appendChild(style);



async function toggleFolioBar() {

    if (folioBar) {

        folioBar.style.opacity = "0";

        setTimeout(() => {
            folioBar.remove();
            folioBar = null;
        }, 180);

        return;
    }


    const response = await fetch(
        chrome.runtime.getURL("bar.html")
    );

    const html = await response.text();



    folioBar = document.createElement("div");
    folioBar.id = "folio-search-container";
    folioBar.className = "folio-overlay";


    Object.assign(folioBar.style, {
        position: "fixed",
        inset: "0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: "2147483647",

        opacity: "0",
        visibility: "hidden",
        transition: "opacity 0.05s ease",
    });


    // Add background blur layer without affecting children
    const blurStyle = document.createElement("style");

    blurStyle.textContent = `
    #folio-search-container::before {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.25);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        pointer-events: none;
    }

    #folio-search-container > * {
        position: relative;
        z-index: 1;
    }
`;

    document.head.appendChild(blurStyle);



    folioBar.innerHTML = html;

    const input = folioBar.querySelector("#aiInput");

    if (input) {
        input.focus();
    }



    document.body.appendChild(folioBar);


    folioBar.addEventListener("click", (e) => {

        const bar = folioBar.querySelector(".search-bar");

        if (!bar.contains(e.target)) {

            folioBar.style.opacity = "0";

            setTimeout(() => {
                folioBar.remove();
                folioBar = null;
            }, 180);

        }

    });



    if (!document.getElementById("folio-bar-script")) {

        const script = document.createElement("script");
        script.id = "folio-bar-script";
        script.src = chrome.runtime.getURL("bar.js");
        document.head.appendChild(script);

    }



    folioBar.offsetHeight;


    requestAnimationFrame(() => {
        folioBar.style.visibility = "visible";

        requestAnimationFrame(() => {
            folioBar.style.opacity = "1";
        });
    });
}