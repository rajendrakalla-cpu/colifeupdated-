// Quick test - just a few endpoints
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';

function req(method, url, opts = {}) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            port: 443,
            path: u.pathname + u.search,
            method,
            headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
            timeout: 15000,
        };
        const r = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                let json = null;
                try { json = JSON.parse(data); } catch(e) {}
                resolve({ status: res.statusCode, body: json });
            });
        });
        r.on('error', reject);
        r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
        if (opts.data) r.write(JSON.stringify(opts.data));
        r.end();
    });
}

try {
    const res = await req('GET', `${BASE}/api/v1/properties`);
    console.log(`GET /api/v1/properties: ${res.status}`);
    console.log(JSON.stringify(res.body).substring(0, 200));
} catch(e) {
    console.error('ERROR:', e.message);
}
