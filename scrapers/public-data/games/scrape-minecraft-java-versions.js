#!/usr/bin/env node
'use strict';

/**
 * Name : Minecraft Java Version Manifest
 * Creator : lmavour
 * Source : https://minecraft.wiki/w/Java_Edition_version_manifest
 * Base Web : https://piston-meta.mojang.com
 * Type : Scraper
 * Description : Membaca versi resmi Minecraft Java, termasuk rilis dan snapshot terbaru.
 * Note : node scrapers/public-data/games/scrape-minecraft-java-versions.js --help
 */

const { jsonEndpoint } = require('../../lib/scraper-utils');
const ENDPOINT = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const { scrape: minecraftJavaVersions, cli } = jsonEndpoint(ENDPOINT, {
  source: 'mojang', interval: 1500,
  selectData: (payload) => !payload?.error && payload?.status !== false && Array.isArray(payload?.['versions']) ? payload : null
});

module.exports = { minecraftJavaVersions };
if (require.main === module) cli();
