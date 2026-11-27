#!/usr/bin/env node
'use strict';

/**
 * Name : Story
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/ai
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Generate stories from prompts with customizable parameters
 * Note : node scrapers/nexray/ai/scrape-story.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/ai/story';
const { scrape: nexrayAiStory, cli } = nexrayEndpoint(ENDPOINT, {
  params: {
    prompt: { required: true },
    mode: { choices: ['Any genre', 'Action', 'Sci-fi', 'Mystery', 'Biography', 'Young Adult', 'Crime', 'Horror', 'Thriller', 'Children Books', 'Non-fiction', 'Humor', 'Historical Fiction'] },
    length: { choices: ['Short', 'Novel'] },
    creative: { choices: ['Medium', 'High'] }
  }
});

module.exports = { nexrayAiStory };
if (require.main === module) cli();
