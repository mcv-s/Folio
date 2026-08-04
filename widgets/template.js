import { createWidget } from "../widgetCore.js";

// This is a template for creating a new widget. Copy this file and rename it to create a new widget.
// If you want to detect whether the user has enabled 24-hour time, you can import the is24Hour function from widgetCore.js and use it in your widget code.



export async function init(template) {

  const box = createWidget(
    "template-widget",
    "Template widget"
  );


  box.innerHTML = `
    <div style="opacity:0.6;">
      Widget content goes here
    </div>
  `;
}