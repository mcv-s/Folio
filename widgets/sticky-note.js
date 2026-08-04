import { createWidget } from "../widgetCore.js";


const storageKey = "stickyNoteContent";


export async function init(stickyNote) {

  const box = createWidget(
    "sticky-note-widget",
    "Sticky Note"
  );


  const savedText = localStorage.getItem(storageKey) || "";


  box.innerHTML = `
    <div
      class="sticky-note-input"
      contenteditable="true"
      style="
        width:100%;
        height:100%;
        box-sizing:border-box;
        outline:none;
        padding:8px;
        overflow:visible;
        white-space:pre-wrap;
        color:inherit;
        font-family:inherit;
        font-size:1rem;
      "
    >${savedText}</div>
  `;


  const editor = box.querySelector(".sticky-note-input");


  editor.addEventListener("input", () => {
    localStorage.setItem(
      storageKey,
      editor.innerText
    );
  });

}