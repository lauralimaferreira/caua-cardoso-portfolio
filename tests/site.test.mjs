import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';
import {profile, research, completedActivities, opportunities, blogIdeas} from '../src/data.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const main=read('src/main.js');
const css=read('src/styles.css');
const html=read('index.html');
const publicDir=path.join(root,'public');

test('navigation includes every planned public page',()=>{
 for(const route of ['/','/about','/research','/academics','/leadership','/service','/blog','/resume','/contact','/extracurriculars'])
   assert.ok(main.includes(`'${route}'`),`missing page route ${route}`);
 assert.match(main,/addEventListener\('popstate',render\)/);
});

test('school year and research reflect the actual planning document',()=>{
 assert.equal(profile.school,'East Ridge High School');
 assert.equal(profile.schoolYear,'2026–2027');
 assert.match(main,/School Year<\/strong><span>\$\{esc\(profile.schoolYear\)\} · Junior/);
 assert.ok(research.title.includes('Teenagers’ Public Health Knowledge After COVID-19'));
 assert.equal(main.includes('2026 (Junior)'),false);
 assert.equal(main.includes('Brazos Valley'),false);
 assert.equal(main.includes('Curcumin'),false);
});

test('completed work and exploration programs remain clearly separated',()=>{
 assert.ok(completedActivities.some(x=>x.title==='Varsity Tennis'));
 assert.ok(completedActivities.some(x=>x.title==='Give Kids the World'));
 assert.equal(opportunities.length,11);
 assert.ok(opportunities.every(x=>x.status==='Exploring'));
 assert.ok(main.includes('not registrations, qualifications, or awards already earned'));
});

test('unpublished draft article bodies are not delivered to the browser',()=>{
 assert.ok(blogIdeas.every(x=>x.state==='In preparation'));
 assert.equal(main.includes('blogContent'),false);
 assert.equal(main.includes('blogArticle('),false);
 assert.equal(main.includes('Read reflection'),false);
 assert.ok(main.includes('Article coming soon'));
 assert.ok(main.includes('const content=(pages[path]||notFound)()'));
});

test('contact never pretends to send messages without an approved email',()=>{
 assert.equal(profile.email,'');
 assert.equal(main.includes('contactForm'),false);
 assert.equal(main.includes('navigator.clipboard'),false);
 assert.ok(main.includes('No message form is active'));
 assert.ok(main.includes('mailto:'));
 assert.ok(main.includes('validEmail'));
});

test('all local images referenced in HTML, CSS, content and templates exist',()=>{
 const refs=[...html,...css,...main,...read('src/data.js')].join('');
 const assets=[...refs.matchAll(/\/assets\/([a-z0-9-]+\.(?:webp|png|jpg|svg))/g)].map(m=>m[1]);
 assert.ok(assets.length>=8,`unexpectedly few image references: ${assets.length}`);
 for(const file of new Set(assets)) assert.ok(fs.existsSync(path.join(publicDir,'assets',file)),`missing asset ${file}`);
 const image=fs.statSync(path.join(publicDir,'assets','neuron-original.webp'));
 assert.ok(image.size>40000,'research banner is still a tiny crop');
});

test('publish protection is on until assets and content are approved',()=>{
 assert.match(html,/name="robots" content="noindex, nofollow"/);
 assert.ok(read('scripts/build.mjs').includes('Disallow: /'));
 assert.match(main,/Reference image · pending approval/);
});

test('accessible responsive navigation and print remain configured',()=>{
 assert.match(main,/aria-expanded="false"/);
 assert.match(main,/aria-label="Mobile navigation"/);
 assert.match(main,/window.print\(\)/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css, /@media print/);
});

async function portFree(){return await new Promise((resolve,reject)=>{
 const s=net.createServer();s.once('error',reject);
 s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});
});}

test('local production preview serves pages and assets, 404s on missing static resources',async()=>{
 const port=await portFree();
 const child=spawn(process.execPath,['scripts/serve-local.mjs','--production'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'});
 try{
   let response;
   for(let i=0;i<35;i++){
     try{response=await fetch(`http://127.0.0.1:${port}/`);break;}catch{await delay(100);}
   }
   assert.ok(response,'server did not start');
   assert.equal(response.status,200);
   assert.match(await response.text(),/Cauã Cardoso/);
   for(const route of ['/about','/research','/blog','/resume','/contact','/extracurriculars']){
     const r=await fetch(`http://127.0.0.1:${port}${route}`);
     assert.equal(r.status,200,`page failed: ${route}`);
     assert.match(r.headers.get('content-type'),/text\/html/);
   }
   for(const route of ['/src/main.js','/src/styles.css','/assets/neuron-original.webp','/assets/lab-original.svg','/robots.txt']){
     const r=await fetch(`http://127.0.0.1:${port}${route}`);
     assert.equal(r.status,200,`asset failed: ${route}`);
   }
   assert.equal((await fetch(`http://127.0.0.1:${port}/assets/does-not-exist.webp`)).status,404);
   assert.equal((await fetch(`http://127.0.0.1:${port}/src/missing.js`)).status,404);
   const head=await fetch(`http://127.0.0.1:${port}/research`,{method:'HEAD'});
   assert.equal(head.status,200);
   const post=await fetch(`http://127.0.0.1:${port}/contact`,{method:'POST'});
   assert.equal(post.status,405);
 } finally {child.kill('SIGTERM');}
});


test('Vercel build is static and cannot infer a root Node server entrypoint',()=>{
 const vercel=JSON.parse(read('vercel.json'));
 assert.equal(vercel.buildCommand,'npm run build');
 assert.equal(vercel.outputDirectory,'dist');
 assert.ok(Array.isArray(vercel.rewrites));
 assert.ok(!fs.existsSync(path.join(root,'server.mjs')));
 assert.ok(!fs.existsSync(path.join(root,'src','server.mjs')));
 assert.ok(!JSON.parse(read('package.json')).scripts.start);
 assert.ok(fs.existsSync(path.join(root,'scripts','serve-local.mjs')));
});