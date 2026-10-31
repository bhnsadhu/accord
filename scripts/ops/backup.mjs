// Encrypted backup + a real restore into a disposable PostgreSQL 18 container.
// Source credentials are passed only through environment variables, never argv.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile, rm, chmod } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createWriteStream, createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { join, resolve } from 'node:path';
import pg from 'pg';

const key = Buffer.from(process.env.BACKUP_KEY ?? '', 'base64');
if (key.length !== 32) throw new Error('BACKUP_KEY must be 32 random bytes encoded as base64');
const source = process.env.BACKUP_DATABASE_URL;
if (!source || new URL(source).hostname.includes('-pooler')) throw new Error('A direct BACKUP_DATABASE_URL is required');
const connection = new URL(source);
const sourceEnv = { ...process.env, PGHOST: connection.hostname, PGPORT: connection.port || '5432', PGUSER: decodeURIComponent(connection.username), PGPASSWORD: decodeURIComponent(connection.password), PGDATABASE: connection.pathname.slice(1), PGSSLMODE: 'verify-full', PGSSLROOTCERT: '/etc/ssl/certs/ca-certificates.crt', PGCONNECT_TIMEOUT: '10' };
const out = resolve(process.env.BACKUP_OUTPUT ?? 'backup-output');
const work = join(out, '.private');
await mkdir(work, { recursive: true, mode: 0o700 });
await chmod(work, 0o700);
const dump = join(work, 'database.dump');
const decrypted = join(work, 'restored.dump');
const id = `accord-restore-${process.pid}`;
const password = randomBytes(24).toString('hex');
const pool = new pg.Pool({ connectionString: source, max: 1, connectionTimeoutMillis: 10000 });
const restoreEnv = { ...process.env, PGHOST: '127.0.0.1', PGPORT: '5544', PGUSER: 'postgres', PGPASSWORD: password, PGDATABASE: 'postgres', PGSSLMODE: 'disable' };

