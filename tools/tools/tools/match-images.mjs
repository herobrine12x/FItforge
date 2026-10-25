import fs from 'node:fs';
import path from 'node:path';

const [mode, dbPath, outDir] = process.argv.slice(2);
const db = JSON.parse(fs.readFileSync(path.join(dbPath, 'dist', 'exercises.json'), 'utf8'));
const tok = s => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

if (mode === 'suggest') {
  const names = fs.readFileSync('tools/exercise-names.txt', 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const rows = names.map(name => {
    const a = new Set(tok(name));
    const top = db.map(e => {
      const b = new Set(tok(e.name));
      const inter = [...a].filter(t => b.has(t)).length;
      return { e, score: inter / (a.size + b.size - inter) };
    }).sort((x, y) => y.score - x.score).slice(0, 3);
    return [name, top[0].e.id, top[0].e.name, ...top.slice(1).map(t => t.e.id)].join('|');
  });
  fs.writeFileSync('tools/mapping.txt', rows.join('\n'));
  console.log('Wrote tools/mapping.txt');
}

if (mode === 'apply') {
  fs.mkdirSync(outDir, { recursive: true });
  for (const line of fs.readFileSync('tools/mapping.txt', 'utf8').split(/\r?\n/).filter(Boolean)) {
    const [name, id] = line.split('|');
    const entry = db.find(e => e.id === id);
    const img = entry && entry.images && entry.images[0];
    const src = img && path.join(dbPath, 'exercises', img);
    if (!src || !fs.existsSync(src)) { console.log('MISSING:', name); continue; }
    fs.copyFileSync(src, path.join(outDir, slug(name) + '.jpg'));
    console.log('OK:', slug(name) + '.jpg');
  }
}