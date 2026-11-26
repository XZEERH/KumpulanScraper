'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { request, integer, isoDate, imageEndpoint } = require('../scrapers/lib/scraper-utils');

const root = join(__dirname, '..');
const childOptions = { cwd: root, encoding: 'utf8', timeout: 10000 };

const modules = [
  ['scrape-equran.js', 'equran'], ['scrape-aladhan.js', 'aladhan'], ['scrape-anilist.js', 'anilist'],
  ['scrape-frankfurter.js', 'frankfurter'], ['scrape-steam.js', 'steam'],
  ['scrape-openmeteo.js', 'openmeteo'], ['scrape-bluesky.js', 'bluesky'],
  ['scrape-jikan.js', 'jikan'], ['scrape-googlenews.js', 'googleNews'],
  ['scrape-openlibrary.js', 'openlibrary'], ['scrape-itunes.js', 'itunes'],
  ['scrape-mangadex.js', 'mangadex'], ['scrape-githubtrending.js', 'githubTrending'],
  ['scrape-harilibur.js', 'hariLibur'], ['scrape-npm.js', 'npmScraper'],
  ['scrape-hackernews.js', 'hackernews'], ['scrape-openfoodfacts.js', 'openfoodfacts'],
  ['scrape-wayback.js', 'wayback']
].map(([file, name]) => [`scrapers/integrations/${file}`, name]);
const siputzxRoot = 'scrapers/siputzx';
const categoryFolders = { d: 'downloader', m: 'maker', r: 'random', s: 'search' };
const siputzxFiles = readdirSync(join(root, siputzxRoot), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .flatMap(({ name }) => readdirSync(join(root, siputzxRoot, name))
    .filter((file) => /^scrape-siputzx-.+\.js$/.test(file))
    .map((file) => `${siputzxRoot}/${name}/${file}`))
  .sort();
const entryPoints = [...modules, ...siputzxFiles.map((file) => [file])];
const api = {};
const nativeFetch = global.fetch;
const networkBlock = 'data:text/javascript,' + encodeURIComponent(
  "let calls=0; globalThis.fetch=async()=>{calls++;throw new Error('NETWORK_DISABLED');}; process.on('beforeExit',()=>{if(calls)process.exitCode=99;});"
);

before(() => {
  global.fetch = async () => { throw new Error('Network disabled in offline tests'); };
  for (const [file, name] of modules) api[name] = require(join(root, file))[name];
});
after(() => { global.fetch = nativeFetch; });

function mockHTTP(t, resolver) {
  const previous = global.fetch;
  const calls = [];
  global.fetch = async (input, options) => {
    const url = new URL(input);
    calls.push({ url, options });
    assert.match(options.headers['User-Agent'], /KumpulanScraperv2/);
    assert.equal(options.headers.Cookie, undefined);
    for (const name of url.searchParams.keys()) assert.doesNotMatch(name, /api_?key|access_token/i);
    if (options.headers.Authorization) {
      assert.equal(url.origin, 'https://world.openfoodfacts.net');
      assert.equal(options.headers.Authorization, `Basic ${Buffer.from('off:off').toString('base64')}`);
    }
    const body = await resolver(url, options);
    return body instanceof Response ? body : new Response(typeof body === 'string' ? body : JSON.stringify(body));
  };
  t.after(() => { global.fetch = previous; });
  return calls;
}

test('all new modules import without requests, output, or automatic CLI execution', () => {
  const code = `for(const file of ${JSON.stringify(entryPoints.map(([file]) => `./${file}`))}) require(file); process.stdout.write('OK');`;
  const child = spawnSync(process.execPath, ['--import', networkBlock, '-e', code], childOptions);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, 'OK');
});

test('CLI treats --help after the -- separator as literal input', () => {
  const code = "process.argv=['node','test','--','--help'];require('./scrapers/lib/scraper-utils').runCLI('test','Usage: test',async args=>({status:true,value:args._[0]}));";
  const child = spawnSync(process.execPath, ['--import', networkBlock, '-e', code], childOptions);
  assert.equal(child.status, 0, child.stderr);
  assert.equal(JSON.parse(child.stdout).value, '--help');
});

