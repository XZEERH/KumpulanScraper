#!/usr/bin/env node
'use strict';

/**
 * Name : DeepAI Mathematics Solver
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Advanced AI specialized in solving complex mathematical problems, calculus, and step-by-step reasoning with LaTeX extraction and image support.
 * Note : node scrapers/kyio/ai/scrape-deepai-math.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/deepai-math';
const { scrape: aiDeepaiMath, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  fileParam: 'file',
  params: {
    q: {},
    file: {},
    url: {},
    lang: {},
    latex: {},
    image: {}
  }
});

module.exports = { aiDeepaiMath };
if (require.main === module) cli();
