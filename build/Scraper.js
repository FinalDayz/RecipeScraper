"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrape = void 0;
const fetch = require("node-fetch");
const node_html_parser_1 = require("node-html-parser");
function fetchStructuredData(document) {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (let script of scripts) {
        try {
            const scriptContent = JSON.parse(script.textContent);
            if (scriptContent['@context'] !== 'https://schema.org') {
                continue;
            }
            console.log(scriptContent);
        }
        catch (exception) {
            console.log(exception);
        }
    }
}
function scrape(url) {
    console.log("Scraping site '" + url + "'");
    return new Promise((acc, rej) => {
        fetch(url)
            .then(response => response.text())
            .then(html => {
            const document = node_html_parser_1.parse(html);
            fetchStructuredData(document);
        });
    });
}
exports.scrape = scrape;
//# sourceMappingURL=Scraper.js.map