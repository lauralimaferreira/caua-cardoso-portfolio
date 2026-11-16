import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const prod=process.env.NODE_ENV==='production'||process.argv.includes('--production');
const root=path.resolve(dir,prod?'dist':'.');
const port=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.txt':'text/plain'};

const server=http.createServer((req,res)=>{
  if(req.method!=='GET'&&req.method!=='HEAD') {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  let resource;
  try { resource=decodeURIComponent(new URL(req.url,'http://localhost').pathname); }
  catch {res.writeHead(400);res.end('Bad request');return;}
  if(!prod&&resource.startsWith('/assets/'))resource='/public'+resource;
  const resolved=path.resolve(root,'.'+resource);
  if(!resolved.startsWith(root+path.sep)&&resolved!==root){res.writeHead(403);res.end('Forbidden');return;}
  let file=resolved;
  let found=false;
  try {found=fs.statSync(file).isFile();} catch{}
  // Only page routes get the SPA fallback. Missing JS, CSS and images must return 404.
  const staticRequest=path.extname(resource)!=='' || resource.startsWith('/assets/') || resource.startsWith('/src/') || resource.startsWith('/public/');
  if(!found){
    if(staticRequest){res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Not found');return;}
    file=path.join(root,'index.html');
    try {if(!fs.statSync(file).isFile())throw new Error('missing index');}
    catch {res.writeHead(500);res.end('Site has not been built');return;}
  }
  const ext=path.extname(file);
  res.setHeader('Content-Type',mime[ext]||'application/octet-stream');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(ext==='.html')res.setHeader('Cache-Control','no-store');
  else res.setHeader('Cache-Control','public, max-age=3600');
  if(req.method==='HEAD'){res.writeHead(200);res.end();return;}
  fs.createReadStream(file).on('error',()=>{if(!res.headersSent)res.writeHead(500);res.end('Server error');}).pipe(res);
});
server.listen(port,'0.0.0.0',()=>console.log(`Cauã Portfolio at http://localhost:${server.address().port} (${prod?'production':'development'})`));