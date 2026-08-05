import { createWidget } from "../widgetCore.js";


export async function init(sitePins) {

  if (!sitePins || !sitePins.pinnedSites)
    return;


  const box = createWidget(
    "site-pins-widget",
    "Pinned Sites"
  );


  const sites = sitePins.pinnedSites
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);



  box.innerHTML = `

    <div class="pins-area">

      ${sites.map(site => {

        let url = site;

        if (
          !url.startsWith("http://") &&
          !url.startsWith("https://")
        ) {
          url = "" + url;
        }


        const domain = new URL(url).hostname;


        return `

          <a class="pin"
                  href="${url}"
                  title="${domain}">

            <img src="
              https://www.google.com/s2/favicons?domain=${domain}&sz=128
            ">

          </a>

        `;

      }).join("")}

    </div>

  `;



  const style = document.createElement("style");

  style.textContent = `

.pins-area {

  width:100%;
  height:100%;

  display:grid;

  place-content:center;

  gap:18px;

  padding:24px;

  box-sizing:border-box;

  overflow:hidden;

}


    .pin {

      aspect-ratio:1;

      display:flex;
      align-items:center;
      justify-content:center;

      border:0;

      border-radius:18px;

      background:
        rgba(255,255,255,0.12);

      padding:0;

      cursor:pointer;

      overflow:hidden;

    }


    .pin img {

      width:75%;
      height:75%;

      object-fit:contain;
      border-radius:75%;

    }


  `;

  document.head.appendChild(style);



  const area =
    box.querySelector(".pins-area");


  const buttons =
    [...box.querySelectorAll(".pin")];



  function layout() {

    const width = area.clientWidth;
    const height = area.clientHeight;


    if (!width || !height)
      return;


    const count = buttons.length;


    let best = null;



    // Try every possible column count
    for (
      let cols = 1;
      cols <= count;
      cols++
    ) {

      const rows =
        Math.ceil(count / cols);


      const gap = 10;


      const cellWidth =
        (width - gap * (cols - 1))
        / cols;


      const cellHeight =
        (height - gap * (rows - 1))
        / rows;


        const size =
        Math.min(
            cellWidth,
            cellHeight
        ) * 0.75;



      if (
        !best ||
        size > best.size
      ) {

        best = {
          cols,
          rows,
          size
        };

      }

    }



    area.style.gridTemplateColumns =
      `repeat(${best.cols}, ${best.size}px)`;


    area.style.gridTemplateRows =
      `repeat(${best.rows}, ${best.size}px)`;

  }



  const observer =
    new ResizeObserver(layout);


  observer.observe(area);


  layout();



    buttons.forEach(button => {

    button.onclick = () => {

        window.location.href = button.dataset.url;

    };

    });

}