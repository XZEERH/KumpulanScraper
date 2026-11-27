#!/usr/bin/env node
'use strict';

/**
 * Name : WhatsApp Channel React
 * Creator : lmavour
 * Source : https://api.kyio.web.id/docs
 * Base Web : https://api.kyio.web.id
 * Type : Scraper
 * Description : Kirim emoji reaction ke postingan WhatsApp Channel secara otomatis.
 * Note : node scrapers/kyio/tools/scrape-whatsapp-react.js --help
 */

const { httpEndpoint } = require('../../lib/http-endpoint');
const { kyioHeaders } = require('../../lib/kyio');
const ENDPOINT = 'https://api.kyio.web.id/api/v2/tools/whatsapp-react';
const { scrape: toolsWhatsappReact, cli } = httpEndpoint(ENDPOINT, {
  source: 'kyio', headers: kyioHeaders,
  methods: ['GET', 'POST'],
  params: {
    url: { required: true },
    emoji: {},
    count: {}
  }
});

module.exports = { toolsWhatsappReact };
if (require.main === module) cli();
