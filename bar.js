const input = document.getElementById("aiInput");
const sendBtn = document.querySelector(".send");
const bar = document.querySelector(".search-bar");
const autocomplete = document.getElementById("autocomplete");
const ghost = document.getElementById("ghostText");


let selectedAI = localStorage.getItem("selectedAI") || "chatgpt";



bar.style.transition = "border-radius 0.18s ease, padding 0.18s ease";
input.style.transition = "height 0.12s ease";

function updateShape(isMultiLine) {
    if (!isMultiLine) {
        bar.style.borderRadius = "999px";
        bar.style.padding = "10px 14px 10px 18px";
        ghost.style.padding = "19px 10px 0px 0px";
        ghost.style.opacity = "1";
    } else {
        bar.style.borderRadius = "18px";
        bar.style.padding = "14px 14px 14px 18px";
        ghost.style.padding = "23px 10px 0px 0px";
        ghost.style.opacity = "0";
    }
}

let collapsedHeight = 0;

input.style.height = "auto";
collapsedHeight = input.scrollHeight;
updateShape(false);

input.addEventListener("input", () => {
    const lineHeight = parseFloat(getComputedStyle(input).lineHeight);
    const max = lineHeight * 9;

    input.style.height = "auto";

    const contentHeight = input.scrollHeight;
    const isMultiLine = contentHeight > collapsedHeight;

    input.style.height = isMultiLine
        ? Math.min(contentHeight, max) + "px"
        : "auto";

    updateShape(isMultiLine);
});










// -----------------------------------------------------------------------------
// Predictive Autocomplete
// Uses DuckDuckGo suggestions.
// Later replace fetchSuggestions() with AI/history/etc.
// -----------------------------------------------------------------------------

let currentCompletion = "";
let suggestionTimer = null;


async function fetchSuggestions(query) {
    if (!query.trim())
        return [];

    try {
        const response = await fetch(
            "https://duckduckgo.com/ac/?q=" + encodeURIComponent(query)
        );

        const data = await response.json();

        return data.map(item => item.phrase);

    } catch (err) {
        console.warn("Autocomplete failed:", err);
        return [];
    }
}


async function getCompletion(query) {
    const suggestions = await fetchSuggestions(query);

    if (!suggestions.length)
        return "";

    const lower = query.toLowerCase();

    // Pick the first suggestion that starts with what the user typed
    const match = suggestions.find(item =>
        item.toLowerCase().startsWith(lower)
    );

    if (!match)
        return "";

    return match.substring(query.length);
}


async function updateCompletion() {

    const ghost = document.getElementById("ghostText");

    // Hide old prediction immediately
    currentCompletion = "";

    if (ghost)
        ghost.innerHTML = "";


    clearTimeout(suggestionTimer);

    suggestionTimer = setTimeout(async () => {

        currentCompletion = await getCompletion(input.value);

        if (ghost && currentCompletion) {
            ghost.innerHTML =
                "<span class='typed'>" +
                input.value.replace(/</g, "&lt;") +
                "</span>" +
                currentCompletion;
        }

    }, 200);
}






input.addEventListener("input", () => {
    updateCompletion();
    updateSendIcon();
});




input.addEventListener("keydown", e => {

    if (
        e.key === "Tab" &&
        currentCompletion &&
        input.selectionStart === input.value.length &&
        input.selectionEnd === input.value.length
    ) {

        e.preventDefault();

        input.value += currentCompletion;

        currentCompletion = "";

        updateCompletion();
    }

});


input.addEventListener("blur", () => {
    currentCompletion = "";

    const ghost = document.getElementById("ghostText");
    if (ghost)
        ghost.innerHTML = "";
});






const inputType = identifyInput(input.value);


// Icon Update


