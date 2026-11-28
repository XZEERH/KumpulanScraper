#!/usr/bin/env node
'use strict';

/**
 * Name : Meme Generator
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Create memes with top and bottom text
 * Note : node scrapers/prexzy/image-creator/scrape-meme.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/imagecreator/meme';
const { scrape: prexzyImageCreatorMeme, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  format: 'image',
  params: {
    topText: { required: true },
    bottomText: { required: true },
    backgroundImage: { url: true },
    fontFamily: {},
    textColor: {},
    strokeColor: {}
  }
});

module.exports = { prexzyImageCreatorMeme };
if (require.main === module) cli();
