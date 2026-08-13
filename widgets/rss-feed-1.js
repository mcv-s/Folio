import { createWidget } from "../widgetCore.js";

export async function init(settings) {
  const rssFeeds = String(settings?.rssFeed || "")
    .split(/\r?\n/)
    .map(feed => feed.trim())
    .filter(Boolean);

  if (rssFeeds.length === 0) return;

  const escapeHTML = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const getAtomLink = (item) => {
    const links = [...item.querySelectorAll("link")];

    const alternate =
      links.find(link =>
        !link.getAttribute("rel") ||
        link.getAttribute("rel") === "alternate"
      );

    return (
      alternate?.getAttribute("href") ||
      alternate?.textContent?.trim() ||
      ""
    );
  };

  const getDescription = (item) => {
    return (
      item.querySelector("description")?.textContent?.trim() ||
      item.querySelector("summary")?.textContent?.trim() ||
      item.querySelector("content")?.textContent?.trim() ||
      ""
    );
  };

  const getDate = (item) => {
    return (
      item.querySelector("pubDate")?.textContent?.trim() ||
      item.querySelector("published")?.textContent?.trim() ||
      item.querySelector("updated")?.textContent?.trim() ||
      ""
    );
  };

  for (let feedIndex = 0; feedIndex < rssFeeds.length; feedIndex++) {
    const rssFeed = rssFeeds[feedIndex];

    try {
      const response = await fetch(rssFeed);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      if (xml.querySelector("parsererror")) {
        throw new Error("Invalid RSS/Atom feed");
      }

      // RSS uses <item>, Atom uses <entry>.
      const items = [
        ...xml.querySelectorAll("item"),
        ...xml.querySelectorAll("entry")
      ];

      const feedTitle =
        xml.querySelector("channel > title")?.textContent?.trim() ||
        xml.querySelector("feed > title")?.textContent?.trim() ||
        "RSS Feed";

      // Every feed gets its own unique widget ID.
      const widgetId = `rss-feed-${feedIndex}`;

      // Use the feed's title as the widget header.
      const box = createWidget(
        widgetId,
        feedTitle
      );

      if (items.length === 0) {
        box.innerHTML = `
          <div style="opacity:0.6;">
            No feed items found.
          </div>
        `;
        continue;
      }

      const html = items.slice(0, 10).map(item => {
        const title =
          item.querySelector("title")?.textContent?.trim() ||
          "Untitled";

        const link =
          item.querySelector("link")?.textContent?.trim() ||
          getAtomLink(item);

        const description = getDescription(item);
        const date = getDate(item);

        let formattedDate = "";

        if (date) {
          const parsedDate = new Date(date);

          if (!Number.isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toLocaleDateString();
          }
        }

        const cleanDescription = description
          .replace(/<[^>]*>/g, "")
          .trim();

        return `
          <article
            style="
              padding:10px 0;
              border-bottom:1px solid rgba(128,128,128,0.2);
            "
          >
            <a
              href="${escapeHTML(link)}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display:block;
                color:inherit;
                text-decoration:none;
                font-weight:600;
                margin-bottom:4px;
              "
            >
              ${escapeHTML(title)}
            </a>

            ${
              formattedDate
                ? `
                  <div style="
                    opacity:0.55;
                    font-size:0.8em;
                    margin-bottom:4px;
                  ">
                    ${escapeHTML(formattedDate)}
                  </div>
                `
                : ""
            }

            ${
              cleanDescription
                ? `
                  <div style="
                    opacity:0.75;
                    font-size:0.9em;
                  ">
                    ${escapeHTML(
                      cleanDescription.slice(0, 180)
                    )}${cleanDescription.length > 180 ? "..." : ""}
                  </div>
                `
                : ""
            }
          </article>
        `;
      }).join("");

      box.innerHTML = html;

    } catch (error) {
      console.error(`Folio RSS Feed error (${rssFeed}):`, error);

      // Still create a widget if the feed failed.
      const box = createWidget(
        `rss-feed-${feedIndex}`,
        "RSS Feed"
      );

      box.innerHTML = `
        <div style="opacity:0.6;">
          Unable to load RSS feed.
        </div>
      `;
    }
  }
}