for (const [file, name] of entryPoints) {
  test(`${file}: syntax, export, help, and unknown flags`, () => {
    if (name) assert.equal(typeof api[name], 'function');
    else assert.deepEqual(Object.values(require(join(root, file))).map((value) => typeof value), ['function']);
    const checked = spawnSync(process.execPath, ['--check', file], childOptions);
    assert.equal(checked.status, 0, checked.stderr);
    const help = spawnSync(process.execPath, ['--import', networkBlock, file, '--help'], childOptions);
    assert.equal(help.status, 0, help.stderr);
    assert.match(help.stdout, /Usage:/);
    assert.ok(help.stdout.includes(`node ${file}`));
    if (!name) {
      const endpoint = help.stdout.match(/^Endpoint: ([^\r\n]+)$/m)?.[1];
      assert.ok(endpoint);
      const slug = endpoint.replace(/[/_]/g, '-').replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      const [group] = endpoint.split('/');
      assert.equal(file, `${siputzxRoot}/${categoryFolders[group] ?? group}/scrape-siputzx-${slug}.js`);
      const code = readFileSync(join(root, file), 'utf8');
      const header = code.match(/\/\*\*([\s\S]*?)\*\//)?.[1];
      assert.ok(header);
      for (const field of ['Name', 'Source', 'Base Web', 'Description']) {
        assert.match(header, new RegExp(`^ \\* ${field} : \\S`, 'm'));
      }
      assert.match(header, /^ \* Creator : lmavour$/m);
      assert.match(header, /^ \* Type : Scraper$/m);
      assert.ok(header.includes(` * Note : node ${file}`));
      assert.ok(code.includes(`const ENDPOINT = 'https://api.siputzx.my.id/api/${endpoint}';`));
      assert.ok(code.includes("require('../../lib/scraper-utils')"));
    }
    const bad = spawnSync(process.execPath, ['--import', networkBlock, file, '--unknown'], childOptions);
    assert.equal(bad.status, 1);
    assert.match(JSON.parse(bad.stdout).message, /Opsi tidak dikenal/);
  });
}

const rss = '<rss version="2.0"><channel><item><title>Test &amp; News</title><link>https://news.google.com/rss/articles/test</link><pubDate>Tue, 24 Nov 2026 12:00:00 GMT</pubDate><source url="https://example.com">Publisher</source></item></channel></rss>';
const trending = '<article class="Box-row"><h2><a href="/owner/repo">owner / repo</a></h2><p>A test repo</p><span itemprop="programmingLanguage">JavaScript</span><a href="/owner/repo/stargazers">12,000</a><a href="/owner/repo/forks">50</a><span class="float-sm-right">1,200 stars this week</span></article>';
const uuid = '11111111-2222-3333-4444-555555555555';
const successes = [
  { name: 'equran', args: ['surat', { surah: 112, cache: false }], body: { code: 200, data: { nomor: 112, ayat: [] } }, check: (r) => assert.equal(r.data.nomor, 112) },
  { name: 'aladhan', args: ['Jakarta', 'Indonesia', { date: '2026-11-25', cache: false }], body: { code: 200, data: { timings: { Fajr: '04:00' }, meta: { timezone: 'Asia/Jakarta', method: { id: 20 } }, date: {} } }, check: (r, c) => { assert.equal(r.timezone, 'Asia/Jakarta'); assert.equal(c[0].url.searchParams.get('method'), '20'); } },
  { name: 'frankfurter', args: ['usd', 'idr', { amount: 0, cache: false }], body: { base: 'USD', quote: 'IDR', date: '2026-11-24', rate: 16000 }, check: (r) => assert.equal(r.converted, 0) },
  { name: 'steam', args: ['Test Game', { limit: 1, cache: false }], body: { total: 1, items: [{ id: 413150, name: 'Test Game', metascore: 0, price: { currency: 'IDR', initial: 0, final: 0 } }] }, check: (r) => { assert.equal(r.results[0].price.final, 0); assert.equal(r.results[0].metascore, 0); } },
  { name: 'openmeteo', args: [0, 0, { mode: 'air-quality', days: 1, cache: false }], body: { current: { pm2_5: 0 }, latitude: 0, longitude: 0 }, check: (r, c) => { assert.equal(r.mode, 'air-quality'); assert.equal(c[0].url.searchParams.get('latitude'), '0'); } },
  { name: 'bluesky', args: ['https://bsky.app/profile/test.bsky.social', { cache: false }], body: { did: 'did:plc:test', handle: 'test.bsky.social', followersCount: 0, followsCount: 0, postsCount: 0 }, check: (r) => assert.equal(r.profile.followers, 0) },
  { name: 'jikan', args: ['Test Anime', { limit: 1, cache: false }], body: { data: [{ mal_id: 1, title: 'Test Anime', score: 0, genres: [] }], pagination: {} }, check: (r, c) => { assert.equal(r.results[0].score, 0); assert.equal(c[0].url.searchParams.get('sfw'), 'true'); } },
  { name: 'googleNews', args: ['test', { limit: 1, cache: false }], body: rss, check: (r) => { assert.equal(r.results[0].title, 'Test & News'); assert.equal(r.results[0].publisher, 'Publisher'); } },
  { name: 'openlibrary', args: ['Test Book', { limit: 1, cache: false }], body: { numFound: 1, docs: [{ key: '/works/OL1W', title: 'Test Book', author_name: ['Author'], cover_i: 12 }] }, check: (r) => assert.equal(r.results[0].url, 'https://openlibrary.org/works/OL1W') },
  { name: 'itunes', args: ['Test Podcast', { limit: 1, cache: false }], body: { resultCount: 1, results: [{ trackId: 1, trackName: 'Test Podcast', feedUrl: 'https://example.com/feed.xml' }] }, check: (r) => { assert.equal(r.results[0].feedUrl, 'https://example.com/feed.xml'); assert.equal(r.results[0].previewUrl, undefined); } },
  { name: 'mangadex', args: ['Test Manga', { limit: 1, cache: false }], body: { result: 'ok', total: 1, data: [{ id: uuid, attributes: { title: { en: 'Test Manga' }, contentRating: 'safe' }, relationships: [] }] }, check: (r, c) => { assert.equal(r.results[0].title, 'Test Manga'); assert.deepEqual(c[0].url.searchParams.getAll('contentRating[]'), ['safe']); } },
  { name: 'githubTrending', args: ['javascript', { since: 'weekly', limit: 1, cache: false }], body: trending, check: (r) => { assert.equal(r.results[0].stars, 12000); assert.equal(r.results[0].starsInPeriod, 1200); } },
  { name: 'hariLibur', args: [2026, { month: 1, cache: false }], body: { '2026-01-01': { summary: 'Cuti Bersama Test (belum pasti)' }, '2027-01-01': { summary: 'Test' }, info: { updated: '20261123 17:05:40' } }, check: (r) => { assert.equal(r.total, 1); assert.equal(r.results[0].tentative, true); assert.equal(r.results[0].jointHoliday, true); } },
  { name: 'npmScraper', args: ['@test/tools', { mode: 'package', cache: false }], body: { name: '@test/tools', version: '1.0.0', license: 'MIT', dependencies: { example: '^1.0.0' } }, check: (r, c) => { assert.equal(r.package.version, '1.0.0'); assert.match(decodeURIComponent(c[0].url.pathname), /@test\/tools\/latest/); } },
  { name: 'hackernews', args: ['top', { limit: 1, cache: false }], body: (url) => url.pathname.includes('/item/') ? { id: 1001, type: 'story', title: 'Test Story', score: 0, time: 0 } : [1001], check: (r, c) => { assert.equal(r.results[0].score, 0); assert.equal(c.length, 2); } },
  { name: 'openfoodfacts', args: ['3274080005003', { staging: true, cache: false }], body: { product: { product_name: 'Test Product', nutriments: { proteins: 1 } } }, check: (r, c) => { assert.equal(r.environment, 'staging'); assert.equal(c[0].url.origin, 'https://world.openfoodfacts.net'); } },
  { name: 'wayback', args: ['https://example.com/a?x=1&y=2', { timestamp: '20260101', cache: false }], body: { archived_snapshots: { closest: { available: true, url: 'https://web.archive.org/web/20260101000000/https://example.com', timestamp: '20260101000000', status: '200' } } }, check: (r, c) => { assert.equal(r.found, true); assert.equal(c[0].url.searchParams.get('url'), 'https://example.com/a?x=1&y=2'); } }
];

for (const entry of successes) {
  test(`${entry.name}: normalizes a successful response without an API key`, async (t) => {
    const calls = mockHTTP(t, (url, options) => typeof entry.body === 'function' ? entry.body(url, options) : entry.body);
    const result = await api[entry.name](...entry.args);
    assert.equal(result.status, true, JSON.stringify(result));
    assert.equal(typeof result.source, 'string');
    assert.ok(calls.length > 0);
    entry.check(result, calls);
  });
}

const invalid = [
  ['equran', ['surat', { surah: 115 }]], ['aladhan', ['', 'Indonesia']],
  ['equran', ['shalat', { provinsi: 'Jawa Barat', kabkota: 'Kota Bogor', bulan: 13 }]],
  ['anilist', ['Test', { limit: 11 }]],
  ['frankfurter', ['USD', 'IDR', { amount: -1 }]], ['steam', ['Test', { country: 'IND' }]],
  ['openmeteo', [91, 0]], ['bluesky', ['https://example.com/profile/user']],
  ['jikan', ['Test', { type: 'users' }]], ['googleNews', ['Test', { country: 'IND' }]],
  ['openlibrary', ['9780000000000', { mode: 'isbn' }]], ['itunes', ['Test', { type: 'software' }]],
  ['mangadex', ['not-a-uuid', { mode: 'chapters' }]], ['githubTrending', ['../javascript']],
  ['hariLibur', [2026, { date: '2027-01-01' }]], ['npmScraper', ['../../file', { mode: 'package' }]],
  ['hackernews', ['comments']], ['openfoodfacts', ['abc']], ['wayback', ['https://user:password@example.com']]
];
for (const [name, args] of invalid) {
  test(`${name}: rejects invalid input before any request`, async (t) => {
    const calls = mockHTTP(t, () => { throw new Error('Request must not happen'); });
    const result = await api[name](...args);
    assert.equal(result.status, false);
    assert.equal(typeof result.message, 'string');
    assert.equal(calls.length, 0);
  });
}

test('numeric validation rejects whitespace, arrays, and booleans; dates reject rollover', () => {
  for (const value of [' ', [], [1], true, null]) assert.throws(() => integer(value, 1, 0, 10));
  assert.equal(integer(0, 1, 0, 10), 0);
  assert.throws(() => isoDate('2026-02-30'));
  assert.equal(isoDate('2024-02-29'), '2024-02-29');
});

test('blank conversion amounts and non-HTTP URL schemes never make requests', async (t) => {
  const calls = mockHTTP(t, () => { throw new Error('Request must not happen'); });
  assert.equal((await api.frankfurter('USD', 'IDR', { amount: ' ' })).status, false);
  assert.equal((await api.wayback('ftp://example.com')).status, false);
  assert.equal(calls.length, 0);
});

test('RSS and HTML parsers reject block pages but accept an empty real feed', () => {
  const { parseNewsRSS } = require('../scrapers/integrations/scrape-googlenews');
  const { parseTrending } = require('../scrapers/integrations/scrape-githubtrending');
  assert.throws(() => parseNewsRSS('<html>Access denied</html>'));
  assert.throws(() => parseTrending('<html>Access denied</html>'));
  assert.deepEqual(parseNewsRSS('<rss><channel></channel></rss>'), []);
  assert.deepEqual(parseTrending('<div class="blankslate">No trending repositories</div>'), []);
});

test('caching avoids duplicate calls, does not share mutable objects, and can be disabled', async (t) => {
  const calls = mockHTTP(t, () => ({ value: 1 }));
  const url = 'https://cache-test.example.test/data';
  const first = await request(url, { interval: 0 });
  first.value = 2;
  assert.equal((await request(url, { interval: 0 })).value, 1);
  assert.equal(calls.length, 1);
  await request(url, { interval: 0, cache: false });
  assert.equal(calls.length, 2);
});

test('HTTP 429 is not retried and stops queued requests to the same origin', async (t) => {
  const calls = mockHTTP(t, () => new Response('{}', { status: 429, headers: { 'Retry-After': '2' } }));
  const results = await Promise.allSettled([
    request('https://rate-test.example.test/first', { interval: 50, cache: false }),
    request('https://rate-test.example.test/queued', { interval: 50, cache: false })
  ]);
  for (const result of results) {
    assert.equal(result.status, 'rejected');
    assert.equal(result.reason.httpStatus, 429);
    assert.equal(result.reason.retryAfter, 2);
  }
  assert.equal(calls.length, 1);
});

test('request timeout aborts the fetch instead of leaving a retry loop', async (t) => {
  const previous = global.fetch;
  global.fetch = (_, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  t.after(() => { global.fetch = previous; });
  await assert.rejects(request('https://timeout-test.example.test/data', { timeout: 20, interval: 0, cache: false }), /timeout/);
});

test('invalid JSON, server errors, and oversized responses are rejected', async (t) => {
  mockHTTP(t, (url) => url.pathname === '/bad-json' ? 'not json'
    : url.pathname === '/server-error' ? new Response('unavailable', { status: 503 })
      : 'x'.repeat(2 * 1024 * 1024 + 1));
  await assert.rejects(request('https://error-test.example.test/bad-json', { interval: 0, cache: false }), /JSON/);
  await assert.rejects(request('https://error-test.example.test/server-error', { interval: 0, cache: false }), (error) => error.httpStatus === 503);
  await assert.rejects(request('https://error-test.example.test/too-large', { interval: 0, format: 'text', cache: false }), /2 MB/);
});

test('connection failure keeps the network error code instead of claiming empty results', async (t) => {
  mockHTTP(t, () => { throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }); });
  const result = await api.jikan('Network Test', { cache: false });
  assert.equal(result.status, false);
  assert.equal(result.errorCode, 'UND_ERR_CONNECT_TIMEOUT');
});

