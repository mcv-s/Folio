import { createWidget } from "../widgetCore.js";


export async function init(scratchMessages) {

  if (!scratchMessages.username)
    return;




  // ------------------------------------------
  // Fetch message count
  // ------------------------------------------



  const response = await fetch(
    `https://api.scratch.mit.edu/users/${encodeURIComponent(scratchMessages.username)}/messages/count/`
  );



  const data = await response.json();



  if (data.count === 0) {

    console.log(
      `No Scratch messages for user "${scratchMessages.username}".`
    );
    const data = '{"count":0}'

    if (scratchMessages.hideIfZero) {

      console.log(
        `Hiding widget because "hideIfZero" is enabled.`
      );
      return;
    }


  }





  const box = createWidget(
    "scratch-messages",
    "Scratch Message Count"
  );


  box.style.overflow = "hidden";



    // ------------------------------------------
    // Open Scratch messages
    // ------------------------------------------

    const scratchIcon = document.createElement("a");

    scratchIcon.className = "scratch-message-icon";

    scratchIcon.href =
      `https://scratch.mit.edu/messages/`;

    scratchIcon.target = "_blank";

    scratchIcon.rel = "noopener noreferrer";

    scratchIcon.innerHTML =
      `<i class="ph ph-arrow-square-out"></i>`;

    scratchIcon.style.cssText = `
    position:absolute;
    right:7px;
    top:37px;

    font-size:18px;

    color:inherit;
    text-decoration:none;

    opacity:0;

    cursor:pointer;

    transition:opacity .15s ease;
  `;


    box.appendChild(scratchIcon);


    box.addEventListener("mouseenter", () => {
      scratchIcon.style.opacity = "0.6";
    });


    box.addEventListener("mouseleave", () => {
      scratchIcon.style.opacity = "0";
    });






  // ------------------------------------------
  // Styles
  // ------------------------------------------

  const style = document.createElement("style");

  style.textContent = `

    .scratch-message-content {

      display:flex;
      flex-direction:column;

      align-items:center;
      justify-content:center;

      gap:5px;

      transform-origin:center;

      white-space:nowrap;

      box-sizing:border-box;

      padding:6px 10px;

      line-height:1;

    }


    .scratch-message-label {

      font-size:12px;
      font-weight:600;

      opacity:0;

      white-space:nowrap;

      pointer-events:none;

      transition:opacity .15s ease;

    }


    .scratch-message-number {

      font-size:48px;
      font-weight:700;

      line-height:1;

      opacity:0.8;

    }


    /* ---------------------------------------
       Show text when hovered
       --------------------------------------- */

    #scratch-messages:hover .scratch-message-label {

      opacity:0.6;

    }


    /* ---------------------------------------
       Small
       --------------------------------------- */

    .scratch-message-small {

      gap:4px;

      padding:4px 6px;

    }


    .scratch-message-small .scratch-message-number {

      font-size:36px;

    }


    .scratch-message-small .scratch-message-label {

      font-size:10px;

    }


    /* ---------------------------------------
       Wide
       --------------------------------------- */

    .scratch-message-wide {

      gap:4px;

    }


    .scratch-message-wide .scratch-message-number {

      font-size:42px;

    }


    /* ---------------------------------------
       Tall
       --------------------------------------- */

    .scratch-message-tall {

      gap:5px;

    }


    .scratch-message-tall .scratch-message-number {

      font-size:48px;

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

  content.className = "scratch-message-content";


  scaleWrapper.appendChild(content);


  // ------------------------------------------
  // Loading
  // ------------------------------------------

  content.innerHTML = `
    <div style="
      opacity:0.6;
      font-size:12px;
      text-align:center;
    ">
      Loading...
    </div>
  `;


  // ------------------------------------------
  // Responsive scaling
  // ------------------------------------------

  const resizeObserver = new ResizeObserver(() => {

    const width = scaleWrapper.clientWidth;
    const height = scaleWrapper.clientHeight;


    content.classList.remove(
      "scratch-message-wide",
      "scratch-message-tall",
      "scratch-message-small"
    );


    let scale = 1;


    // Very small widget

    if (width < 160 || height < 80) {

      content.classList.add(
        "scratch-message-small"
      );


      scale = Math.min(
        width / 120,
        height / 85
      );

    }


    // Wide widget

    else if (width > height * 1.5) {

      content.classList.add(
        "scratch-message-wide"
      );


      scale = Math.min(
        width / 230,
        height / 60
      );

    }


    // Normal / tall widget

    else {

      content.classList.add(
        "scratch-message-tall"
      );


      scale = Math.min(
        width / 155,
        height / 110
      );

    }


    // Never allow content to touch edges

    scale *= 0.90;


    content.style.transform =
      `scale(${Math.max(0.5, scale)})`;

  });


  resizeObserver.observe(scaleWrapper);





  if (data.count > -1) {

    // ------------------------------------------
    // Render
    // ------------------------------------------

    content.innerHTML = `

      <div class="scratch-message-label">
        You have
      </div>


      <div class="scratch-message-number">
        ${data.count}
      </div>


      <div class="scratch-message-label">
        messages on Scratch
      </div>

    `;

  }













  // ------------------------------------------
  // Cleanup
  // ------------------------------------------

  return () => {

    resizeObserver.disconnect();

    style.remove();

  };

}