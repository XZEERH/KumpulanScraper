#!/usr/bin/env node
'use strict';

/**
 * Name : Wayback Machine Availability
 * Base Web : https://archive.org/help/wayback_api.php
 * Description : Mencari snapshot arsip sebuah URL tanpa API key.
 * Note : Hanya membaca metadata arsip, tidak menyimpan halaman atau mengakses URL target.
 */

const { request, text, urlWithParams, failure, runCLI } = require('../lib/scraper-utils');
const SOURCE = 'wayback';
const USAGE = 'Usage: node scrapers/integrations/scrape-wayback.js https://example.com [--timestamp 20260101]';

async function wayback(target, options = {}) {
  try {
    target = text(target, 'URL', 2000);
    if (/^[a-z][a-z\d+.-]*:/i.test(target) && !/^https?:\/\//i.test(target)) throw new Error('URL harus memakai protokol HTTP atau HTTPS');
    const url = new URL(/^https?:\/\//i.test(target) ? target : `https://${target}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('URL harus HTTP/HTTPS tanpa kredensial');
    url.hash = '';
    const timestamp = options.timestamp === undefined ? undefined : text(options.timestamp, 'Timestamp', 14);
    if (timestamp !== undefined && !/^\d{1,14}$/.test(timestamp)) throw new Error('Timestamp harus terdiri dari 1-14 digit YYYYMMDDhhmmss');
    const payload = await request(urlWithParams('https://archive.org/wayback/available', { url: url.href, timestamp }), {
      ...options, interval: 1000, cacheTtl: 300000
    });
    if (!payload || !payload.archived_snapshots || typeof payload.archived_snapshots !== 'object') throw new Error('Respons Wayback tidak valid');
    const closest = payload.archived_snapshots.closest;
    const found = closest?.available === true;
    if (found && !/^https?:\/\//i.test(closest.url || '')) throw new Error('URL snapshot Wayback tidak valid');
    return { status: true, source: SOURCE, requestedUrl: url.href, found, snapshot: found ? {
      url: closest.url, timestamp: closest.timestamp, httpStatus: closest.status
    } : null };
  } catch (error) { return failure(SOURCE, error); }
}

module.exports = { wayback };
if (require.main === module) runCLI(SOURCE, USAGE, (args) => wayback(args._[0], args), ['timestamp']);