test('Open Food Facts distinguishes a missing product from a broken API route', async (t) => {
  mockHTTP(t, () => new Response('{"error":"route not found"}', { status: 404 }));
  const result = await api.openfoodfacts('3274080005003', { staging: true, cache: false });
  assert.equal(result.status, false);
});

test('Open Food Facts accepts a real product_not_found response without masking other 404s', async (t) => {
  mockHTTP(t, () => new Response('{"result":{"id":"product_not_found"}}', { status: 404 }));
  const result = await api.openfoodfacts('3274080005003', { staging: true, cache: false });
  assert.equal(result.status, true);
  assert.equal(result.found, false);
});

test('EQuran rejects an empty detail object instead of claiming a successful lookup', async (t) => {
  mockHTTP(t, () => ({ code: 200, data: {} }));
  assert.equal((await api.equran('surat', { surah: 1, cache: false })).status, false);
});

test('EQuran shalat sends JSON POST and caches by location and period', async (t) => {
  const calls = mockHTTP(t, (_, { body }) => ({
    code: 200,
    data: { ...JSON.parse(body), jadwal: [{ tanggal: 1, subuh: '04:35' }] }
  }));
  const period = { bulan: 11, tahun: 2026, provinsi: 'Jawa Barat', kabkota: 'Kota Bogor' };
  const first = await api.equran('shalat', period);
  assert.equal(first.status, true);
  assert.equal(first.data.jadwal[0].subuh, '04:35');
  assert.deepEqual(await api.equran('shalat', period), first);
  assert.equal((await api.equran('shalat', { ...period, kabkota: 'Kota Bandung' })).data.kabkota, 'Kota Bandung');
  assert.equal((await api.equran('shalat', { ...period, bulan: 12 })).data.bulan, 12);
  assert.equal(calls.length, 3);
  assert.equal(calls[0].url.href, 'https://equran.id/api/v2/shalat');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(calls[0].options.body), period);
});

