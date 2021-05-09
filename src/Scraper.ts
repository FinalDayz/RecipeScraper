import * as fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import HTMLElement from "node-html-parser/dist/nodes/html";
import {ScrapedRecipe} from "./ScrapedRecipe";

function fetchStructuredData(document: HTMLElement) {

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let foundRecipe = null;
    for(let script of scripts) {
        try {
            const scriptContent = JSON.parse(script.textContent);
            // console.log(scriptContent['@context']);
            if(validSchemaUrls().indexOf(scriptContent['@context']) === -1) {
                continue;
            }

            if(scriptContent['@type'] === 'Recipe') {
                foundRecipe = parseRecipe(scriptContent);
            }

        } catch(exception) {
            console.log(exception)
        }
    }

    if (foundRecipe)
        return foundRecipe;

    for(const schemaUrl of validSchemaUrls(false)) {
        const element = document.querySelector('[itemtype="'+schemaUrl+'/Recipe"]');
        if (!element)
            continue;
        const allPropContents = {};

        for(const itemPropElement of element.querySelectorAll('[itemprop]')) {
            const attributes = itemPropElement.attributes;
            const value = attributes.content ? attributes.content : itemPropElement.innerText;
            if(allPropContents[attributes.itemprop]) {
                console.log("already exiswts");
                if(!Array.isArray(allPropContents[attributes.itemprop])) {
                    allPropContents[attributes.itemprop] = [
                        allPropContents[attributes.itemprop]
                    ];
                }
                allPropContents[attributes.itemprop].push(value);
                console.log(attributes.itemprop, allPropContents[attributes.itemprop]);
            }
            allPropContents[attributes.itemprop] = value;
            // console.log(attributes.itemprop, ":", attributes.content, " OR ", itemPropElement.innerText);
        }
        console.log(allPropContents);
        // console.log(element);
    }

}

function validSchemaUrls(trailingSlash=true): string[] {
    return [
        'https://schema.org', 'http://schema.org',
        'https://www.schema.org', 'http://www.schema.org',
    ]
        .concat(trailingSlash ? [
            'https://schema.org/', 'http://schema.org/',
            'https://www.schema.org/', 'http://www.schema.org/',
    ] : []);
}

function parseRecipe(scriptContent: any) {
    console.log("Found recipe");
    const recipe = new ScrapedRecipe();
    recipe.name = scriptContent.name;
    recipe.alternateName = scriptContent.alternateName;
    recipe.URL = scriptContent.URL;
    recipe.totalTime = scriptContent.totalTime;
    recipe.image = scriptContent.image;
    recipe.description = scriptContent.descriptScrapedRecipeion;
    recipe.recipeYield = scriptContent.recipeYield;
    recipe.recipeCategory = scriptContent.recipeCategory;
    recipe.recipeCuisine = scriptContent.recipeCuisine;
    recipe.recipeIngredient = scriptContent.recipeIngredient;
    recipe.recipeInstructions = [];
    recipe.recipeInstructions = smartParseInstructions(scriptContent);


    console.log(recipe);
}

function smartParseInstructions(scriptContent: any): Array<string> {
    let instructions = [];
    switch (typeof scriptContent.recipeInstructions ) {
        case "string":
            const splittedInstructions = scriptContent.recipeInstructions.split(/<[^>]+>|[\n\r]/g);
            console.log(splittedInstructions);
            for(const step of splittedInstructions) {
                if(step.length > 5) {
                    instructions.push(step);
                }
            }
            break;
        case "object":
            if(Array.isArray(scriptContent.recipeInstructions)) {
                for(const step of scriptContent.recipeInstructions) {
                    instructions.push(step);
                }
            } else {
                for(const step of scriptContent.recipeInstructions) {
                    instructions.push(step.text);
                }
            }
            break;
    }
    console.log(instructions);
    return instructions;
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
