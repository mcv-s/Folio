const input = document.getElementById("aiInput");
const sendBtn = document.querySelector(".send");
const bar = document.querySelector(".search-bar");


let selectedAI = localStorage.getItem("selectedAI") || "chatgpt";



bar.style.transition = "border-radius 0.18s ease, padding 0.18s ease";
input.style.transition = "height 0.12s ease";

function updateShape(isMultiLine) {
  if (!isMultiLine) {
    bar.style.borderRadius = "999px";
    bar.style.padding = "10px 14px 10px 18px";
  } else {
    bar.style.borderRadius = "18px";
    bar.style.padding = "14px 14px 14px 18px";
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







function launch() {
  const text = input.value.trim();
  if (!text) return;

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