test('AniList searches by GraphQL variables without caching results', async (t) => {
  const calls = mockHTTP(t, () => ({
    data: { Page: { media: [{ id: 30013, title: { romaji: 'ONE PIECE' }, chapters: null, averageScore: 92 }] } }
  }));
  const query = 'One Piece "test"';
  const options = { type: 'manga', limit: 1, cache: true };
  const result = await api.anilist(query, options);
  assert.equal(result.status, true);
  assert.equal(result.results[0].title, 'ONE PIECE');
  assert.equal(result.results[0].chapters, null);
  assert.equal(result.results[0].averageScore, 92);
  assert.deepEqual(await api.anilist(query, options), result);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.origin, 'https://graphql.anilist.co');
  assert.equal(calls[0].options.method, 'POST');
  const payload = JSON.parse(calls[0].options.body);
  assert.match(payload.query, /isAdult: false/);
  assert.ok(!payload.query.includes(query));
  assert.deepEqual(payload.variables, { search: query, type: 'MANGA', limit: 1 });
});

test('AniList does not treat GraphQL errors as empty search results', async (t) => {
  mockHTTP(t, () => ({ data: { Page: { media: [] } }, errors: [{ message: 'Query failed' }] }));
  const result = await api.anilist('Test Anime');
  assert.equal(result.status, false);
  assert.equal(result.message, 'Query failed');
});

