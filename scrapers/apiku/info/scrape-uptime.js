#!/usr/bin/env node
'use strict';

/**
 * Name : Uptime ApiKu
 * Source : https://apiku.irengcloud.com/docs/
 * Description : Membaca waktu server dan lama layanan berjalan dari endpoint status publik.
 * Note : node scrapers/apiku/info/scrape-uptime.js
 */

const { apikuEndpoint, hasText } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://apiku.irengcloud.com/api/v1/stats';
const { scrape: uptime, cli } = apikuEndpoint(ENDPOINT, {
  cache: false,
  mapData: (payload) => {
    const stats = payload.data ?? payload;
    return { serverTime: stats.server_time, uptimeSeconds: stats.uptime_seconds, uptime: stats.uptime_formatted };
  },
  validateData: (data) => hasText(data.serverTime) && Number.isFinite(data.uptimeSeconds) && data.uptimeSeconds >= 0
});

module.exports = { uptime };
if (require.main === module) cli();
