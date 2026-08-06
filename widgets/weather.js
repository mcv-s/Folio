import { createWidget } from "../widgetCore.js";


const WEATHER_UNIT_KEY = "weatherUnit";


function cToF(c) {
  return (c * 9) / 5 + 32;
}


function formatTemp(tempC, unit) {

  if (unit === "F")
    return `${Math.round(cToF(tempC))}°F`;

  return `${Math.round(tempC)}°C`;

}



function getWeatherIcon(code) {

  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "❄️";

  return "⛈️";

}



export async function init(weather) {

  const box = createWidget(
    "weather-widget",
    "Weather (From Open-Meteo)"
  );


  box.style.overflow = "hidden";


  const style = document.createElement("style");

  style.textContent = `

    .weather-content {
      display:flex;
      flex-direction:column;
      gap:14px;
      transform-origin:center;
    }


    .weather-main {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:20px;
    }


    .weather-details {
      display:flex;
      justify-content:space-between;
      gap:20px;
      opacity:0.75;
      font-size:12px;
    }


    .weather-icon {
      font-size:34px;
    }


    .weather-temp {
      font-size:26px;
      font-weight:600;
      cursor:pointer;
    }



    /* Tall layout */
    .weather-tall .weather-main {

      flex-direction:column;
      gap:5px;

    }


    .weather-tall .weather-details {

      flex-direction:column;
      align-items:center;

    }



    /* Small layout */
    .weather-small .weather-details {

      display:none;

    }


    .weather-small .weather-main {

      flex-direction:column;
      gap:0;

    }


  `;


  document.head.appendChild(style);



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

  content.className = "weather-content";

  scaleWrapper.appendChild(content);



  const resizeObserver = new ResizeObserver(() => {

    const width = scaleWrapper.clientWidth;
    const height = scaleWrapper.clientHeight;


    content.classList.remove(
      "weather-wide",
      "weather-tall",
      "weather-small"
    );


    let scale = 1;


    if (width < 180 || height < 90) {

      content.classList.add("weather-small");

      scale = Math.min(
        width / 100,
        height / 80
      );

    }
    else if (width > height * 1.5) {

      content.classList.add("weather-wide");

      scale = Math.min(
        width / 220,
        (height * 0.8) / 90
      );

    }
    else {

      content.classList.add("weather-tall");

      scale = Math.min(
        width / 160,
        (height * 0.8) / 150
      );

    }


    content.style.transform =
      `scale(${scale})`;

  });


  resizeObserver.observe(scaleWrapper);



  content.innerHTML = `
    <div style="opacity:0.6;">
      Loading weather...
    </div>
  `;



  const unit =
    localStorage.getItem(WEATHER_UNIT_KEY) || "C";



  async function getLocation() {

    try {

      const res = await fetch("https://ipwho.is/");
      const data = await res.json();


      if (!data.success)
        throw new Error();


      return {
        lat: data.latitude,
        lon: data.longitude
      };


    } catch {

      return {
        lat: 34.1015,
        lon: -84.5194
      };

    }

  }



  try {

    const { lat, lon } = await getLocation();


    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true`;


    const res = await fetch(url);

    const data = await res.json();



    if (!data.current_weather) {

      content.innerHTML = `
        <div style="opacity:0.6;">
          No weather data
        </div>
      `;

      return;

    }



    const w = data.current_weather;



    function render() {

      content.innerHTML = `


        <div class="weather-main">


          <div class="weather-icon">
            ${getWeatherIcon(w.weathercode)}
          </div>



          <div id="tempToggle"
               class="weather-temp">

            ${formatTemp(w.temperature, unit)}

          </div>


        </div>



        <div class="weather-details">


          <span>
            💨 ${w.windspeed} km/h
          </span>


          <span>
            📍 Woodstock
          </span>


        </div>


      `;



      content.querySelector("#tempToggle").onclick = () => {

        const next =
          unit === "C" ? "F" : "C";


        localStorage.setItem(
          WEATHER_UNIT_KEY,
          next
        );


        location.reload();

      };


    }


    render();


  } catch (err) {

    content.innerHTML = `
      <div style="opacity:0.6;">
        Weather error
      </div>
    `;


    console.error(err);

  }

}