test('Siputzx uses standalone files and the no-argument CLI fetches only its own route', () => {
  assert.ok(siputzxFiles.length >= 114);
  assert.ok(!readdirSync(root).some((file) => /^scrape-.+\.js$/.test(file)));
  assert.throws(() => require.resolve('../scrapers/siputzx/scrape-siputzx'), { code: 'MODULE_NOT_FOUND' });
  assert.throws(() => require.resolve('../scrapers/lib/siputzx-utils'), { code: 'MODULE_NOT_FOUND' });
  const mock = 'data:text/javascript,' + encodeURIComponent(`globalThis.fetch=async url=>{
    if(url !== 'https://api.siputzx.my.id/api/berita/antara') throw new Error('Wrong route');
    return Response.json({status:true,data:[{title:'Test article'}]});
  };`);
  const child = spawnSync(process.execPath, [
    '--import', mock, 'scrapers/siputzx/berita/scrape-siputzx-berita-antara.js'
  ], childOptions);
  assert.equal(child.status, 0, child.stderr || child.stdout);
  assert.deepEqual(JSON.parse(child.stdout), {
    status: true, source: 'siputzx', endpoint: 'berita/antara', timestamp: null, data: [{ title: 'Test article' }]
  });
});

test('Siputzx rejects missing and out-of-range endpoint parameters offline', async (t) => {
  const calls = mockHTTP(t, () => { throw new Error('Request must not happen'); });
  const { toolsCountryInfo } = require('../scrapers/siputzx/tools/scrape-siputzx-tools-country-info');
  const { gamesCerdasCermat } = require('../scrapers/siputzx/games/scrape-siputzx-games-cc-sd');
  const { gamesMaths } = require('../scrapers/siputzx/games/scrape-siputzx-games-maths');
  for (const [scrape, options] of [
    [toolsCountryInfo], [gamesCerdasCermat, { matapelajaran: 'matematika', jumlahsoal: 20 }],
    [gamesMaths, { level: 'invalid' }]
  ]) {
    assert.equal((await scrape(options)).status, false);
  }
  assert.equal(calls.length, 0);
});

