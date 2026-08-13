import { createWidget } from "../widgetCore.js";


/* =========================================================
   Load Marked
   ========================================================= */

let markedPromise = null;


function loadMarked() {

  if (window.marked) {
    return Promise.resolve(window.marked);
  }


  if (markedPromise) {
    return markedPromise;
  }


  markedPromise =
    new Promise((resolve, reject) => {

      const existing =
        document.querySelector(
          'script[data-markdown-widget="marked"]'
        );


      if (existing) {

        if (window.marked) {

          resolve(
            window.marked
          );

          return;
        }


        existing.addEventListener(
          "load",
          () => {

            if (window.marked) {

              resolve(
                window.marked
              );

            } else {

              reject(
                new Error(
                  "Marked loaded but was not available."
                )
              );
            }
          }
        );


        existing.addEventListener(
          "error",
          () => {

            reject(
              new Error(
                "Failed to load Marked."
              )
            );
          }
        );


        return;
      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        new URL(
          "../modules/marked_1.js",
          import.meta.url
        ).href;


      script.dataset.markdownWidget =
        "marked";


      script.onload =
        () => {

          if (!window.marked) {

            reject(
              new Error(
                "Marked loaded but was not available."
              )
            );

            return;
          }


          resolve(
            window.marked
          );
        };


      script.onerror =
        () => {

          reject(
            new Error(
              "Failed to load Marked."
            )
          );
        };


      document.head.appendChild(
        script
      );
    });


  return markedPromise;
}


/* =========================================================
   Widget
   ========================================================= */

export async function init(markdownNote) {

  const box =
    createWidget(
      "markdownNote-widget",
      "Formatted Markdown"
    );


  const content =
    document.createElement(
      "div"
    );


  content.className =
    "markdown-note-content";


  content.style.cssText = `
    width:100%;
    height:100%;
    box-sizing:border-box;
    padding:8px;
    color:inherit;
    font-family:inherit;
    font-size:1rem;
    line-height:1.5;
  `;


  box.appendChild(
    content
  );


  const markdown =
    markdownNote.actualMarkdown || "";


  if (!markdown.trim()) {

    content.innerHTML =
      '<div style="opacity:0.5;">' +
      "No markdown content" +
      "</div>";

    return;
  }


  try {

    const marked =
      await loadMarked();


    content.innerHTML =
      marked.parse(
        markdown
      );

  } catch (error) {

    console.error(
      "Failed to render markdown:",
      error
    );


    content.textContent =
      "Failed to render Markdown.";
  }
}