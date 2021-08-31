
const axios = require('axios');
const cheerio = require('cheerio');
module.exports = async () => {
    // create a function to get https://whitepaper.cryptocarsworld.com/token/cars 
    const data = await axios.get('https://whitepaper.cryptocarsworld.com/token/cars');
    // Load data to cheerio
    const $ = cheerio.load(data.data);
    // Find a span with regex (Contrato oficial:\s)
    const regex = /Contrato oficial:\s/g;
    // Find all span with regex
    const spans = $('span').filter((i, el) => {
        return $(el).text().match(regex);
    }
    );
    // Create an array to store all the contracts
    const contracts = [];
    // For each span, get the text and push it to the array
    spans.each((i, el) => {
        contracts.push($(el).text());
    }
    );
    // Return the array
    return contracts;
        



}