test('Siputzx forwards only the documented query fields and preserves HTTP denial', async (t) => {
  const { toolsTranslate } = require('../scrapers/siputzx/tools/scrape-siputzx-tools-translate');
  const { infoBmkg } = require('../scrapers/siputzx/info/scrape-siputzx-info-bmkg');
  const calls = mockHTTP(t, (url) => url.pathname.endsWith('/tools/translate')
    ? { status: true, data: { translatedText: 'Satu & Dua' }, timestamp: '2026-11-26' }
    : new Response('forbidden', { status: 403 }));
  const result = await toolsTranslate({ text: 'One & Two', source: 'en', target: 'id', endpoint: 'other/route', extra: 'ignored' });
  assert.equal(result.status, true);
  assert.equal(result.data.translatedText, 'Satu & Dua');
  assert.equal(calls[0].url.origin, 'https://api.siputzx.my.id');
  assert.deepEqual([...calls[0].url.searchParams], [['text', 'One & Two'], ['source', 'en'], ['target', 'id']]);
  assert.equal(calls[0].url.pathname, '/api/tools/translate');
  const denied = await infoBmkg();
  assert.equal(denied.status, false);
  assert.equal(denied.httpStatus, 403);
  assert.equal(calls.length, 2);
});

test('Siputzx does not cache randomized quiz responses', async (t) => {
  const { gamesCakLontong } = require('../scrapers/siputzx/games/scrape-siputzx-games-caklontong');
  let number = 0;
  const calls = mockHTTP(t, () => ({ status: true, data: { soal: ++number } }));
  assert.equal((await gamesCakLontong()).data.soal, 1);
  assert.equal((await gamesCakLontong()).data.soal, 2);
  assert.equal(calls.length, 2);
});

test('Siputzx QwQ accepts fractional temperature, skips caching, and rejects empty answers', async (t) => {
  const { aiQwq32b } = require('../scrapers/siputzx/ai/scrape-siputzx-ai-qwq32b');
  let answer = 'Halo!';
  const calls = mockHTTP(t, () => ({ status: true, data: { response: answer } }));
  for (const temperature of [-0.1, 2.1, ' ', false]) {
    assert.equal((await aiQwq32b({ prompt: 'Halo', temperature })).status, false);
  }
  assert.equal((await aiQwq32b()).status, false);
  assert.equal(calls.length, 0);

  const input = { prompt: 'Satu & dua?', system: 'Jawab singkat', temperature: '0.7', cache: true, cookie: 'ignored' };
  assert.equal((await aiQwq32b(input)).data.response, 'Halo!');
  answer = '   ';
  assert.equal((await aiQwq32b(input)).status, false);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url.pathname, '/api/ai/qwq32b');
  assert.deepEqual([...calls[0].url.searchParams], [['prompt', input.prompt], ['system', input.system], ['temperature', '0.7']]);
  assert.equal(calls[0].options.redirect, 'error');
});

test('Siputzx preserves text and structured AI replies and canonical translation codes', async (t) => {
  const { aiGita } = require('../scrapers/siputzx/ai/scrape-siputzx-ai-gita');
  const { aiBibleAI } = require('../scrapers/siputzx/ai/scrape-siputzx-ai-bibleai');
  const { aiMetaAI } = require('../scrapers/siputzx/ai/scrape-siputzx-ai-metaai');
  const bible = { results: { answer: 'A test answer', sources: ['Test reference'] } };
  const calls = mockHTTP(t, (url) => ({ status: true, data: url.pathname.endsWith('/bibleai') ? bible : 'A text reply' }));
  assert.equal((await aiGita({ q: 'What is the Bhagavad Gita?' })).data, 'A text reply');
  assert.deepEqual((await aiBibleAI({ question: 'What is a parable?', translation: 'esv' })).data, bible);
  assert.equal((await aiMetaAI({ query: 'Hello' })).data, 'A text reply');
  assert.deepEqual(calls.map(({ url }) => [...url.searchParams.keys()]), [['q'], ['question', 'translation'], ['query']]);
  assert.equal(calls[1].url.searchParams.get('translation'), 'ESV');
});

test('Siputzx Brat returns verified PNG/GIF bytes as Base64 and rejects a mismatched body', async (t) => {
  const { makeBrat } = require('../scrapers/siputzx/maker/scrape-siputzx-m-brat');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  const calls = mockHTTP(t, (url) => {
    const animated = url.searchParams.get('isAnimated') === 'true';
    const body = url.searchParams.get('text') === 'wrong' ? 'not a PNG' : animated ? gif : png;
    return new Response(body, { headers: { 'Content-Type': animated ? 'image/gif' : 'image/png' } });
  });
  assert.equal((await makeBrat({ text: 'Halo', isAnimated: 'invalid' })).status, false);
  assert.equal((await makeBrat({ text: 'Halo', delay: 99 })).status, false);
  assert.equal(calls.length, 0);
  assert.deepEqual((await makeBrat({ text: 'Halo' })).data, { mimeType: 'image/png', base64: png.toString('base64') });
  assert.deepEqual((await makeBrat({ text: 'Halo dunia', isAnimated: true, delay: 500 })).data,
    { mimeType: 'image/gif', base64: gif.toString('base64') });
  assert.equal(calls[1].url.pathname, '/api/m/brat');
  assert.equal(calls[1].url.searchParams.get('delay'), '500');
  assert.equal((await makeBrat({ text: 'wrong' })).status, false);
});

