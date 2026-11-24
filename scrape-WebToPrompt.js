/**
 * Name: Web To Prompt
 * Creator: Razeerh
 * Source: https://whatsapp.com/channel/0029VbCN4sQLo4hhDCkOHX1m
 * Base Web/Apps: https://www.gitreverse.com
 * Type: Scraper/JSON
 * Description: Mengubah situs web publik menjadi sebuah prompt dan sistem desain.
 * Note: Masukkan url target yang akan di clone, nanti otomatis langsung jadi prompt ygy. Btw Error fix sendiri.
 **/

import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const BASE_URL = 'https://www.gitreverse.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT_MS = 180000;
const DESIGN_TIMEOUT_MS = 30000;

const HTTP_STATUS = {
  200: 'OK',
  301: 'Moved Permanently',
  302: 'Found',
  400: 'Bad Request',
  403: 'Forbidden',
  404: 'Not Found',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

const BROWSER_HEADERS = {
  'User-Agent': USER_AGENT,
  'Accept-Language': 'en-US,en;q=0.9',
};

const validationError = (message) => {
  const error = new Error(message);
  error.status = 400;
  throw error;
};

const normalizeUrl = (input) => {
  if (typeof input !== 'string' || !input.trim()) {
    validationError('A target URL is required');
  }

  const raw = input.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url;

  try {
    url = new URL(withProtocol);
  } catch {
    validationError(`Invalid URL: ${raw}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    validationError('Only http and https URLs are supported');
  }

  url.hash = '';
  return url.href;
};

const toSlug = (targetUrl) => {
  const slug = new URL(targetUrl).hostname
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    validationError('Could not derive a site slug from the target URL');
  }

  return slug;
};

const parseEvent = (block) => {
  let name = 'message';
  const dataLines = [];

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      name = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const raw = dataLines.join('\n');
  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }

  if (name === 'message' && data && typeof data === 'object' && data.type) {
    name = data.type;
  }

  return { name, data };
};

const fetchDesign = async (siteSlug, designPath) => {
  const apiUrl = `${BASE_URL}/api/website-design/${encodeURIComponent(siteSlug)}`;
  const fallbackUrl = designPath ? new URL(designPath, BASE_URL).href : apiUrl;
  const urls = [...new Set([apiUrl, fallbackUrl])];
  let lastError = 'Design system unavailable';

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          ...BROWSER_HEADERS,
          Accept: 'text/markdown,text/plain;q=0.9,*/*;q=0.8',
          Referer: `${BASE_URL}/designs/${siteSlug}`,
        },
        signal: AbortSignal.timeout(DESIGN_TIMEOUT_MS),
      });
      const text = await res.text();

      if (!res.ok) {
        lastError = `HTTP ${res.status} from ${url}`;
        continue;
      }

      if (text.trim().startsWith('#')) {
        return {
          url,
          format: 'markdown',
          content: text.trim(),
        };
      }

      lastError = `Unexpected content from ${url}`;
    } catch (err) {
      lastError = err?.message ?? lastError;
    }
  }

  return {
    url: apiUrl,
    format: 'markdown',
    content: null,
    error: lastError,
  };
};

export async function scrapeWebToPrompt(inputUrl) {
  const startedAt = Date.now();

  try {
    const targetUrl = normalizeUrl(inputUrl);
    const siteSlug = toSlug(targetUrl);
    const pipeline = [];
    let doneEvent = null;

    const res = await fetch(`${BASE_URL}/api/reverse-website`, {
      method: 'POST',
      headers: {
        ...BROWSER_HEADERS,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Origin: BASE_URL,
        Referer: `${BASE_URL}/website/${siteSlug}`,
      },
      body: JSON.stringify({
        siteSlug,
        targetUrl,
        stream: true,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const body = await res.text();
      const error = new Error(`GitReverse API returned ${res.status}: ${body.slice(0, 300)}`);
      error.status = res.status;
      throw error;
    }

    const contentType = res.headers.get('content-type') ?? '';

    if (!contentType.includes('text/event-stream')) {
      const body = await res.text();
      throw new Error(`Unexpected GitReverse response: ${body.slice(0, 300)}`);
    }

    const handleEvent = (event) => {
      if (!event) {
        return;
      }

      if (event.name === 'status') {
        const message = typeof event.data === 'string'
          ? event.data
          : event.data?.message ?? event.data?.status;

        if (message) {
          pipeline.push(String(message));
        }
      } else if (event.name === 'done') {
        doneEvent = event.data;
      } else if (event.name === 'error') {
        const message = typeof event.data === 'string'
          ? event.data
          : event.data?.message ?? event.data?.error;
        throw new Error(message || 'GitReverse stream error');
      }
    };

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      buffer = buffer.replace(/\r\n/g, '\n');

      let boundary;
      while ((boundary = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        handleEvent(parseEvent(block));
      }
    }

    handleEvent(parseEvent(buffer));

    if (!doneEvent) {
      throw new Error('GitReverse stream ended without a done event');
    }

    const prompt = String(doneEvent.prompt ?? '').trim();

    if (!prompt) {
      throw new Error('GitReverse returned an empty prompt');
    }

    const designPath = doneEvent.designPath ?? '';
    const fromCache = Boolean(doneEvent.fromCache);
    const design = await fetchDesign(siteSlug, designPath);

    return [
      {
        status: 200,
        response: 'OK',
      },
      {
        data: [
          {
            success: true,
            target: targetUrl,
            siteSlug,
            engine: {
              platform: 'GitReverse',
              endpoint: `${BASE_URL}/api/reverse-website`,
              brandIdentityProvider: 'Firecrawl',
              model: null,
              modelNote: 'GitReverse does not expose the prompt model in its API response.',
              fromCache,
              pipeline,
            },
            prompt,
            design,
            durationMs: Date.now() - startedAt,
            generatedAt: new Date().toISOString(),
          },
        ],
      },
    ];
  } catch (err) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const response = HTTP_STATUS[status] ?? 'Unknown';

    return [
      {
        status,
        response,
        error: `ERROR ${status} ${response}: ${err?.message ?? 'An unexpected error occurred'}`,
      },
      {
        data: [],
      },
    ];
  }
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const target = process.argv[2];

  if (!target) {
    console.error('Usage: node scrape-webtoPrompt.js "https://example.com"');
    process.exit(1);
  }

  const [status, payload] = await scrapeWebToPrompt(target);
  const result = payload.data?.[0] ?? {
    success: false,
    ...status,
  };

  await writeFile('result.json', `${JSON.stringify(result, null, 2)}\n`, 'utf8');

  if (status.status >= 200 && status.status < 300) {
    console.log(`result.json saved: ${result.target}`);
    console.log(`prompt: ${result.prompt.length} chars | design: ${result.design?.content?.length ?? 0} chars | cache: ${result.engine.fromCache}`);
  } else {
    console.error(status.error);
    process.exitCode = 1;
  }
}
