import * as fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {teams} from '../public/filters.js';
const data=JSON.parse(await fs.readFile(new URL('../data/fixtures.json',import.meta.url)));
assert(data.fixtures.length>0,'No fixtures');const ids=new Set();
for (const f of data.fixtures) {
 assert(!ids.has(f.id),`Duplicate fixture: ${f.id}`);ids.add(f.id);
 assert(['afl','aflw'].includes(f.competition));assert(['regular','finals'].includes(f.stage));assert(['confirmed','cancelled'].includes(f.status));
 assert(Number.isFinite(Date.parse(f.start)));assert(Number.isFinite(Date.parse(f.modified)));assert(Number.isInteger(f.sequence)&&f.sequence>=0);
 assert(teams.some(t=>t[0]===f.home));assert(teams.some(t=>t[0]===f.away));assert(f.home!==f.away);assert(f.venue&&f.round&&f.source);
}
await fs.copyFile(new URL('../data/fixtures.json',import.meta.url),new URL('../public/fixtures.json',import.meta.url));
console.log(`Validated and published ${ids.size} fixtures.`);
