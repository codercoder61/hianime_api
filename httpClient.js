const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');
const http = require('http');
const https = require('https');

const jar = new tough.CookieJar();

const client = wrapper(axios.create({
  jar,
  withCredentials: true,
  timeout: 15000,
  // Do NOT supply custom http/https agents when using axios-cookiejar-support v5
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
}));

let prewarmed = false;
async function ensurePrewarm() {
  if (prewarmed) return;
  try {
    await client.get('https://hianime.to', { headers: { Referer: 'https://hianime.to/' } });
  } catch (_) {
    // ignore
  }
  prewarmed = true;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getWithRetry(url, config = {}, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await client.get(url, config);
    } catch (e) {
      const s = e && e.response && e.response.status;
      const transient = s && [429, 503, 502, 520, 522, 524].includes(Number(s));
      if (i === retries || !transient) throw e;
      await delay(500 * (i + 1) + Math.floor(Math.random() * 400));
    }
  }
}

module.exports = { client, getWithRetry, ensurePrewarm };