test('image endpoints accept public image sources and verify the returned format without caching', async (t) => {
  const { scrape } = imageEndpoint('https://image-endpoint-test.example.test/api/canvas/example', {
    source: 'test', interval: 0, params: { image: { required: true, type: 'image-url' } }
  });
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  let responseType = 'image/png';
  const calls = mockHTTP(t, () => new Response(png, { headers: { 'Content-Type': responseType } }));
  for (const input of ['http://placehold.co/test.png', 'https://127.0.0.1/test.png', 'https://placehold.co.example.test/test.png']) {
    assert.equal((await scrape({ image: input })).status, false);
  }
  assert.equal(calls.length, 0);
  const image = 'https://placehold.co/400x300.png?tracking=omit#fragment';
  const result = await scrape({ image });
  assert.deepEqual(result.data, { mimeType: 'image/png', base64: png.toString('base64') });
  assert.equal(result.timestamp, null);
  assert.equal(calls[0].url.searchParams.get('image'), 'https://placehold.co/400x300.png');
  assert.equal(calls[0].options.redirect, 'error');
  responseType = 'image/jpeg';
  assert.equal((await scrape({ image })).status, false);
  assert.equal(calls.length, 2);
});

test('Siputzx image modules reject unapproved screenshot destinations and sanitize leaderboard input', async (t) => {
  const { toolsScreenshot } = require('../scrapers/siputzx/tools/scrape-siputzx-tools-ssweb');
  const { canvasTop } = require('../scrapers/siputzx/canvas/scrape-siputzx-canvas-top');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1sAAAAASUVORK5CYII=', 'base64');
  const calls = mockHTTP(t, () => new Response(png, { headers: { 'Content-Type': 'image/png' } }));
  for (const url of ['https://localhost', 'https://example.com.example.test/', 'https://example.com/not-a-demo']) {
    assert.equal((await toolsScreenshot({ url })).status, false);
  }
  const background = 'https://placehold.co/400x300.png';
  assert.equal((await canvasTop({ background, usersData: '[{"avatar":"https://unapproved.example.test/avatar"}]' })).status, false);
  assert.equal(calls.length, 0);
  const usersData = JSON.stringify([{ top: 1, avatar: `${background}?tracking=ignored#ignored`, tag: 'Demo', score: 10, extra: 'ignored' }]);
  assert.equal((await canvasTop({ background, usersData })).status, true);
  const query = calls[0].url.searchParams;
  assert.deepEqual(JSON.parse(query.get('usersData')), [{ top: 1, avatar: background, tag: 'Demo', score: 10 }]);
});

test('Siputzx public-profile module drops private profiles and excludes upstream account identifiers', async (t) => {
  const { stalkTikTok } = require('../scrapers/siputzx/stalk/scrape-siputzx-stalk-tiktok');
  const data = {
    found: true, handle: 'example', url: 'https://www.tiktok.com/@example',
    user: { privateAccount: false, nickname: 'Demo', verified: false, secUid: 'fixture', email: 'example@example.test' },
    stats: { followers: 42, videos: 6 }
  };
  const calls = mockHTTP(t, () => ({ status: true, data }));
  assert.equal((await stalkTikTok({ username: 'example/other' })).status, false);
  assert.equal(calls.length, 0);
  const publicProfile = await stalkTikTok({ username: '@example', cache: false });
  assert.equal(publicProfile.status, true);
  assert.equal(publicProfile.data.followers, 42);
  assert.equal(publicProfile.data.user, undefined);
  assert.doesNotMatch(JSON.stringify(publicProfile), /secUid|@example\.test/);
  assert.equal(calls[0].url.searchParams.get('username'), 'example');
  data.user.privateAccount = true;
  assert.equal((await stalkTikTok({ username: 'example', cache: false })).status, false);
});

