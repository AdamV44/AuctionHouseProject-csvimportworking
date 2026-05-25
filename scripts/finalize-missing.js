#!/usr/bin/env node
// Small utility to finalize auctions that don't have persisted reports yet.
// Usage examples:
//   ADMIN_TOKEN=<jwt> node scripts/finalize-missing.js --api http://localhost:5000/api --dryRun=true --onlyMissing=true
//   node scripts/finalize-missing.js --api http://localhost:5000/api --token <jwt>

async function main() {
  const argv = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const keyVal = a.slice(2).split('=');
    const key = keyVal[0];
    if (keyVal.length > 1) {
      opts[key] = keyVal.slice(1).join('=');
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { opts[key] = next; i++; } else { opts[key] = 'true'; }
    }
  }

  const apiBase = opts.api || process.env.API_BASE || 'http://localhost:5000/api';
  const token = opts.token || process.env.ADMIN_TOKEN;
  const dryRun = (opts.dryRun ?? process.env.DRY_RUN ?? 'true') !== 'false';
  const onlyMissing = (opts.onlyMissing ?? process.env.ONLY_MISSING ?? 'true') !== 'false';

  if (!token) {
    console.error('ERROR: admin token is required. Pass --token <jwt> or set ADMIN_TOKEN env var.');
    process.exit(2);
  }

  if (typeof fetch === 'undefined') {
    console.error('ERROR: global fetch is not available in this Node runtime. Use Node 18+ or run with a fetch polyfill.');
    process.exit(2);
  }

  console.log(`Using API base: ${apiBase}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Only missing: ${onlyMissing}`);

  const headers = { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' };

  try {
    const listRes = await fetch(`${apiBase}/Auctions/get`, { headers });
    if (!listRes.ok) throw new Error(`Failed to list auctions: ${listRes.status} ${await listRes.text()}`);
    const auctions = await listRes.json();

    console.log(`Found ${auctions.length} auctions`);

    const results = [];

    // limit concurrency
    const concurrency = 5;
    let idx = 0;
    async function worker() {
      while (true) {
        const i = idx++;
        if (i >= auctions.length) return;
        const a = auctions[i];
        const id = a.id ?? a.Id ?? a.Id?.toString();
        if (!id) { results.push({ auction: a, ok: false, error: 'missing id' }); continue; }

        try {
          if (onlyMissing) {
            const existsRes = await fetch(`${apiBase}/Auctions/report-exists/${encodeURIComponent(id)}`, { headers });
            if (!existsRes.ok) throw new Error(`report-exists failed: ${existsRes.status} ${await existsRes.text()}`);
            const existsPayload = await existsRes.json();
            if (existsPayload.exists) {
              console.log(`[skip] auction ${id} already has report.`);
              results.push({ auctionId: id, skipped: true });
              continue;
            }
          }

          const url = `${apiBase}/Auctions/finalize/${encodeURIComponent(id)}${dryRun ? '?dryRun=true' : ''}`;
          console.log(`[post] ${url}`);
          const finRes = await fetch(url, { method: 'POST', headers });
          const body = await finRes.text();
          if (!finRes.ok) {
            console.error(`[error] finalize ${id}: ${finRes.status} ${body}`);
            results.push({ auctionId: id, ok: false, status: finRes.status, body });
          } else {
            console.log(`[ok] finalized ${id} (dryRun=${dryRun})`);
            results.push({ auctionId: id, ok: true, body });
          }
        } catch (err) {
          console.error(`[error] auction ${id}: ${err.message}`);
          results.push({ auctionId: id, ok: false, error: err.message });
        }
      }
    }

    const workers = new Array(Math.min(concurrency, auctions.length)).fill(0).map(_ => worker());
    await Promise.all(workers);

    const okCount = results.filter(r => r.ok).length;
    const skipped = results.filter(r => r.skipped).length;
    const fail = results.filter(r => !r.ok && !r.skipped).length;

    console.log('\nSummary:');
    console.log(`  total auctions processed: ${auctions.length}`);
    console.log(`  finalized (ok): ${okCount}`);
    console.log(`  skipped (already had report): ${skipped}`);
    console.log(`  failed: ${fail}`);

    process.exit(fail === 0 ? 0 : 3);
  } catch (err) {
    console.error('Fatal error:', err.message ?? err);
    process.exit(1);
  }
}

main();
