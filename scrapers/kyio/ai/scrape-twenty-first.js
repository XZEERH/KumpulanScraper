#!/usr/bin/env node
'use strict';

/**
 * Name : 21st.dev UI Registry & Prompts
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Scraper & API untuk 12,000+ hand-crafted React, Tailwind CSS, Framer Motion, dan shadcn/ui components dari 21st.dev dengan one-click install command dan source code TSX.
 * Note : node scrapers/kyio/ai/scrape-twenty-first.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/ai/twenty-first';
const { scrape: aiTwentyFirst, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    action: {},
    q: {},
    id: {},
    category: {},
    sort: {},
    page: {},
    limit: {}
  }
});

module.exports = { aiTwentyFirst };
if (require.main === module) cli();
