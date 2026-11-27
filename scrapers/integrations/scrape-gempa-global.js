#!/usr/bin/env node
'use strict';

/**
 * Name : Gempa Global
 * Source : https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
 * Base Web : https://earthquake.usgs.gov
 * Type : Scraper
 * Description : Menampilkan gempa global magnitudo 4,5+ selama tujuh hari terakhir dari USGS.
 * Note : node scrapers/integrations/scrape-gempa-global.js --limit 5
 */

const { request, hasText, integer, httpsUrl, failure, runOptionsCLI } = require('../lib/scraper-utils');
const ENDPOINT = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';
const SOURCE = 'usgs';

function validTimestamp(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= 8640000000000000;
}

async function gempaGlobal(options = {}) {
  try {
    const limit = integer(options.limit, 10, 1, 50, 'Limit');
    const payload = await request(ENDPOINT, {
      timeout: options.timeout, cache: options.cache, interval: 1000, redirect: 'error'
    });
    if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) throw new Error('Feed gempa USGS tidak valid');
    const events = payload.features.flatMap((event) => {
      const p = event?.properties;
      const coords = event?.geometry?.coordinates;
      if (!hasText(event?.id) || p?.type !== 'earthquake' || !Number.isFinite(p.mag) || !validTimestamp(p.time) ||
        event.geometry?.type !== 'Point' || !Array.isArray(coords)) return [];
      const [longitude, latitude, depthKm] = coords;
      if (![longitude, latitude, depthKm].every(Number.isFinite) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) return [];
      return [{
        id: event.id, place: p.place ?? null, magnitude: p.mag, latitude, longitude, depthKm,
        dateTime: new Date(p.time).toISOString(), url: httpsUrl(p.url, ['earthquake.usgs.gov'])?.href ?? null
      }];
    }).slice(0, limit);
    const generated = payload.metadata?.generated;
    return { status: true, source: SOURCE, attribution: 'USGS Earthquake Hazards Program', data: {
      generatedAt: validTimestamp(generated) ? new Date(generated).toISOString() : null, events
    } };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { gempaGlobal };
if (require.main === module) runOptionsCLI(SOURCE, '[--limit 10]', gempaGlobal);
