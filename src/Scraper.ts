import * as fetch from 'node-fetch';
import {parse} from 'node-html-parser';
import HTMLElement from "node-html-parser/dist/nodes/html";
import {ScrapedRecipe} from "./ScrapedRecipe";

function fetchStructuredData(document: HTMLElement) {

    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let foundRecipe = null;
    for (let script of scripts) {
        try {
            const scriptContent = JSON.parse(script.textContent);

            if (validSchemaUrls().indexOf(scriptContent['@context']) === -1) {
                continue;
            }

            foundRecipe = parseStructuredData(scriptContent);
            if (foundRecipe) {
                break;
            }

        } catch (exception) {
            console.log(exception);
            throw exception;
        }
    }

    if (foundRecipe)
        return foundRecipe;

    for (const schemaUrl of validSchemaUrls(false)) {
        const element = document.querySelector('[itemtype="' + schemaUrl + '/Recipe"]');
        if (!element)
            continue;
        const allPropContents = {};

        for (const itemPropElement of element.querySelectorAll('[itemprop]')) {
            const attributes = itemPropElement.attributes;
            const value = attributes.content ? attributes.content : itemPropElement.innerText;
            if (allPropContents[attributes.itemprop]) {
                if (!Array.isArray(allPropContents[attributes.itemprop])) {
                    allPropContents[attributes.itemprop] = [
                        allPropContents[attributes.itemprop]
                    ];
                }
                allPropContents[attributes.itemprop].push(value);
            } else {
                allPropContents[attributes.itemprop] = value;
            }
        }
        foundRecipe = parseRecipe(allPropContents);
    }

    return foundRecipe;

}

function parseStructuredData(data) {

    if (data['@graph'] && Array.isArray(data['@graph'])) {
        for (const subData of data['@graph']) {
            const recipe = parseStructuredData(subData);
            if (recipe) {
                return recipe;
            }
        }
    }

    if (data['@type'] === 'Recipe') {
        return parseRecipe(data);
    }

    return null;
}

function validSchemaUrls(trailingSlash = true): string[] {
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
    const recipe = new ScrapedRecipe();
    recipe.name = smartFilterRawText(scriptContent.name);
    recipe.alternateName = smartFilterRawText(scriptContent.alternateName);
    recipe.URL = scriptContent.URL;
    recipe.totalTime = scriptContent.totalTime;
    recipe.image = parseImage(scriptContent.image);
    recipe.description = smartFilterRawText(scriptContent.descriptScrapedRecipeion);
    recipe.recipeYield = smartFilterRawText(scriptContent.recipeYield);
    recipe.recipeCategory = smartFilterRawText(scriptContent.recipeCategory);
    recipe.recipeCuisine = smartFilterRawText(scriptContent.recipeCuisine);

    // recipe.recipeIngredient = scriptContent.recipeIngredient;
    recipe.recipeIngredient = smartParseList(scriptContent.recipeIngredient, isValidIngredient, smartFilterRawText);
    recipe.recipeInstructions = smartParseList(scriptContent.recipeInstructions, isValidStep, smartFilterRawText);

    return recipe;
}

function parseImage(image) {
    if(typeof image === 'object') {
        return image['url'] ? image['url'] : '';
    }

    return image;
}

function smartParseList(list: any, verifyFunc, filter): Array<string> {
    let parsedList = [];
    switch (typeof list) {
        case "string":
            const splitted = list.split(/<[^>]+>|[\n\r]/g);
            for (const element of splitted) {
                if (verifyFunc(element)) {
                    parsedList.push(filter(element));
                }
            }
            break;
        case "object":
            const isArr = Array.isArray(list);
            if (!isArr) {
                parsedList = parseListOfType(list, verifyFunc, filter);
                break;
            }
            for (const element of list) {
                if (typeof element === 'object') {
                    parsedList = [...parsedList, ...parseListOfType(element, verifyFunc, filter)];
                } else if (verifyFunc(element)) {
                    const val = isArr ? element : element.text;
                    parsedList.push(filter(val));
                }
            }
            break;
    }
    return parsedList;
}

function parseListOfType(obj, verifyFunc, filter) {
    let list = [];

    if (obj['@type']) {
        switch (obj['@type']) {
            case 'HowToSection':
                for (const howTo of obj['itemListElement']) {
                    list = [...list, ...parseListOfType(howTo, verifyFunc, filter)];
                }
                break;
            case 'HowToStep':
                if (verifyFunc(obj['text'])) {
                    list = [filter([obj['text']])];
                }
                break;
        }
    } else {
        for (const element of obj) {
            if (verifyFunc(element)) {
                const val = element.text ? element : element.text;
                if (verifyFunc(val)) {
                    list = [filter(val)];
                }
            }
        }
    }

    return list;
}

function smartFilterRawText(val) {
    return String(val).replace(/<[^><]+>/g, '').trim();
}

function isValidStep(step) {
    return String(step).trim().length > 5;
}

function isValidIngredient(step) {
    return step.trim().length > 2;
}

export function scrape(url: string) {
    console.log("Scraping site '" + url + "'");

    return new Promise((acc, rej) => {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                try {
                    const document: HTMLElement = parse(html);
                    const recipe = fetchStructuredData(document);
                    acc(recipe);
                } catch (err) {
                    rej(err);
                }
            });
    });


}
