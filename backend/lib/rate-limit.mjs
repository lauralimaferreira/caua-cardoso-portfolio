import {createHmac} from 'node:crypto';
import {isIP} from 'node:net';

// Railway's HTTP edge replaces X-Real-IP. Enable this mode only for a dedicated
// service reachable from the public HTTP edge and trusted private services.
// Do not expose a TCP proxy or trust arbitrary internal callers.
export function clientNetwork(address) {
  if(typeof address!=='string'||address.includes('%')) return null;
  const family=isIP(address);
  if(family===4)return `v4:${address}`;
  if(family!==6)return null;
  const canonical=new URL(`http://[${address}]/`).hostname.slice(1,-1);
  const sides=canonical.split('::');
  const left=sides[0]?sides[0].split(':'):[];
  const right=sides.length===2&&sides[1]?sides[1].split(':'):[];
  const words=sides.length===2?[...left,...Array(8-left.length-right.length).fill('0'),...right]:left;
  const parts=words.map(v=>parseInt(v,16));
  if(parts.slice(0,5).every(v=>v===0)&&parts[5]===0xffff){
    return `v4:${[parts[6]>>8,parts[6]&255,parts[7]>>8,parts[7]&255].join('.')}`;
  }
  // Aggregate IPv6 privacy addresses on the same /64; no raw IPs are persisted.
  return `v6:${parts.slice(0,4).map(v=>v.toString(16)).join(':')}/64`;
}
export function attemptScope(req,config){
  let address=req.socket.remoteAddress;
  if(config.clientIpMode==='railway-edge'){
    // Reject absent, duplicated or list-valued values rather than silently
    // falling back to a shared proxy address. headersDistinct is Node 22 API.
    const values=req.headersDistinct?.['x-real-ip'];
    if(!Array.isArray(values)||values.length!==1)return null;
    address=values[0];
  }
  const network=clientNetwork(address);
  if(!network)return null;
  return 'ip:v1:'+createHmac('sha256',config.passwordHash).update('portfolio-login\0'+network).digest('hex');
}
