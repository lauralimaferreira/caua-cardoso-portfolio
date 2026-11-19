'use strict';
const $=id=>document.getElementById(id);
const show=auth=>{$('loading').hidden=true;$('signed-in').hidden=!auth;$('signed-out').hidden=auth;};
const message=text=>{$('message').textContent=text;};
async function request(path,body){const opts={credentials:'same-origin',cache:'no-store'};if(body!==undefined){opts.method='POST';opts.headers={'Content-Type':'application/json'};opts.body=JSON.stringify(body);}const res=await fetch('/api/auth/'+path,opts);const data=await res.json();return {res,data};}
async function session(){try{const {res}=await request('session');if(res.status===200)show(true);else if(res.status===401)show(false);else{show(false);message('Unable to check session. Try again.');}}catch{show(false);message('Connection unavailable. Try again.');}}
$('login').addEventListener('submit',async e=>{e.preventDefault();message('');$('sign-in').disabled=true;try{const {res,data}=await request('login',{username:$('username').value,password:$('password').value});if(res.ok){show(true);}else message(data.error||'Sign in failed.');}catch{message('Connection unavailable. Try again.');}finally{$('password').value='';$('sign-in').disabled=false;}});
$('logout').addEventListener('click',async()=>{message('');$('logout').disabled=true;try{const {res}=await request('logout',{});if(res.ok)show(false);else message('Sign out failed. Please retry.');}catch{message('Connection unavailable. Please retry.');}finally{$('logout').disabled=false;}});
session();
