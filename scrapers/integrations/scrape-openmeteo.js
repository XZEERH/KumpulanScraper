#!/usr/bin/env node
'use strict';

/**
 * Name : Open-Meteo
 * Creator : lmavour
 * Base Web : https://open-meteo.com/en/docs
 * Description : Cuaca dan kualitas udara berdasarkan koordinat tanpa API key.
 * Note : Free API hanya untuk nonkomersial; wajib atribusi Open-Meteo dan sumber data.
 */

const { request, choice, text, integer, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'open-meteo';
const USAGE = 'Usage: node scrapers/integrations/scrape-openmeteo.js <weather|air-quality> <latitude> <longitude> [--days 3] [--timezone auto]';

async function openmeteo(latitude, longitude, options = {}) {
  try {
    for (const [value, name, max] of [[latitude, 'Latitude', 90], [longitude, 'Longitude', 180]]) {
      if (!['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > max) {
        throw new Error(`${name} harus berupa angka antara -${max} dan ${max}`);
      }
    }
    latitude = Number(latitude);
    longitude = Number(longitude);
    const mode = choice(options.mode, 'weather', ['weather', 'air-quality']);
    const days = integer(options.days, 3, 1, mode === 'weather' ? 7 : 5, 'Hari prakiraan');
    const timezone = text(options.timezone ?? 'auto', 'Zona waktu', 100);
    const base = mode === 'weather' ? 'https://api.open-meteo.com/v1/forecast' : 'https://air-quality-api.open-meteo.com/v1/air-quality';
    const params = mode === 'weather' ? {
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    } : { current: 'pm2_5,pm10,us_aqi', hourly: 'pm2_5,pm10,us_aqi' };
    const payload = await request(urlWithParams(base, { latitude, longitude, timezone, forecast_days: days, ...params }), {
      ...options, interval: 250, cacheTtl: 300000
    });
    if (!payload || payload.error || !payload.current) throw new Error(payload?.reason || 'Data Open-Meteo tidak valid');
    return {
      status: true, source: SOURCE, mode, attribution: 'Open-Meteo (CC BY 4.0); lihat dokumentasi untuk atribusi penyedia model',
      usage: 'non-commercial free API', data: payload
    };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { openmeteo };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => openmeteo(args._[1], args._[2], { ...args, mode: args._[0] }), ['days', 'timezone']);
