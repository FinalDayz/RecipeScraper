import * as fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import HTMLElement from "node-html-parser/dist/nodes/html";

function fetchStructuredData(document: HTMLElement) {

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for(let script of scripts) {
        try {
            const scriptContent = JSON.parse(script.textContent);
            if(scriptContent['@context'] !== 'https://schema.org') {
                continue;
            }

            console.log(scriptContent);

        } catch(exception) {
            console.log(exception)
        }
    }

}

export function scrape(url: string) {
    console.log("Scraping site '" + url + "'");

    return new Promise((acc, rej) => {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const document: HTMLElement = parse(html);
                fetchStructuredData(document);
            });
    });



}
