import data from '../data/fixtures.json' with { type: 'json' };
import {parseFilters,selectFixtures,FilterError} from '../public/filters.js';
import {calendar,etag} from '../lib/calendar.js';
export function GET(request) {
 try {
  const selected=selectFixtures(data.fixtures,parseFilters(new URL(request.url).searchParams,data.fixtures));
  const body=calendar(selected),tag=etag(body);
  const headers={'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'inline; filename="footy-calendar.ics"','Cache-Control':'public, max-age=0, s-maxage=300, stale-while-revalidate=60','ETag':tag,'Access-Control-Allow-Origin':'*'};
  if(request.headers.get('if-none-match')===tag) return new Response(null,{status:304,headers});
  return new Response(body,{headers});
 }catch(error){
  if(error instanceof FilterError)return new Response(error.message,{status:400});
  console.error('Calendar generation failed',error);return new Response('Calendar unavailable. Please try again later.',{status:500});
 }
}
export function HEAD(request) { const response=GET(request);return new Response(null,{status:response.status,headers:response.headers}); }
