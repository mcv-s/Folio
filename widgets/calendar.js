import { createWidget, is24Hour } from "../widgetCore.js";


const MODE_KEY = "calendarMode";


function parseDate(value) {

  if (!value)
    return null;


  if (value.includes("T")) {

    return new Date(
      value.slice(0,4) + "-" +
      value.slice(4,6) + "-" +
      value.slice(6,8) + "T" +
      value.slice(9,11) + ":" +
      value.slice(11,13) + ":" +
      (value.slice(13,15) || "00") +
      "Z"
    );

  }


  return new Date(
    Number(value.slice(0,4)),
    Number(value.slice(4,6)) - 1,
    Number(value.slice(6,8))
  );

}



function parseICS(text) {

  const lines = text.split(/\r?\n/);

  const events = [];

  let current = null;


  for (let line of lines) {


    line = line.trim();


    if (line === "BEGIN:VEVENT") {

      current = {
        title:"Untitled",
        allDay:false,
        location:""
      };

    }


    if (!current)
      continue;



    if (line.startsWith("SUMMARY:")) {

      current.title =
        line.replace("SUMMARY:", "").trim();

    }



    if (line.startsWith("LOCATION:")) {

      current.location =
        line.replace("LOCATION:", "").trim();

    }



    if (line.startsWith("DTSTART")) {

      const value =
        line.split(":")[1];


      current.start =
        parseDate(value);


      current.allDay =
        !value.includes("T");

    }



    if (line.startsWith("DTEND")) {

      const value =
        line.split(":")[1];


      current.end =
        parseDate(value);

    }



    if (line === "END:VEVENT") {

      if (current.start)
        events.push(current);


      current = null;

    }

  }


  return events;

}



function formatTime(date) {

  return date.toLocaleTimeString([], {
    hour:"2-digit",
    minute:"2-digit",
    hour12: is24Hour ? false : true
  });

}



function eventHTML(event) {

  return `

  <div style="
    padding:8px 0;
    border-bottom:1px solid rgba(255,255,255,0.08);
  ">

    <div style="font-weight:600;">
      ${event.title}
    </div>


    <div style="opacity:.65;font-size:.85em;">

    ${
      event.allDay
      ?
      "All day"
      :
      formatTime(event.start) +
      (event.end
        ? " - " + formatTime(event.end)
        : "")
    }

    ${
      event.location
      ?
      "<br>📍 " + event.location
      :
      ""
    }

    </div>

  </div>

  `;

}



export async function init(calendar) {


  if (!calendar || !calendar.calendarLinks)
    return;



  const box = createWidget(
    "calendar-widget",
    "Calendar"
  );



  let mode =
    localStorage.getItem(MODE_KEY)
    || "list";



  box.innerHTML = `

    <button class="calendar-toggle"
      style="
      position:absolute;
      right:10px;
      top:2px;
      background:none;
      border:none;
      color:inherit;
      cursor:pointer;
      font-size:18px;
      opacity:0;
      ">
      ☰
    </button>


    <div class="calendar-content">
      Loading...
    </div>

  `;



  const content =
    box.querySelector(".calendar-content");

    box.addEventListener("mouseenter", () => {
    button.style.opacity = "1";
    });

    box.addEventListener("mouseleave", () => {
    button.style.opacity = "0";
    });

  const button =
    box.querySelector(".calendar-toggle");



  let events = [];



  async function load() {


    try {


      events = [];


      const links =
        calendar.calendarLinks
          .split("\n")
          .map(x=>x.trim())
          .filter(Boolean);



      for (const link of links) {


        const res =
          await fetch(link, {
            cache:"no-store"
          });


        const text =
          await res.text();


        events.push(
          ...parseICS(text)
        );

      }



      events.sort(
        (a,b)=>a.start-b.start
      );



      render();


    }
    catch(err) {

      console.error(err);

      content.innerHTML =
      `
      <div style="opacity:.6;">
      Failed to load calendar
      </div>
      `;

    }

  }



  function render() {


    content.innerHTML = "";



    if (!events.length) {

      content.innerHTML =
      `
      <div style="opacity:.6;">
      No events found
      </div>
      `;

      return;

    }



    if (mode === "next") {


      const next =
        events.find(
          e => e.start > new Date()
        );


        content.innerHTML =
        next
        ?
        `
        <div style="
            opacity:.6;
            font-size:.85em;
            margin-bottom:6px;
        ">
            Next event
        </div>

        ${eventHTML(next)}
        `
        :
        `
        <div style="opacity:.6;">
            No upcoming events
        </div>
        `;


      return;

    }



if (mode === "week") {

  const now = new Date();


  content.innerHTML = `
    <div style="
      width:max-content;
      display:flex;
      transform-origin:top left;
    ">
    </div>
  `;


  const week = content.firstElementChild;


  for(let i = 0; i < 7; i++) {

    const day = new Date(now);
    day.setDate(day.getDate() + i);


    const todays =
      events.filter(e =>
        e.start.toDateString() === day.toDateString()
      );


    const column =
      document.createElement("div");


    column.style.cssText = `
      width:140px;
      display:flex;
      flex-direction:column;
      gap:4px;
      padding:6px;
      box-sizing:border-box;
      flex-shrink:0;
    `;


    column.innerHTML = `

      <div style="
        font-weight:600;
        font-size:1em;
      ">
        ${day.toLocaleDateString([], {
          weekday:"short",
          day:"numeric"
        })}
      </div>

    `;


    todays.forEach(e => {

      column.innerHTML += `

        <div style="
          padding:4px;
          border-radius:6px;
          background:rgba(255,255,255,.08);
          font-size:.85em;
        ">

          <div>
            ${e.title}
          </div>

          <div style="
            opacity:.6;
          ">
            ${
              e.allDay
              ? "All day"
              : formatTime(e.start)
            }
          </div>

        </div>

      `;

    });


    week.appendChild(column);

  }


  requestAnimationFrame(() => {

    const availableHeight =
      content.clientHeight;


    const naturalHeight =
      week.offsetHeight;


    if (naturalHeight > availableHeight) {

      const scale =
        availableHeight / naturalHeight;


      week.style.transform =
        `scale(${scale})`;

    }
    else {

      week.style.transform =
        "scale(1)";

    }

  });


  return;

}


    // LIST MODE


    const today =
      new Date();



    events
      .filter(e =>
        e.start >= today
      )
      .slice(0,10)
      .forEach(e=>{

        content.innerHTML +=
          eventHTML(e);

      });


  }



  button.onclick = () => {


    mode =
      mode === "list"
      ?
      "next"
      :
      mode === "next"
      ?
      "week"
      :
      "list";


    localStorage.setItem(
      MODE_KEY,
      mode
    );


    render();

  };



  await load();



  setInterval(
    load,
    15 * 60 * 1000
  );


}