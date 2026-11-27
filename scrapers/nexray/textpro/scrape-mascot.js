#!/usr/bin/env node
'use strict';

/**
 * Name : Mascot
 * Creator : lmavour
 * Source : https://api.nexray.eu.cc/category/textpro
 * Base Web : https://api.nexray.eu.cc
 * Type : Scraper
 * Description : Membuat logo avatar mascot style dengan dua teks dan pilihan 92 style
 * Note : node scrapers/nexray/textpro/scrape-mascot.js --help
 */

const { nexrayEndpoint } = require('../../lib/nexray');
const ENDPOINT = 'https://api.nexray.eu.cc/textpro/mascot';
const { scrape: nexrayTextproMascot, cli } = nexrayEndpoint(ENDPOINT, {
  format: 'binary',
  params: {
    text1: { required: true },
    text2: { required: true },
    style: { choices: ['ninja-cat', 'cobra', 'demon-cat', 'monster', 'octopus-3', 'panda', 'sabertooth-2', 'snake', 'tiger-5', 'tiger-6', 'wolf-2', 'wolf-3', 'dragon-5', 'jet', 'knight', 'skull-3', 'skull-cyborg', 'tiger-4', 'bee-3', 'dragon-4', 'fox-3', 'goat-2', 'kitsune', 'octopus-2', 'piranha', 'wolf', 'bear-2', 'cat', 'ceberus', 'crocodile', 'dinosaur', 'dragon-3', 'eagle-3', 'horse-2', 'husky', 'kraken', 'lynx', 'sabertooth', 'assassin', 'bee-2', 'cat-2', 'demon', 'fox-2', 'gorilla', 'horus', 'octopus', 'rounin', 'scorpion', 'skull-2', 'tiger-3', 'wolver', 'tiger-2', 'tiger', 'shark', 'sabertooth-3', 'rooster', 'rhino', 'puma', 'phoenix', 'panther', 'owl', 'lion', 'horse', 'hornet', 'griffin', 'goat', 'fox', 'eagle', 'dragon2', 'dragon', 'devil', 'cobra-2', 'bull', 'bear', 'monkey', 'warrior', 'skull', 'rabbit', 'pirates', 'owl-2', 'neon-wolf', 'lion-king', 'gorilla-2', 'flash-wolf', 'fire-skull', 'eagle-2', 'dog', 'mask-skull', 'team', 'pubg', 'drift', 'bee'] }
  }
});

module.exports = { nexrayTextproMascot };
if (require.main === module) cli();
