import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const dest=path.join(root,'dist');
const backendOrigin=process.env.PORTFOLIO_BACKEND_ORIGIN||'';
if(backendOrigin){const u=new URL(backendOrigin);if(u.origin!==backendOrigin||u.protocol!=='https:'||u.username||u.password)throw Error('PORTFOLIO_BACKEND_ORIGIN must be an exact HTTPS origin');}
fs.rmSync(dest,{recursive:true,force:true});
fs.mkdirSync(dest,{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(dest,'index.html'));
fs.cpSync(path.join(root,'src'),path.join(dest,'src'),{recursive:true});
fs.writeFileSync(path.join(dest,'src','site-settings.js'),`export const backendOrigin = ${JSON.stringify(backendOrigin)};\n`);
fs.cpSync(path.join(root,'public'),dest,{recursive:true});
fs.writeFileSync(path.join(dest,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log('Built static portfolio at dist/');
