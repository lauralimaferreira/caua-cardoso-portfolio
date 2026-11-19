// Run only against an isolated disposable PostgreSQL database. Never use production.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {postgresStore} from '../lib/postgres-store.mjs';
const url=process.env.TEST_DATABASE_URL;
test('real PostgreSQL: migrations, concurrent limiter, persistence, expiry and revocation',{skip:!url?'Set TEST_DATABASE_URL to an isolated disposable database':false},async t=>{
  const {Pool}=await import('pg');
  const schema='auth_test_'+randomBytes(8).toString('hex');
  const admin=new Pool({connectionString:url});
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new Pool({connectionString:url,options:`-c search_path=${schema}`,max:8});
  const store=postgresStore(pool);
  t.after(async()=>{await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();});
  await Promise.all([store.migrate(),store.migrate()]);
  const a='ip:v1:'+'a'.repeat(64), b='ip:v1:'+'b'.repeat(64);
  const attempts=await Promise.all(Array.from({length:20},()=>store.reserveAttempt(a)));
  assert.equal(await store.reserveAttempt(b),true);
  assert.equal(await store.reserveAttempt(a),false);
  await assert.rejects(store.reserveAttempt('login'));
  const other=new Pool({connectionString:url,options:`-c search_path=${schema}`,max:2});
  try{assert.equal(await postgresStore(other).reserveAttempt(a),false);}finally{await other.end();}
  assert.equal(attempts.filter(Boolean).length,12);
  await pool.query("UPDATE portfolio_auth_rate_limit SET window_start=now()-interval '16 minutes'");
  assert.equal(await store.reserveAttempt(a),true);
  await pool.query("UPDATE portfolio_auth_rate_limit SET window_start=now()-interval '2 days' WHERE scope=$1",[b]);
  await store.cleanup();
  assert.equal((await pool.query('SELECT 1 FROM portfolio_auth_rate_limit WHERE scope=$1',[b])).rowCount,0);
  await store.createSession('a'.repeat(64),'b'.repeat(64),60);
  const freshPool=new Pool({connectionString:url,options:`-c search_path=${schema}`,max:2});
  try{assert.equal(await postgresStore(freshPool).hasSession('a'.repeat(64),'b'.repeat(64)),true);}finally{await freshPool.end();}
  assert.equal(await store.hasSession('a'.repeat(64),'c'.repeat(64)),false);
  await store.revokeSession('a'.repeat(64));
  assert.equal(await store.hasSession('a'.repeat(64),'b'.repeat(64)),false);
  await store.createSession('d'.repeat(64),'b'.repeat(64),0);
  assert.equal(await store.hasSession('d'.repeat(64),'b'.repeat(64)),false);
  const baseline=await store.getProfile();assert.equal(baseline.revision,1);
  const changed={...baseline.profile,intro:'Integration test profile'};
  const saves=await Promise.all([store.saveProfile(changed,1),store.saveProfile({...changed,intro:'Concurrent edit'},1)]);
  assert.equal(saves.filter(Boolean).length,1);
  const saved=saves.find(Boolean);await store.migrate();
  const readPool=new Pool({connectionString:url,options:`-c search_path=${schema}`,max:2});
  try{const after=await postgresStore(readPool).getProfile();assert.equal(after.revision,2);assert.deepEqual(after.profile,saved.profile);}finally{await readPool.end();}

});
