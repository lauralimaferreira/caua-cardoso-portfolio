import {readFileSync} from 'node:fs';
import { digest, equalText, newToken, readCookie, verifyPassword } from './security.mjs';
import {attemptScope} from './rate-limit.mjs';
const assets=new Map([
  ['/admin', ['text/html; charset=utf-8','index.html']],
  ['/admin/login.js',['text/javascript; charset=utf-8','login.js']],
  ['/admin/styles.css',['text/css; charset=utf-8','styles.css']]
].map(([url,[type,file]])=>[url,[type,readFileSync(new URL('../public/'+file,import.meta.url))]]));
class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
async function jsonBody(req){
  if((req.headers['content-type']||'').split(';')[0].trim().toLowerCase()!=='application/json')throw new HttpError(415,'JSON required');
  const length=Number(req.headers['content-length']||0);
  if(length>4096)throw new HttpError(413,'Request too large');
  const chunks=[];let size=0;
  // Drain oversized requests without storing extra bytes. HTTP timeouts cap slow requests.
  for await(const chunk of req){size+=chunk.length;if(size<=4096)chunks.push(chunk);}
  if(size>4096)throw new HttpError(413,'Request too large');
  let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new HttpError(400,'Invalid JSON');}
  if(!value||Array.isArray(value)||typeof value!=='object')throw new HttpError(400,'Invalid request');
  return value;
}
export function createHandler(config,store){
  let inFlight=0;
  const cookieName=config.secure?'__Host-caua_session':'caua_session_dev';
  const cookie=(token,maxAge)=>`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${config.secure?'; Secure':''}`;
  return async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow');
    res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    if(config.secure)res.setHeader('Strict-Transport-Security','max-age=31536000');
    const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
    try{
      const pathname=new URL(req.url,config.origin).pathname;
      if(pathname==='/healthz'&&req.method==='GET'){await store.healthy();return send(200,{status:'ok'});}
      if(pathname==='/'&&req.method==='GET'){res.writeHead(303,{Location:'/admin'});return res.end();}
      if(assets.has(pathname)&&['GET','HEAD'].includes(req.method)){const [type,bytes]=assets.get(pathname);res.writeHead(200,{'Content-Type':type});return res.end(req.method==='HEAD'?undefined:bytes);}
      const token=readCookie(req.headers.cookie,cookieName);
      if(pathname==='/api/auth/session'&&req.method==='GET'){
        const authenticated=token&&await store.hasSession(digest(token),config.credentialVersion);
        if(!authenticated){if(token)res.setHeader('Set-Cookie',cookie('',0));return send(401,{authenticated:false});}
        return send(200,{authenticated:true,username:config.username});
      }
      if(['/api/auth/login','/api/auth/logout'].includes(pathname)&&req.method==='POST'){
        if(req.headers.origin!==config.origin)throw new HttpError(403,'Invalid origin');
        const data=await jsonBody(req);
        if(pathname.endsWith('/logout')){if(token)await store.revokeSession(digest(token));res.setHeader('Set-Cookie',cookie('',0));return send(200,{authenticated:false});}
        if(typeof data.username!=='string'||data.username.length>128||typeof data.password!=='string'||Buffer.byteLength(data.password)>256)throw new HttpError(400,'Invalid credentials');
        const scope=attemptScope(req,config);
        if(!scope)throw new HttpError(503,'Service unavailable');
        // Short-lived per-process bound on expensive work, not a shared lockout.
        if(inFlight>=2){res.setHeader('Retry-After','2');throw new HttpError(503,'Login is busy. Try again shortly.');}
        let validPassword;
        inFlight++;
        try{
          if(!await store.reserveAttempt(scope)){res.setHeader('Retry-After','900');throw new HttpError(429,'Too many attempts. Try again later.');}
          validPassword=await verifyPassword(data.password,config.passwordHash);
        }finally{inFlight--;}

        if(!equalText(data.username,config.username)||!validPassword)throw new HttpError(401,'Invalid username or password');
        if(token)await store.revokeSession(digest(token));
        const fresh=newToken();await store.createSession(digest(fresh),config.credentialVersion,config.sessionSeconds);
        res.setHeader('Set-Cookie',cookie(fresh,config.sessionSeconds));return send(200,{authenticated:true,username:config.username});
      }
      if(['/api/auth/login','/api/auth/logout','/api/auth/session','/healthz'].includes(pathname)){res.setHeader('Allow',['/api/auth/login','/api/auth/logout'].includes(pathname)?'POST':'GET');return send(405,{error:'Method not allowed'});}
      return send(404,{error:'Not found'});
    }catch(e){if(e instanceof HttpError)return send(e.status,{error:e.message});console.error('Request failed (details withheld)');return send(503,{error:'Service unavailable'});}
  };
}
