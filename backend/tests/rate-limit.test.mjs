import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attemptScope,clientNetwork} from '../lib/rate-limit.mjs';
test('IPv4, IPv6 canonicalization, /64 and IPv4 mapped addresses',()=>{
  assert.equal(clientNetwork('192.0.2.5'),'v4:192.0.2.5');
  assert.equal(clientNetwork('::ffff:192.0.2.5'),'v4:192.0.2.5');
  assert.equal(clientNetwork('2001:db8:0:1::a'),clientNetwork('2001:0DB8:0000:0001:1234:1:2:3'));
  assert.notEqual(clientNetwork('2001:db8:0:1::a'),clientNetwork('2001:db8:0:2::a'));
  for(const v of [null,'','localhost','127.1','192.0.2.5, 1.2.3.4','fe80::1%eth0','192.0.2.5:12'])assert.equal(clientNetwork(v),null);
});
test('scope hashes the network and accepts only one valid edge-provided header',()=>{
  const config={clientIpMode:'railway-edge',passwordHash:'test-only-key'};
  const req={socket:{remoteAddress:'127.0.0.1'},headersDistinct:{'x-real-ip':['192.0.2.5']}};
  const first=attemptScope(req,config);assert.match(first,/^ip:v1:[0-9a-f]{64}$/);assert.equal(attemptScope(req,config),first);
  assert.notEqual(attemptScope(req,{...config,passwordHash:'other-key'}),first);
  assert.equal(attemptScope({...req,headersDistinct:{'x-real-ip':['192.0.2.5','192.0.2.6']}},config),null);
  assert.equal(attemptScope({...req,headersDistinct:{}},config),null);
  assert.equal(attemptScope({...req,headersDistinct:{}},{...config,clientIpMode:'direct'}),attemptScope(req,{...config,clientIpMode:'direct'}));
});
