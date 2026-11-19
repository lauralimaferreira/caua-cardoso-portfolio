"""Adversarial public-profile rendering in Chromium with a mocked public API.
Checks actual geometry rather than just document scrollWidth (home clips overflow).
"""
import json, shutil, os
from playwright.sync_api import sync_playwright, expect
from browser_offline_smoke import javascript, inline_assets, DIST, ROOT
base=json.loads((ROOT/'backend/profile-default.json').read_text())
long=dict(base,headlines=['Curiosity and compassion.','Commitment to healthcare.','Serving my community.'])
maxima=dict(base, name='W'*60,fullName='W'*120,school='W'*100,location='W'*100,intendedField='W'*100,quote='W'*180,intro='W'*420,aboutLead='W'*420,storyTitle='W'*100,values='W'*220,email='x'*64+'@'+'y'*51+'.com',interests=['W'*48]*6,headlines=['W'*30]*3,goals=['W'*110]*4,story=['W'*850]*6,grade='High School Sophomore')
js=javascript().replace("const backendOrigin = '';", "const backendOrigin = 'https://backend.example.com';").replace('const backendOrigin = "";',"const backendOrigin = 'https://backend.example.com';")
css=inline_assets((DIST/'src/styles.css').read_text())
checks=0
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
    for label,seed in [('original',base),('long-headlines',long),('max-unbroken',maxima)]:
        for w in [320,390,700,701,768,1000,1001,1100,1250,1251,1440,1600]:
            page=browser.new_page(viewport={'width':w,'height':900});page.set_default_timeout(4000)
            page.set_content('<!doctype html><base href="https://offline.local/"><div id="app"></div>');page.add_style_tag(content=css)
            page.evaluate('''seed=>{window.__testPath='/';window.fetch=async()=>({ok:true,json:async()=>({profile:seed,revision:2})});}''',seed);page.add_script_tag(content=js)
            expect(page.locator('.hero-copy h1')).to_contain_text(seed['headlines'][0]);
            for route in ['/','/about','/academics','/resume','/contact']:
                page.evaluate('p=>{window.__testPath=p;window.dispatchEvent(new Event("popstate"));}',route)
                result=page.evaluate('''()=>{const errs=[];const box=e=>e.getBoundingClientRect();const inside=(child,parent)=>{const a=box(child),b=box(parent);return a.left>=b.left-2&&a.right<=b.right+2&&a.top>=b.top-2&&a.bottom<=b.bottom+2};if(document.documentElement.scrollWidth>innerWidth+2)errs.push('document overflow '+(document.documentElement.scrollWidth-innerWidth));for(const sel of ['.hero-copy','.hero-info-card','.goals-card','.content-card','.narrative-band','.resume-sheet','.site-footer','.brand'])for(const e of document.querySelectorAll(sel)){if(e.scrollWidth>e.clientWidth+2)errs.push(sel+' horizontal overflow');}if(document.querySelector('.home-hero')){const hero=document.querySelector('.home-hero'),mid=document.querySelector('.home-middle'),buttons=document.querySelector('.hero-buttons'),card=document.querySelector('.hero-info-card'),quote=document.querySelector('.signature');if(box(buttons).bottom>box(mid).top+1)errs.push('buttons overlap research');if(box(card).bottom>box(mid).top+1)errs.push('card overlaps research');if(!inside(buttons,hero))errs.push('buttons escape hero');if(!inside(quote,card))errs.push('signature escapes card');}return errs;}''')
                assert not result,(label,w,route,result)
                if label=='max-unbroken' and route=='/contact':expect(page.locator('main')).to_contain_text(seed['name'])
                checks+=1
            if label=='long-headlines' and w in [390,1600] and os.environ.get('PREVIEW_DIR'):
                page.evaluate("window.__testPath='/';window.dispatchEvent(new Event('popstate'))");page.screenshot(path=os.environ['PREVIEW_DIR']+f'/long-{w}.png',full_page=True)
            page.close()
        print(f'PASS {label}: 12 widths × 5 pages',flush=True)
    browser.close()
print(f'PASS {checks} layout checks')
