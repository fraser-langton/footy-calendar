import {test} from 'node:test';
import assert from 'node:assert/strict';
import data from '../data/fixtures.json' with {type:'json'};
import {parseFilters,selectFixtures} from '../public/filters.js';
import {calendar,foldLine} from '../lib/calendar.js';
import {GET,HEAD} from '../api/calendar.js';
const selected=query=>selectFixtures(data.fixtures,parseFilters(new URLSearchParams(query),data.fixtures));
const request=query=>new Request(`https://footy.example/calendar.ics${query?'?'+query:''}`);
test('all fixtures are enabled by default; explicitly empty selections match none',()=>{
 assert.equal(selected('').length,data.fixtures.length);assert.equal(selected('teams=').length,0);assert.equal(selected('competition=').length,0);
});
test('teams are ORed, categories are intersected, and home/away uses selected teams',()=>{
 const matches=selected('competition=aflw&teams=carlton,collingwood&side=home&stage=regular');assert(matches.length>0);
 assert(matches.every(f=>f.competition==='aflw'&&['carlton','collingwood'].includes(f.home)&&f.stage==='regular'));
 const away=selected('teams=essendon&side=away');assert(away.length>0);assert(away.every(f=>f.away==='essendon'));
 const venue=data.fixtures[0].venue;assert(selected(`venue=${encodeURIComponent(venue)}`).every(f=>f.venue===venue));
});
test('malformed filters fail clearly rather than silently subscribing to everything',()=>{
 assert.equal(GET(request('teams=bad')).status,400);assert.equal(GET(request('typo=afl')).status,400);
});
test('calendar is a stable, refreshable feed with UTC times and conditional requests',async()=>{
 const response=GET(request('competition=aflw&teams=carlton'));const text=await response.text();
 assert.match(response.headers.get('content-type'),/text\/calendar/);assert(text.startsWith('BEGIN:VCALENDAR\r\n'));assert(text.endsWith('END:VCALENDAR\r\n'));
 assert.equal((text.match(/BEGIN:VEVENT/g)||[]).length,selected('competition=aflw&teams=carlton').length);
 assert.match(text,/DTSTART:\d{8}T\d{6}Z/);assert.match(text,/UID:aflw-2026-\d+@footy-calendar/);
 const again=GET(new Request(request('competition=aflw&teams=carlton'),{headers:{'if-none-match':response.headers.get('etag')}}));assert.equal(again.status,304);
 assert.equal(await HEAD(request('')).text(),'');
});
test('changes retain event identity; cancellation and text escaping survive serialization',()=>{
 const f={...data.fixtures[0],venue:'Venue, east; side\\gate\nNew line',status:'cancelled',sequence:3};
 const text=calendar([f]);assert(text.includes(`UID:${f.id}@footy-calendar`));assert.match(text,/SEQUENCE:3/);assert.match(text,/STATUS:CANCELLED/);assert(text.includes('Venue\\, east\\; side\\\\gate\\nNew line'));
});
test('iCalendar folding keeps every UTF-8 line within 75 bytes without splitting characters',()=>{
 const line='DESCRIPTION:'+('Footy 🏉 à '.repeat(50));const folded=foldLine(line);assert.equal(folded.replace(/\r\n /g,''),line);assert(folded.split('\r\n').every(l=>Buffer.byteLength(l)<=75));
});
