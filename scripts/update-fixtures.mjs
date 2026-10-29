import * as fs from 'node:fs/promises';
import {teamId} from '../public/filters.js';
const year=Number(process.argv[2]||2026);
if (!Number.isInteger(year)||year<2026||year>2100) throw Error('Supply a year, e.g. npm run fixtures:update -- 2026');
const path=new URL('../data/fixtures.json',import.meta.url);
const old=await fs.readFile(path,'utf8').then(JSON.parse).catch(()=>({fixtures:[]}));
const existing=new Map(old.fixtures.map(f=>[f.id,f]));
const now=new Date().toISOString();const loaded=[];let omitted=0;
for(const competition of ['afl','aflw']) {
 const source=`https://fixturedownload.com/results/${competition}-${year}`;
 const response=await fetch(`https://fixturedownload.com/feed/json/${competition}-${year}`);
 if(!response.ok)throw Error(`${competition}: HTTP ${response.status}; no files written.`);
 const rows=await response.json();if(!Array.isArray(rows)||rows.length<50)throw Error('Unexpected fixture data; no files written.');
 for (const row of rows) {
  const home=teamId(row.HomeTeam),away=teamId(row.AwayTeam);
  if(!home||!away||!row.DateUtc||/to be confirmed|tbc|tbd/i.test(row.Location||'')){omitted++;continue;}
  const start=new Date(row.DateUtc.replace(' ','T')).toISOString();
  const finals=competition==='afl'?row.RoundNumber>=26:row.RoundNumber>=13;
  const n=competition==='afl'?row.RoundNumber-1:row.RoundNumber;
  const f={id:`${competition}-${year}-${row.MatchNumber}`,competition,season:year,home,away,venue:row.Location,start,stage:finals?'finals':'regular',round:finals?`Finals week ${row.RoundNumber-(competition==='afl'?25:12)}`:n===0?'Opening Round':`Round ${n}`,status:'confirmed',source};
  const previous=existing.get(f.id);
  const changed=!previous||Object.keys(f).some(k=>f[k]!==previous[k]);
  loaded.push({...f,modified:changed?now:previous.modified,sequence:previous?previous.sequence+Number(changed):0});
 }
}
// Retain missing records: deletion is not reliable evidence of cancellation.
const importedIds=new Set(loaded.map(f=>f.id));
const fixtures=[...old.fixtures.filter(f=>!importedIds.has(f.id)),...loaded].sort((a,b)=>a.start.localeCompare(b.start));
await fs.writeFile(path,JSON.stringify({updated:now,omittedUnconfirmed:omitted,fixtures},null,2)+'\n');
console.log(`Saved ${fixtures.length} fixtures; omitted ${omitted} unconfirmed placeholders. Review the diff against AFL.com.au before merging.`);
