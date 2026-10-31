const base = process.env.ACCORD_URL ?? 'https://accord.bhanusadhu.com';
if (new URL(base).origin !== 'https://accord.bhanusadhu.com') throw new Error('Unexpected monitoring destination');
const headers = process.env.MONITOR_SECRET ? { Authorization: `Bearer ${process.env.MONITOR_SECRET}` } : {};
for (const path of ['/', '/api/health', '/api/search?q=santal']) {
  let passed = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(base + path, { headers: path === '/api/health' ? headers : {}, signal: AbortSignal.timeout(12000) });
      if (response.status !== 200) throw new Error('Unhealthy response');
      if (path === '/api/health' && (await response.json()).status !== 'ok') throw new Error('Database unhealthy');
      if (path.includes('/api/search') && !(await response.json()).items?.length) throw new Error('Search unavailable');
      passed = true; break;
    } catch { if (attempt === 0) await new Promise(r => setTimeout(r, 3000)); }
  }
  if (!passed) throw new Error(`Accord health check failed: ${path}`);
}
console.log('Accord homepage, database and search checks passed. Scanner compute was not invoked.');
