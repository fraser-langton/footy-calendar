import {createServer} from 'node:http';
import * as fs from 'node:fs/promises';
import {GET,HEAD} from '../api/calendar.js';
const root=new URL('../public/',import.meta.url);
const types={html:'text/html',js:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml'};
createServer(async(req,res)=>{
 try {
 const url=new URL(req.url,'http://localhost:3000');
 if(['/api/calendar','/calendar.ics'].includes(url.pathname)) {
  const handler=req.method==='HEAD'?HEAD:GET;
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const response=handler(new Request(url,{headers:req.headers}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
 }
 const file=new URL('.'+(url.pathname==='/'?'/index.html':url.pathname),root);
 if(!file.href.startsWith(root.href)){res.writeHead(403);res.end();return;}
 const body=await fs.readFile(file);res.writeHead(200,{'Content-Type':types[file.pathname.split('.').pop()]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(3000,'127.0.0.1',()=>console.log('Footy Calendar: http://localhost:3000'));
