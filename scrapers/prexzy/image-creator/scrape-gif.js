#!/usr/bin/env node
'use strict';

/**
 * Name : Text to GIF
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Create animated text GIFs
 * Note : node scrapers/prexzy/image-creator/scrape-gif.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/imagecreator/gif';
const { scrape: prexzyImageCreatorGif, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  format: 'image',
  params: {
    text: { required: true },
    background: {},
    color: {},
    emojiStyle: {},
    delay: {},
    endDelay: {},
    width: {},
    height: {}
  }
});

module.exports = { prexzyImageCreatorGif };
if (require.main === module) cli();
