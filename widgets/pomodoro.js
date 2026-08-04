import { createWidget } from "../widgetCore.js";


const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const POMODORO_KEY = "pomodoroState";


export async function init(pomodoro) {

  const box = createWidget(
    "pomodoro-widget",
    "Pomodoro Timer"
  );


  let time = WORK_TIME;
  let running = false;
  let mode = "Work";
  let interval = null;



  // Load saved state
  const saved = JSON.parse(
    localStorage.getItem(POMODORO_KEY) || "null"
  );


  if (saved) {

    time = saved.time ?? WORK_TIME;
    mode = saved.mode ?? "Work";
    running = saved.running ?? false;


    if (running && saved.lastUpdate) {

      const elapsed = Math.floor(
        (Date.now() - saved.lastUpdate) / 1000
      );


      time -= elapsed;


      if (time <= 0) {

        mode =
          mode === "Work"
            ? "Break"
            : "Work";


        time =
          mode === "Work"
            ? WORK_TIME
            : BREAK_TIME;

      }

    }

  }



  function saveState() {

    localStorage.setItem(
      POMODORO_KEY,
      JSON.stringify({
        time,
        mode,
        running,
        lastUpdate: Date.now()
      })
    );

  }



  // Responsive scaling
  box.style.overflow = "hidden";

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

  content.style.cssText = `
    transform-origin:center;
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:12px;
  `;

  scaleWrapper.appendChild(content);



  const resizeObserver = new ResizeObserver(() => {

    const width = scaleWrapper.clientWidth;
    const height = scaleWrapper.clientHeight;


    const scale = Math.min(
      width / 180,
      height / 150
    );


    content.style.transform =
      `scale(${scale})`;

  });


  resizeObserver.observe(scaleWrapper);




  function formatTime(seconds) {

    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");


    return `${mins}:${secs}`;

  }

    function startTimer() {

    clearInterval(interval);


    interval = setInterval(() => {

        time--;

        saveState();


        if (time <= 0) {

        clearInterval(interval);

        running = false;


        if (mode === "Work") {

            mode = "Break";
            time = BREAK_TIME;

        } else {

            mode = "Work";
            time = WORK_TIME;

        }


        saveState();

        }


        render();

    }, 1000);

    }



  function render() {

    content.innerHTML = `

      <div style="
        opacity:0.7;
        font-size:14px;
      ">
        ${mode}
      </div>


      <div style="
        font-size:42px;
        font-weight:700;
      ">
        ${formatTime(time)}
      </div>



      <div style="
        display:flex;
        gap:8px;
      ">

        <button id="pomStart">
          ${running ? "Pause" : "Start"}
        </button>


        <button id="pomReset">
          Reset
        </button>

      </div>

    `;



    content.querySelector("#pomStart").onclick = () => {

      running = !running;

      saveState();


    if (running) {

    startTimer();

    } else {

    clearInterval(interval);

    }


      render();

    };





    content.querySelector("#pomReset").onclick = () => {

      clearInterval(interval);

      running = false;

      mode = "Work";

      time = WORK_TIME;


      saveState();

      render();

    };


  }



    render();

    saveState();


    if (running) {
    startTimer();
    }

}