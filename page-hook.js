console.log("[Folio] page-hook.js IS RUNNING");

const originalFetch = window.fetch;

window.fetch = async function (...args) {

  const response = await originalFetch.apply(this, args);

  const request = args[0];

  const url =
    typeof request === "string"
      ? request
      : request?.url;

  if (url?.includes("/backend-api/wham/usage")) {

    console.log(
      "[Folio] >>> FOUND CHATGPT USAGE REQUEST <<<",
      url
    );

    try {

      const clone = response.clone();

      const data = await clone.json();

      // ------------------------------------------
      // Full usage response
      // ------------------------------------------

      console.log(
        "[Folio] >>> CHATGPT USAGE DATA <<<",
        data
      );


      // ------------------------------------------
      // Rate limit information
      // ------------------------------------------

      const rateLimit = data?.rate_limit;

      console.log(
        "[Folio] >>> CHATGPT RATE LIMIT <<<",
        rateLimit
      );


      // ------------------------------------------
      // Primary usage window
      // ------------------------------------------

      const primaryWindow =
        rateLimit?.primary_window;

      console.log(
        "[Folio] >>> PRIMARY USAGE WINDOW <<<",
        primaryWindow
      );


      if (primaryWindow) {

        console.log(
          `[Folio] Usage percentage: ${primaryWindow.used_percent}%`
        );

        console.log(
          `[Folio] Limit window: ${primaryWindow.limit_window_seconds} seconds`
        );

        console.log(
          `[Folio] Reset after: ${primaryWindow.reset_after_seconds} seconds`
        );

        console.log(
          `[Folio] Reset date: ${new Date(
            primaryWindow.reset_at * 1000
          ).toLocaleString()}`
        );

      }


      // ------------------------------------------
      // Send data to content.js
      // ------------------------------------------

      window.postMessage({

        source: "folio",

        type: "CHATGPT_USAGE",

        data

      }, "*");


    } catch (error) {

      console.error(
        "[Folio] Failed to read usage response:",
        error
      );

    }

  }

  return response;

};