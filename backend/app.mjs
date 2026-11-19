import { createServer } from 'node:http';
import { configFromEnv } from './lib/security.mjs';
import { postgresStore } from './lib/postgres-store.mjs';
import { createHandler } from './lib/http.mjs';
let pool;
try {
  const config=configFromEnv();
  const {Pool}=await import('pg');
  pool=new Pool({connectionString:config.dbUrl,max:5,connectionTimeoutMillis:5000,query_timeout:5000,statement_timeout:5000});
  pool.on('error',()=>console.error('Database connection error'));
  const store=postgresStore(pool);
  await store.migrate();
  await store.cleanup();
  const cleanupTimer=setInterval(()=>{store.cleanup().catch(()=>console.error('Auth cleanup failed'));},15*60*1000);
  cleanupTimer.unref();
  const server=createServer(createHandler(config,store));
  server.requestTimeout=15000;server.headersTimeout=10000;
  server.listen(config.port,'0.0.0.0',()=>console.log('Portfolio auth service ready'));
  let closing=false;
  async function shutdown(){if(closing)return;closing=true;clearInterval(cleanupTimer);const timeout=setTimeout(()=>process.exit(1),10000);timeout.unref();server.close(async()=>{try{await store.close();process.exit(0);}catch{process.exit(1);}});server.closeIdleConnections();}
  process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
} catch(e){console.error('Backend startup failed:', e?.message?.startsWith('AUTH_CLIENT_IP_MODE')||e?.message?.startsWith('ADMIN_')||e?.message?.startsWith('APP_ORIGIN')||e?.message?.startsWith('DATABASE_URL')?e.message:'check configuration, dependencies, and database connectivity');try{await pool?.end();}catch{}process.exitCode=1;}
