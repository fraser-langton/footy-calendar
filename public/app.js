import {teams,parseFilters,selectFixtures} from './filters.js';
const $=selector=>document.querySelector(selector);
const form=$('#filters');
const dateFormat=new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short'});
const timeFormat=new Intl.DateTimeFormat('en-AU',{hour:'numeric',minute:'2-digit'});
const labels=Object.fromEntries(teams);
let fixtures=[];
function paramsFromForm(){
 const values=new FormData(form),params=new URLSearchParams();
 for(const [key,all] of [['competition',['afl','aflw']],['teams',teams.map(t=>t[0])]]) {
  const selected=values.getAll(key);if(selected.length!==all.length)params.set(key,selected.join(','));
 }
 for(const key of ['venue','stage','side'])if(values.get(key))params.set(key,values.get(key));
 return params;
}
function render(){
 const params=paramsFromForm();
 const selected=selectFixtures(fixtures,parseFilters(params,fixtures));
 const count=new FormData(form).getAll('teams').length;
 $('#team-count').textContent=count===teams.length?`All ${count}`:`${count} selected`;
 $('#extra-count').textContent=['venue','stage','side'].filter(k=>params.has(k)).length?'· active':'';
 const url=new URL('/calendar.ics',location.origin);url.search=params.toString();
 $('#calendar-url').value=url.href;
 const empty=count===0||new FormData(form).getAll('competition').length===0;
 const noResults=selected.length===0;
 $('#empty-selection').hidden=!empty;
 $('#copy').disabled=noResults;
 for(const id of ['apple','google']) {$( '#'+id).setAttribute('aria-disabled',String(noResults));if(noResults)$('#'+id).setAttribute('tabindex','-1');else $('#'+id).removeAttribute('tabindex');}
 $('#apple').href=url.href.replace(/^https?:/,'webcal:');
 $('#google').href=`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(url.href)}`;
 $('#selection-summary').textContent=`${selected.length} scheduled ${selected.length===1?'match':'matches'} · ${count===teams.length?'All teams':count+' '+(count===1?'team':'teams')}`;
 $('#copy-status').textContent='';
 const now=Date.now();
 const upcoming=selected.filter(f=>Date.parse(f.start)+ (f.competition==='afl'?180:120)*60000>now&&f.status!=='cancelled');
 $('#matches').replaceChildren(...upcoming.slice(0,4).map(f=>{
  const date=new Date(f.start),li=document.createElement('li');li.className='match';
  const dateBlock=document.createElement('div');dateBlock.className='match-date';
  dateBlock.append(date.toLocaleDateString('en-AU',{month:'short'}));const day=document.createElement('strong');day.textContent=date.getDate();dateBlock.append(day);
  const info=document.createElement('div'),title=document.createElement('div'),meta=document.createElement('div');title.className='match-title';meta.className='match-meta';
  title.textContent=`${labels[f.home]} v ${labels[f.away]}`;
  meta.textContent=`${f.competition.toUpperCase()} · ${dateFormat.format(date)} · ${timeFormat.format(date)} · ${f.venue}`;
  info.append(title,meta);li.append(dateBlock,info);return li;
 }));
 $('#no-matches').hidden=upcoming.length>0;
 const query=params.toString();history.replaceState(null,'',location.pathname+(query?'?'+query:''));
}
async function init(){
 try{
 const response=await fetch('/fixtures.json');if(!response.ok)throw Error('Fixture request failed');
 const data=await response.json();fixtures=data.fixtures;
 $('#teams').replaceChildren(...teams.map(([id,name])=>{
  const label=document.createElement('label');label.className='team';const input=document.createElement('input');input.type='checkbox';input.name='teams';input.value=id;input.checked=true;const text=document.createElement('span');text.textContent=name;label.append(input,text);return label;
 }));
 for(const venue of [...new Set(fixtures.map(f=>f.venue))].sort()) {const option=document.createElement('option');option.value=venue;option.textContent=venue;$('#venue').append(option);}
 const params=new URLSearchParams(location.search);
 try{parseFilters(params,fixtures);
  for(const key of ['teams','competition'])if(params.has(key)) {const allowed=params.getAll(key).flatMap(s=>s.split(','));form.querySelectorAll(`input[name="${key}"]`).forEach(input=>input.checked=allowed.includes(input.value));}
  for(const key of ['venue','stage','side'])if(params.has(key))form.elements[key].value=params.get(key);
 }catch{ $('#copy-status').textContent='The saved filters were invalid. Showing all matches.'; }
 $('#timezone').textContent=`Times in ${Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll('_',' ')}`;
 $('#data-note').textContent=`2026 fixtures · Updated ${new Date(data.updated).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}. Unconfirmed games are added once teams, venue and time are known. Match end times are estimates.`;
 $('#app').hidden=false;$('#load-state').hidden=true;render();
 }catch(error){console.error(error);$('#load-state').replaceChildren('Couldn’t load the fixture. ',Object.assign(document.createElement('a'),{href:location.href,textContent:'Try again'}));}
}
form.addEventListener('change',render);
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('reset',event=>{event.preventDefault();form.querySelectorAll('input[type=checkbox]').forEach(input=>input.checked=true);for(const key of ['venue','stage','side'])form.elements[key].value='';render();});
for(const [id,checked] of [['select-all',true],['clear-teams',false]])$('#'+id).addEventListener('click',()=>{form.querySelectorAll('input[name=teams]').forEach(input=>input.checked=checked);render();});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#calendar-url').value);$('#copy-status').textContent='Link copied. Paste it into your calendar app.';}catch{$('#calendar-url').focus();$('#calendar-url').select();$('#copy-status').textContent='Select and copy the link above.';}});
$('#calendar-url').addEventListener('click',event=>event.target.select());
init();