function run(args, env = process.env, { input, output } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn('docker', args, { env, stdio: [input ? 'pipe' : 'ignore', output ? 'pipe' : 'ignore', 'pipe'] });
    // Never print Docker stderr; a driver error may contain connection details.
    let diagnostic = '';
    child.stderr.on('data', data => { diagnostic = (diagnostic + data.toString()).slice(-8000); });
    const transfers = [];
    if (input) transfers.push(pipeline(createReadStream(input), child.stdin).catch(error => error));
    if (output) transfers.push(pipeline(child.stdout, createWriteStream(output, { mode: 0o600 })).catch(error => error));
    child.on('error', reject);
    child.on('close', async code => { try { const transferErrors = await Promise.all(transfers); if (code !== 0) {
      let safe = diagnostic;
      for (const value of [source, new URL(source).password, decodeURIComponent(new URL(source).password), password, process.env.BACKUP_KEY]) if (value) safe = safe.replaceAll(value, '[secret]');
      safe = safe.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database]').replace(/password[=:]\s*[^\s]+/gi, 'password=[secret]');
      throw new Error(`Backup subprocess failed (${code}): ${safe.slice(-2500)}`);
    } if (transferErrors.some(Boolean)) throw new Error('Backup stream transfer failed'); resolveRun(); } catch (error) { reject(error); } });
  });
}
const quote = name => '"' + name.replaceAll('"', '""') + '"';
let local;
try {
  const client = await pool.connect();
  let tables; let counts;
  try {
    await client.query('begin isolation level repeatable read read only');
    const { rows: [{ snapshot }] } = await client.query('select pg_export_snapshot() as snapshot');
    tables = (await client.query("select schemaname, tablename from pg_tables where schemaname in ('public', 'drizzle') order by schemaname, tablename")).rows;
    counts = [];
    for (const table of tables) counts.push(Number((await client.query(`select count(*) as count from ${quote(table.schemaname)}.${quote(table.tablename)}`)).rows[0].count));
    await run(['run', '--rm', '--network', 'host', '-v', '/etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro', '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGUSER', '-e', 'PGPASSWORD', '-e', 'PGDATABASE', '-e', 'PGSSLMODE', '-e', 'PGSSLROOTCERT', '-e', 'PGCONNECT_TIMEOUT', 'postgres:18', 'pg_dump', '--format=custom', '--schema=public', '--schema=drizzle', '--no-owner', '--no-acl', `--snapshot=${snapshot}`], sourceEnv, { output: dump });
    await client.query('commit');
  } finally { client.release(); }
  const plain = await readFile(dump);
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const sealed = Buffer.concat([Buffer.from('ACCORD01'), iv, cipher.getAuthTag(), encrypted]);
  if (sealed.length > 20 * 1024 * 1024) throw new Error('Backup exceeds the free storage budget; no upload was made');
  const filename = `accord-${new Date().toISOString().replaceAll(':', '-')}.backup.enc`;
  await writeFile(join(out, filename), sealed, { mode: 0o600 });
  const saved = await readFile(join(out, filename));
  const decipher = createDecipheriv('aes-256-gcm', key, saved.subarray(8, 20)); decipher.setAuthTag(saved.subarray(20, 36));
  await writeFile(decrypted, Buffer.concat([decipher.update(saved.subarray(36)), decipher.final()]), { mode: 0o600 });
  await run(['run', '--detach', '--rm', '--name', id, '-e', 'POSTGRES_PASSWORD', '-p', '127.0.0.1:5544:5432', 'postgres:18'], { ...process.env, POSTGRES_PASSWORD: password });
  for (let attempt = 0; attempt < 30; attempt++) {
    try { await run(['exec', id, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres']); break; }
    catch { if (attempt === 29) throw new Error('Restore database did not start'); await new Promise(r => setTimeout(r, 1000)); }
  }
  await run(['exec', id, 'psql', '-U', 'postgres', '-c', 'CREATE EXTENSION IF NOT EXISTS pg_trgm']);
  const toc = join(work, 'restore.list');
  await run(['run', '--rm', '-v', `${work}:/backup:ro`, 'postgres:18', 'pg_restore', '--list', '/backup/restored.dump'], process.env, { output: toc });
  // public exists so pg_trgm can be installed before its index operator classes.
  const list = (await readFile(toc, 'utf8')).split('\n').filter(line => !/^\d+; \d+ \d+ SCHEMA - public /.test(line)).join('\n');
  await writeFile(toc, list, { mode: 0o600 });
  await run(['run', '--rm', '--network', 'host', '-v', `${work}:/backup:ro`, '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGUSER', '-e', 'PGPASSWORD', '-e', 'PGDATABASE', '-e', 'PGSSLMODE', 'postgres:18', 'pg_restore', '--exit-on-error', '--single-transaction', '--no-owner', '--no-acl', '--use-list=/backup/restore.list', '--dbname=postgres', '/backup/restored.dump'], restoreEnv);
  local = new pg.Pool({ host: '127.0.0.1', port: 5544, user: 'postgres', password, database: 'postgres', max: 1 });
  for (let i = 0; i < tables.length; i++) {
    const t = tables[i]; const count = Number((await local.query(`select count(*) as count from ${quote(t.schemaname)}.${quote(t.tablename)}`)).rows[0].count);
    if (count !== counts[i]) throw new Error('Restored row count does not match its source snapshot');
  }
  const invalid = await local.query('select count(*)::int as count from collection_items c left join "user" u on c.user_id=u.id left join fragrances f on c.product_id=f.product_id where u.id is null or f.product_id is null');
  if (invalid.rows[0].count !== 0) throw new Error('Restored collection integrity check failed');
  console.log(JSON.stringify({ status: 'verified', encryptedBytes: sealed.length, tablesVerified: tables.length, restore: 'isolated PostgreSQL 18', filename }));
} finally {
  await local?.end(); await pool.end();
  await run(['rm', '-f', id]).catch(() => {});
  await rm(work, { recursive: true, force: true });
}
