import { createHash } from 'node:crypto';
import { teams } from '../public/filters.js';
const label = id => teams.find(t=>t[0]===id)?.[1] || id;
const stamp = date => new Date(date).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
export const escapeText = value => String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
export function foldLine(line) {
 let result='',current='',size=0;
 for (const char of line) { const n=Buffer.byteLength(char); if(size+n>75){result+=current+'\r\n';current=' ';size=1;} current+=char;size+=n; }
 return result+current;
}
export function calendar(fixtures) {
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Footy Calendar//AFL and AFLW//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Footy Calendar','X-PUBLISHED-TTL:PT6H','REFRESH-INTERVAL;VALUE=DURATION:PT6H'];
 for (const f of fixtures) {
  const duration=f.competition==='afl'?180:120;
  lines.push('BEGIN:VEVENT',`UID:${f.id}@footy-calendar`, `DTSTAMP:${stamp(f.modified)}`,`LAST-MODIFIED:${stamp(f.modified)}`,`SEQUENCE:${f.sequence}`,`DTSTART:${stamp(f.start)}`,`DTEND:${stamp(new Date(Date.parse(f.start)+duration*60000))}`,`SUMMARY:${escapeText(`${f.competition.toUpperCase()}: ${label(f.home)} v ${label(f.away)}`)}`,`LOCATION:${escapeText(f.venue)}`,`DESCRIPTION:${escapeText(`${f.round}. End time is an estimate (${duration} minutes). Fixture times may change. Source: ${f.source}`)}`,`STATUS:${f.status==='cancelled'?'CANCELLED':'CONFIRMED'}`,'TRANSP:TRANSPARENT','END:VEVENT');
 }
 return lines.map(foldLine).join('\r\n')+'\r\nEND:VCALENDAR\r\n';
}
export function etag(body) {return `"${createHash('sha256').update(body).digest('hex')}"`;}
