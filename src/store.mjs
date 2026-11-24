// Content store on Cloudflare D1. One row per document: (col, id) → JSON.
// settings and sections live in the "_meta" collection.
import seed from '../lib/seed.js';

export const PUBLIC_COLS = ['services', 'industries', 'portfolio', 'posts'];
export const ALL_COLS = [...PUBLIC_COLS, 'leads', 'subscribers'];

let ready = null; // per-isolate promise: schema created + seeded

export const newId = () => [...crypto.getRandomValues(new Uint8Array(6))].map(b => b.toString(16).padStart(2, '0')).join('');

async function init(env) {
  await env.DB.prepare(
    'CREATE TABLE IF NOT EXISTS docs (col TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (col, id))'
  ).run();
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM docs WHERE col = '_meta'").first();
  if (row && row.n > 0) return;
  // First run: write the default content
  const s = seed(), now = Date.now(), stmts = [];
  const put = (col, doc, t) => stmts.push(env.DB.prepare('INSERT OR IGNORE INTO docs (col, id, data, created_at) VALUES (?, ?, ?, ?)').bind(col, doc.id, JSON.stringify(doc), t));
  put('_meta', { id: 'settings', ...s.settings }, new Date(now).toISOString());
  put('_meta', { id: 'sections', ...s.sections }, new Date(now).toISOString());
  for (const col of PUBLIC_COLS) {
    (s[col] || []).forEach((doc, i) => {
      const t = new Date(now - i * 1000).toISOString(); // keep seed order (newest first)
      put(col, { ...doc, createdAt: t, updatedAt: t }, t);
    });
  }
  await env.DB.batch(stmts);
}

export function ensure(env) {
  if (!ready) ready = init(env).catch(e => { ready = null; throw e; });
  return ready;
}

const strip = ({ id, ...rest }) => rest;

// Load everything the public site needs in one query. Admin also gets leads + subscribers.
export async function load(env, { admin = false } = {}) {
  await ensure(env);
  const q = admin
    ? 'SELECT col, data FROM docs ORDER BY created_at DESC'
    : "SELECT col, data FROM docs WHERE col NOT IN ('leads', 'subscribers') ORDER BY created_at DESC";
  const { results } = await env.DB.prepare(q).all();
  const fresh = seed();
  const db = { settings: {}, sections: {}, leads: [], subscribers: [] };
  for (const c of PUBLIC_COLS) db[c] = [];
  for (const r of results) {
    const d = JSON.parse(r.data);
    if (r.col === '_meta') db[d.id] = strip(d);
    else if (db[r.col]) db[r.col].push(d);
  }
  // Fill in keys added to the seed after the database was created
  for (const k of Object.keys(fresh.settings)) if (db.settings[k] === undefined) db.settings[k] = fresh.settings[k];
  for (const k of Object.keys(fresh.sections)) if (db.sections[k] === undefined) db.sections[k] = fresh.sections[k];
  return db;
}

export async function saveMeta(env, key, value) {
  await ensure(env);
  await env.DB.prepare(
    "INSERT INTO docs (col, id, data, created_at) VALUES ('_meta', ?, ?, ?) ON CONFLICT(col, id) DO UPDATE SET data = excluded.data"
  ).bind(key, JSON.stringify({ id: key, ...value }), new Date().toISOString()).run();
  return value;
}

export async function list(env, col) {
  await ensure(env);
  const { results } = await env.DB.prepare('SELECT data FROM docs WHERE col = ? ORDER BY created_at DESC').bind(col).all();
  return results.map(r => JSON.parse(r.data));
}

export async function get(env, col, id) {
  await ensure(env);
  const r = await env.DB.prepare('SELECT data FROM docs WHERE col = ? AND id = ?').bind(col, id).first();
  return r ? JSON.parse(r.data) : null;
}

export async function insert(env, col, doc) {
  await ensure(env);
  const now = new Date().toISOString();
  const item = { ...doc, id: newId(), createdAt: now, updatedAt: now };
  await env.DB.prepare('INSERT INTO docs (col, id, data, created_at) VALUES (?, ?, ?, ?)').bind(col, item.id, JSON.stringify(item), now).run();
  return item;
}

export async function update(env, col, id, patch) {
  const cur = await get(env, col, id);
  if (!cur) return null;
  const item = { ...cur, ...patch, id: cur.id, createdAt: cur.createdAt, updatedAt: new Date().toISOString() };
  await env.DB.prepare('UPDATE docs SET data = ? WHERE col = ? AND id = ?').bind(JSON.stringify(item), col, id).run();
  return item;
}

export async function remove(env, col, id) {
  await ensure(env);
  const r = await env.DB.prepare('DELETE FROM docs WHERE col = ? AND id = ?').bind(col, id).run();
  return (r.meta && r.meta.changes) > 0;
}
