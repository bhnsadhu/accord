import pg from 'pg';
if (!process.env.BACKUP_DATABASE_URL) throw new Error('BACKUP_DATABASE_URL is required');
const pool = new pg.Pool({ connectionString: process.env.BACKUP_DATABASE_URL.replace(/sslmode=(prefer|require|verify-ca)\b/, 'sslmode=verify-full'), max: 1, connectionTimeoutMillis: 10000, statement_timeout: 15000 });
try {
  // Fixed retention policy. No deletion of accounts, collections or catalog data.
  await pool.query('begin');
  await pool.query('delete from session where expires_at < now()');
  await pool.query('delete from verification where expires_at < now()');
  await pool.query("delete from scan_quota where day < current_date - 35");
  await pool.query("delete from scan_cache where created_at < now() - interval '24 hours'");
  await pool.query("delete from request_budgets where expires_at < now() - interval '1 day'");
  await pool.query("delete from catalog_requests where created_at < now() - interval '90 days'");
  await pool.query("delete from rate_limit where last_request < extract(epoch from now() - interval '1 day') * 1000");
  await pool.query('commit');
  console.log('Expired operational data removed.');
} catch (error) { await pool.query('rollback'); throw error; }
finally { await pool.end(); }