function updateSendIcon() {

    const icon = document.getElementById("sendIcon");

    const type = identifyInput(input.value);


    if (type === "website") {


        icon.setAttribute("viewBox", "0 0 256 256");

        icon.innerHTML = `
            <path d="M240,88.23a54.43,54.43,0,0,1-16,37L189.25,160a54.27,54.27,0,0,1-38.63,16h-.05A54.63,54.63,0,0,1,96,119.84a8,8,0,0,1,16,.45A38.62,38.62,0,0,0,150.58,160h0a38.39,38.39,0,0,0,27.31-11.31l34.75-34.75a38.63,38.63,0,0,0-54.63-54.63l-11,11A8,8,0,0,1,135.7,59l11-11A54.65,54.65,0,0,1,224,48,54.86,54.86,0,0,1,240,88.23ZM109,185.66l-11,11A38.41,38.41,0,0,1,70.6,208h0a38.63,38.63,0,0,1-27.29-65.94L78,107.31A38.63,38.63,0,0,1,144,135.71a8,8,0,0,0,16,.45A54.86,54.86,0,0,0,144,96a54.65,54.65,0,0,0-77.27,0L32,130.75A54.62,54.62,0,0,0,70.56,224h0a54.28,54.28,0,0,0,38.64-16l11-11A8,8,0,0,0,109,185.66Z"/>
        `;

    }

    else if (type === "file") {

        icon.setAttribute("viewBox", "0 0 256 256");

        icon.innerHTML = `
        <path d="M213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160ZM200,216H56V40h88V88a8,8,0,0,0,8,8h48V216Z"/>
        `;

    }

    else {

        icon.setAttribute("viewBox", "0 0 24 24");

        icon.innerHTML = `
        <path d="M10 17l5-5-5-5v10z"/>
        `;

    }
}










function identifyInput(text) {

    text = text.trim();

    if (!text)
        return "empty";


    if (isWebsite(text))
        return "website";


    if (isFilePath(text))
        return "file";


    return "search";
}


// -----------------------------------------------------------------------------
// Destination detection
// -----------------------------------------------------------------------------

function isWebsite(text) {
    text = text.trim();

    if (!text)
        return false;

    let urlText = text;

    if (!/^https?:\/\//i.test(urlText)) {
        urlText = "https://" + urlText;
    }

    try {
        const url = new URL(urlText);

        const hostname = url.hostname;

        if (!hostname.includes("."))
            return false;

        if (/\s/.test(hostname))
            return false;

        const parts = hostname.split(".");

        return parts.length >= 2 &&
            parts[parts.length - 1].length >= 2;

    } catch {
        return false;
    }
}


function isFilePath(text) {
    text = text.trim();

    if (!text)
        return false;


    // Windows paths
    if (/^[a-zA-Z]:[\\/]/.test(text))
        return true;


    // Unix paths
    if (/^\//.test(text))
        return true;


    // Relative files
    if (
        /\.(html?|css|js|json|txt|png|jpg|jpeg|gif|svg|pdf|zip|mp4|mp3)$/i.test(text)
    )
        return true;


    return false;
}














function launch() {

    const text = input.value.trim();

    const type = identifyInput(text);


    if (type === "website") {

        window.location.href =
            text.startsWith("http")
            ? text
            : "https://" + text;

        return;
    }


    if (type === "file") {

        window.location.href = text;
        return;

    }



    const ai = localStorage.getItem("selectedAI") || "chatgpt";

    let baseUrl = "https://chatgpt.com/?&q=";

    if (ai === "claude")
        baseUrl = "https://claude.ai/new?q=";

    else if (ai === "grok")
        baseUrl = "https://grok.com/?q=";

    else if (ai === "perplexity")
        baseUrl = "https://www.perplexity.ai/search?q=";

    else if (ai === "mistral")
        baseUrl = "https://chat.mistral.ai/chat?q=";

    else if (ai === "copilot")
        baseUrl = "https://www.bing.com/copilotsearch?q=";


    window.location.href =
        baseUrl + encodeURIComponent(text);
}


input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        launch();
    }
});


sendBtn.addEventListener("click", launch);


