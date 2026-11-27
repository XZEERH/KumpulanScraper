#!/usr/bin/env node
'use strict';

/**
 * Name : GLM 4.7 Flash
 * Creator : lmavour
 * Source : https://ikhlasapi.web.id/docs/all
 * Base Web : https://ikhlasapi.web.id
 * Type : Scraper
 * Description : Model GLM generasi 4.7 dengan latensi rendah (flash), dirancang untuk percakapan interaktif, pencarian fakta cepat, dan bantuan koding harian.
 * Note : node scrapers/ikhlas/ai/scrape-glm47flash.js --help
 */

const { documentedEndpoint } = require('../../lib/documented-endpoint');
const ENDPOINT = 'https://ikhlasapi.web.id/api/ai/glm47flash';
const { scrape: ikhlasAiGlm47flash, cli } = documentedEndpoint(ENDPOINT, {
  source: 'ikhlas',
  field: 'result',
  params: {
    prompt: { required: true },
    system: {},
    temperature: {}
  }
});

module.exports = { ikhlasAiGlm47flash };
if (require.main === module) cli();
