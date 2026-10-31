// Decrypt an existing backup into a NEW private file, never overwrite a database.
import { createDecipheriv } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/ops/decrypt.mjs encrypted.backup.enc new-private.dump');
const key = Buffer.from(process.env.BACKUP_KEY ?? '', 'base64');
if (key.length !== 32) throw new Error('Set BACKUP_KEY to the original backup encryption key');
const file = await readFile(input);
if (file.length < 37 || file.subarray(0, 8).toString() !== 'ACCORD01') throw new Error('Not an Accord encrypted backup');
const decipher = createDecipheriv('aes-256-gcm', key, file.subarray(8, 20));
decipher.setAuthTag(file.subarray(20, 36));
const plain = Buffer.concat([decipher.update(file.subarray(36)), decipher.final()]);
await writeFile(output, plain, { flag: 'wx', mode: 0o600 });
console.log('Backup decrypted. Keep the dump private and delete it after recovery.');