test('Siputzx downloaders reject invalid or unsupported public URLs before making a request', async (t) => {
  const { downloadGithub } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-github');
  const { downloadFastDL } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-fastdl');
  const { downloadTikTok } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-tiktok');
  const { download9xBuddy } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-9xbuddy');
  const calls = mockHTTP(t, () => assert.fail('Request must not happen'));
  for (const url of [undefined, 'http://github.com/owner/repo', 'https://github.com.example.test/owner/repo',
    'https://user@github.com/owner/repo', 'https://github.com:8443/owner/repo', 'https://github.com/owner/repo/issues']) {
    assert.equal((await downloadGithub({ url })).status, false);
  }
  assert.equal((await downloadFastDL({ url: 'https://www.instagram.com/stories/user/123' })).status, false);
  assert.equal((await downloadTikTok({ url: 'https://www.tiktok.com/explore' })).status, false);
  assert.equal((await download9xBuddy({ url: 'https://www.youtube.com/watch' })).status, false);
  assert.equal((await download9xBuddy({ url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ&v=invalid' })).status, false);
  assert.equal(calls.length, 0);
});

test('Siputzx GitHub returns only after finding an archive link and never fetches that link itself', async (t) => {
  const { downloadGithub } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-github');
  const downloadUrl = 'https://github.com/owner/repo/archive/refs/heads/main.zip';
  let data = { owner: 'owner', repo: 'repo', download_url: downloadUrl };
  const calls = mockHTTP(t, () => ({ status: true, data }));
  const input = { url: 'https://github.com/owner/repo?tracking=ignore#readme', cookie: 'ignored', cache: true };
  assert.equal((await downloadGithub(input)).data.download_url, downloadUrl);
  data = { download_url: 'https://example.test/repo.zip' };
  assert.equal((await downloadGithub(input)).status, false);
  assert.equal(calls.length, 2);
  for (const { url, options } of calls) {
    assert.equal(url.origin + url.pathname, 'https://api.siputzx.my.id/api/d/github');
    assert.deepEqual([...url.searchParams], [['url', 'https://github.com/owner/repo']]);
    assert.equal(options.redirect, 'error');
  }
});

test('Siputzx 9xbuddy keeps the video ID and returns only valid direct video formats', async (t) => {
  const { download9xBuddy } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-9xbuddy');
  const url = 'https://video-test.googlevideo.com/videoplayback?signature=sample';
  const calls = mockHTTP(t, () => ({ status: true, data: {
    ok: true, title: 'Test Video', duration: '5s', formats: [
      { external: true, type: 'video', url },
      { external: false, type: 'video', url: 'https://googlevideo.com.example.test/videoplayback' },
      { external: false, type: 'video', url, ext: 'mp4', quality: '360p', size: '1 MB' }
    ]
  } }));
  const result = await download9xBuddy({ url: 'https://www.youtube.com/watch?tracking=ignore&v=aqz-KE-bpKQ#t=5' });
  assert.equal(result.status, true);
  assert.deepEqual(result.data.formats, [{ url, ext: 'mp4', quality: '360p', size: '1 MB' }]);
  assert.equal(calls[0].url.pathname, '/api/d/9xbuddy');
  assert.deepEqual([...calls[0].url.searchParams], [['url', 'https://www.youtube.com/watch?v=aqz-KE-bpKQ']]);
  assert.equal(calls.length, 1);
});

test('Siputzx Lahelu projects only public post metadata instead of forwarding the raw payload', async (t) => {
  const { downloadLahelu } = require('../scrapers/siputzx/downloader/scrape-siputzx-d-lahelu');
  const media = 'https://cache.lahelu.com/example.webp';
  const calls = mockHTTP(t, (url) => ({ status: true, data: {
    status: true, sensitive: url.searchParams.get('url').endsWith('/PTest2'), post_id: 'PTest1', title: 'Cat',
    media, create_time: '2026-11-26T00:00:00Z', raw: { userInfo: { email: 'fixture@example.test' } }
  } }));
  const result = await downloadLahelu({ url: 'https://lahelu.com/post/PTest1' });
  assert.equal(result.status, true);
  assert.deepEqual(result.data, { postId: 'PTest1', title: 'Cat', media, createdAt: '2026-11-26T00:00:00Z' });
  assert.equal((await downloadLahelu({ url: 'https://lahelu.com/post/PTest2' })).status, false);
  assert.equal(calls.length, 2);
});

test('valid ISBN, chapter feed, and npm search/download modes use the correct endpoint', async (t) => {
  const calls = mockHTTP(t, (url) => {
    if (url.hostname === 'openlibrary.org') return { docs: [], numFound: 0 };
    if (url.hostname === 'api.mangadex.org') return { result: 'ok', total: 1, data: [{ id: uuid, attributes: { chapter: '1', translatedLanguage: 'id', pages: 20 }, relationships: [] }] };
    if (url.hostname === 'registry.npmjs.org') return { objects: [], total: 0 };
    return { downloads: 0, start: '2026-11-01', end: '2026-11-07' };
  });
  assert.equal((await api.openlibrary('978-0-306-40615-7', { mode: 'isbn', cache: false })).status, true);
  assert.equal((await api.mangadex(uuid, { mode: 'chapters', cache: false })).results[0].chapter, '1');
  assert.equal((await api.npmScraper('test', { mode: 'search', cache: false })).total, 0);
  assert.equal((await api.npmScraper('@test/tools', { mode: 'downloads', cache: false })).downloads, 0);
  assert.equal(calls[0].url.searchParams.get('isbn'), '9780306406157');
  assert.equal(calls[1].url.searchParams.get('translatedLanguage[]'), 'id');
});
