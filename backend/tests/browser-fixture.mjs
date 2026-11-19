// Test only; never used by app.mjs or included in the deployed Docker image.
import { createServer } from 'node:http';
import { createHandler } from '../lib/http.mjs';
import { hashPassword, digest } from '../lib/security.mjs';
const server=createServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const passwordHash=await hashPassword('Local-test-only-phrase-23');
const sessions=new Map();let attempts=0;
const store={async healthy(){},async reserveAttempt(scope){if(!scope)throw Error("scope missing");return attempts++<12;},async createSession(token,v,seconds){sessions.set(token,{v,expires:Date.now()+seconds*1000});},async hasSession(token,v){const s=sessions.get(token);return s?.v===v&&s.expires>Date.now();},async revokeSession(token){sessions.delete(token);}};
server.on('request',createHandler({origin,secure:false,username:'caua',passwordHash,credentialVersion:digest('fixture'),sessionSeconds:43200},store));
console.log(origin);
