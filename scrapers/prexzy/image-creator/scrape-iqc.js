#!/usr/bin/env node
'use strict';

/**
 * Name : Instagram Quote Card
 * Creator : lmavour
 * Source : https://docs.prexzyapis.com/
 * Base Web : https://prexzyapis.com
 * Type : Scraper
 * Description : Create an Instagram quote card image with a cover-fitted media in a rounded frame
 * Note : node scrapers/prexzy/image-creator/scrape-iqc.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://prexzyapis.com/imagecreator/iqc';
const { scrape: prexzyImageCreatorIqc, cli } = documentedEndpoint(ENDPOINT, {
  source: 'prexzy',
  format: 'image',
  params: {
    media: { required: true, url: true }
  }
});

module.exports = { prexzyImageCreatorIqc };
if (require.main === module) cli();
