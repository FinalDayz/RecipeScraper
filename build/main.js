"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Scraper_1 = require("./Scraper");
// scrape('https://www.ah.nl/allerhande/recept/R-R615118/eenvoudige-spaghetti-bolognese');
// scrape('https://www.ah.nl/allerhande/recept/R-R1195177/kip-tandoori');
// scrape('https://www.jamieoliver.com/recipes/beef-recipes/spaghetti-bolognese/');
// let promise = scrape('https://www.leukerecepten.nl/recepten/koolhydraatarme-andijviestamppot/'); //only itemprops tags
// let promise = scrape('https://www.leukerecepten.nl/recepten/klassieke-appeltaart/'); // random
// let promise = scrape('https://www.patesserie.com/recepten/klassieke-appeltaart/'); // random
// let promise = scrape('https://www.24kitchen.nl/recepten/klassieke-appeltaart'); // random
let promise = Scraper_1.scrape('https://www.bbcgoodfood.com/recipes/best-spaghetti-bolognese-recipe'); // random
promise.then(recipe => {
    console.log('----------recipe----------');
    console.log(recipe);
});
//tsc -w
//# sourceMappingURL=main.js.map