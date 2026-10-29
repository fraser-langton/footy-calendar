export const teams = [
 ['adelaide','Adelaide Crows'],['brisbane','Brisbane Lions'],['carlton','Carlton'],['collingwood','Collingwood'],['essendon','Essendon'],['fremantle','Fremantle'],['geelong','Geelong Cats'],['gold-coast','Gold Coast SUNS'],['gws','GWS GIANTS'],['hawthorn','Hawthorn'],['melbourne','Melbourne'],['north-melbourne','North Melbourne'],['port-adelaide','Port Adelaide'],['richmond','Richmond'],['st-kilda','St Kilda'],['sydney','Sydney Swans'],['west-coast','West Coast Eagles'],['western-bulldogs','Western Bulldogs']
];
export const teamId = name => teams.find(([,label]) => label.toLowerCase() === name.toLowerCase())?.[0];
export class FilterError extends Error {}
export function parseFilters(params, fixtures) {
 const allowed = {competition:['afl','aflw'],teams:teams.map(([id])=>id),venue:[...new Set(fixtures.map(f=>f.venue))],stage:['regular','finals'],side:['home','away']};
 const filters={};
 for (const key of params.keys()) if (!(key in allowed)) throw new FilterError(`Unknown filter: ${key}`);
 for (const [key,values] of Object.entries(allowed)) {
  if (!params.has(key)) { filters[key]=null; continue; }
  const selected=[...new Set(params.getAll(key).flatMap(s=>s.split(',')).filter(Boolean))];
  if(selected.some(v=>!values.includes(v))) throw new FilterError(`Invalid ${key} filter.`);
  filters[key]=selected;
 }
 return filters;
}
export function selectFixtures(fixtures, filters) {
 return fixtures.filter(f => {
  if (['competition','venue','stage'].some(key=>filters[key] && !filters[key].includes(f[key]))) return false;
  const selected=filters.teams;
  const home=selected===null || selected.includes(f.home);
  const away=selected===null || selected.includes(f.away);
  return (!filters.side || filters.side.includes('home')) && home || (!filters.side || filters.side.includes('away')) && away;
 });
}
