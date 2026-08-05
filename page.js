function parseMarkdown(md) {

    let html = md;

    html = html.replace(
        /```([\s\S]*?)```/g,
        (_, code) => `<pre><code>${code.trim()}</code></pre>`
    );


    html = html.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img alt="$1" src="$2">'
    );


    html = html.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2">$1</a>'
    );


    html = html.replace(/^###### (.*)$/gm, "<h6>$1</h6>");
    html = html.replace(/^##### (.*)$/gm, "<h5>$1</h5>");
    html = html.replace(/^#### (.*)$/gm, "<h4>$1</h4>");
    html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");


    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    html = html.replace(
        /\*(.*?)\*/g,
        "<em>$1</em>"
    );


    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );


    html = html.replace(
        /^> (.*)$/gm,
        "<blockquote>$1</blockquote>"
    );


    html = html.replace(
        /(^[-*] .+(?:\n[-*] .+)*)/gm,
        block => {
            const items = block
                .split("\n")
                .map(x => `<li>${x.substring(2)}</li>`)
                .join("");

            return `<ul>${items}</ul>`;
        }
    );


    html = html.replace(
        /^---$/gm,
        "<hr>"
    );


    html = html
        .split(/\n\n+/)
        .map(block => {

            if (
                block.startsWith("<h") ||
                block.startsWith("<ul") ||
                block.startsWith("<pre") ||
                block.startsWith("<blockquote") ||
                block.startsWith("<hr")
            ) {
                return block;
            }

            return `<p>${block.replace(/\n/g, "<br>")}</p>`;

        })
        .join("\n");


    return html;
}


async function loadREADME() {

    const output = document.getElementById("readme");

    try {

        const response = await fetch(
            chrome.runtime.getURL("README.md")
        );

        if (!response.ok) {
            throw new Error("README.md not found");
        }

        const markdown = await response.text();

        output.innerHTML = parseMarkdown(markdown);

        document.title =
            document.querySelector("h1")?.textContent || "README";

    } catch (err) {

        output.innerHTML =
            `<p class="error">${err.message}</p>`;
    }
}


loadREADME();