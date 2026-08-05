import { createWidget } from "../widgetCore.js";

// This is a template for creating a new widget.
// If you want to detect whether the user has enabled 24-hour time, you can import the is24Hour function from widgetCore.js and use it in your widget code.
//
// Widget settings come from the widget configuration.
// Example:
// {
//   enabled: true,
//   someSetting: "hello"
// }
//
// You access them directly:
// template.someSetting
//
//
// The entire thing needs to be self-contained. 
// Everything must be included in this file.




export async function init(template) {


  // If the widget has settings that are required,
  // check them before creating the widget.
  //
  // Example:
  //
  // if (!template.someSetting)
  //   return;


  
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