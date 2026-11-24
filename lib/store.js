// Tiny JSON-file content store. No native deps, atomic writes, in-memory cache.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const seed = require('./seed');

// On Render (or any host) point DATA_DIR at a persistent disk, e.g. /var/data/content
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'content.json');

let cache = null;

function load() {
  if (cache) return cache;
  if (!fs.existsSync(FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    cache = seed();
    save();
  } else {
    cache = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    // Fill in any keys added to the seed after the file was created.
    const fresh = seed();
    for (const k of Object.keys(fresh)) if (cache[k] === undefined) cache[k] = fresh[k];
    for (const k of Object.keys(fresh.sections)) if (cache.sections[k] === undefined) cache.sections[k] = fresh.sections[k];
    for (const k of Object.keys(fresh.settings)) if (cache.settings[k] === undefined) cache.settings[k] = fresh.settings[k];
  }
  return cache;
}

function save() {
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(cache, null, 2));
  fs.renameSync(tmp, FILE);
}

const COLLECTIONS = ['services', 'industries', 'portfolio', 'posts', 'leads', 'subscribers'];

const id = () => crypto.randomBytes(6).toString('hex');

module.exports = {
  COLLECTIONS,
  db: () => load(),
  save,
  id,
  list(col) { return load()[col]; },
  get(col, key) { return load()[col].find(x => x.id === key || x.slug === key); },
  insert(col, doc) {
    const now = new Date().toISOString();
    const item = { id: id(), createdAt: now, updatedAt: now, ...doc };
    load()[col].unshift(item);
    save();
    return item;
  },
  update(col, key, patch) {
    const item = this.get(col, key);
    if (!item) return null;
    Object.assign(item, patch, { id: item.id, updatedAt: new Date().toISOString() });
    save();
    return item;
  },
  remove(col, key) {
    const arr = load()[col];
    const i = arr.findIndex(x => x.id === key);
    if (i < 0) return false;
    arr.splice(i, 1);
    save();
    return true;
  },
};
