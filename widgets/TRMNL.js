import { createWidget } from "../widgetCore.js";

export async function init(TRMNL) {

  if (!TRMNL.trmnlApiKey)
    return;


  const box = createWidget(
    "TRMNL-widget",
    "TRMNL Mirror"
  );


  box.innerHTML = `
    <style>
.trmnl-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.trmnl-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
    border-radius: 16px;
    display: block;
}

.trmnl-frame {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}


      .trmnl-loading {
        opacity: 0.6;
      }
    </style>

    <div class="trmnl-container">
      <div class="trmnl-loading">
        Loading TRMNL...
      </div>
    </div>
  `;


  const container = box.querySelector(".trmnl-container");


  try {

    const response = await fetch(
      "https://trmnl.com/api/current_screen",
      {
        headers: {
          "access-token": TRMNL.trmnlApiKey
        }
      }
    );


    if (!response.ok)
      throw new Error("Failed to fetch TRMNL screen");


    const data = await response.json();


    container.innerHTML = `
      <div class="trmnl-frame">
        <img 
          class="trmnl-image"
          src="${data.image_url}"
          alt="Current TRMNL screen"
        >
      </div>
    `;


  } catch (error) {

    container.innerHTML = `
      <div class="trmnl-loading">
        Failed to load TRMNL
      </div>
    `;

    console.error(error);
  }
}