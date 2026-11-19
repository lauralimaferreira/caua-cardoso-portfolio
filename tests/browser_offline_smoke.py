"""Browser rendering tests that run without external networking.

Loads the actual CSS, JS and images into a Chromium page using data: URLs. The
history/path values are simulated because this environment blocks localhost
navigation, so the HTTP route smoke tests remain in site.test.mjs.

Dependencies: pip install playwright && playwright install chromium
Run: python tests/browser_offline_smoke.py
"""
from pathlib import Path
import base64
import mimetypes
import re
import shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
OUT=ROOT/'previews'
OUT.mkdir(exist_ok=True)


def inline_assets(src):
    for f in (DIST/'assets').iterdir():
        if not f.is_file():
            continue
        mime=mimetypes.guess_type(f.name)[0]
        if not mime: continue
        uri='data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode('ascii')
        src=src.replace('/assets/'+f.name,uri)
    return src


def javascript():
    def standalone(name):
        source=(DIST/'src'/name).read_text()
        return re.sub(r'^import [^\n]+\n','',source,flags=re.M).replace('export const ','const ').replace('export function ','function ')
    data='\n'.join(standalone(name) for name in ['profile-default.js','profile-schema.js','site-settings.js','data.js'])
    data=data.replace('const profile = {...defaultProfile, subtitle:\'Pre-Med Portfolio\'};','')
    main=standalone('site-client.js')
    main=main.replace('location.pathname','window.__testPath')
    main=main.replace("history.pushState({},'',url.pathname)","window.__testPath=url.pathname")
    main=main.replace('if(url.origin!==location.origin)return;',"if(url.origin!=='https://offline.local')return;")
    return inline_assets(data+'\n'+main)


def check():
    css=inline_assets((DIST/'src/styles.css').read_text())
    js=javascript()
    results=[]
    errors=[]
    with sync_playwright() as p:
        params={'headless':True,'args':['--no-sandbox']}
        installed=shutil.which('chromium') or shutil.which('google-chrome')
        if installed:params['executable_path']=installed
        browser=p.chromium.launch(**params)
        try:
            for width,height,kind in [(1600,900,'desktop'),(390,844,'mobile'),(320,700,'small-mobile')]:
                page=browser.new_page(viewport={'width':width,'height':height})
                page.set_default_timeout(3500)
                page.on('pageerror',lambda e: errors.append(str(e)))
                page.set_content('<!doctype html><html><head><meta charset="UTF-8"/><base href="https://offline.local/" /></head><body><div id="app"></div></body></html>')
                page.add_style_tag(content=css)
                page.evaluate("window.__testPath='/'")
                page.add_script_tag(content=js)
                routes=['/','/about','/research','/academics','/leadership','/service','/blog','/resume','/contact','/extracurriculars']
                for route in routes:
                    page.evaluate("path=>{window.__testPath=path;window.dispatchEvent(new Event('popstate'));}",route)
                    title=page.locator('h1').first.inner_text()
                    assert title.strip(),f'No heading at {kind} {route}'
                    delta=page.evaluate('document.documentElement.scrollWidth - innerWidth')
                    if delta>2: errors.append(f'{kind} {route} overflows by {delta}px')
                    for image in page.locator('main img').all():
                        image.scroll_into_view_if_needed()
                        if not image.evaluate('i=>i.complete && i.naturalWidth>0'):
                            errors.append(f'Image broken on {kind} {route}: {image.get_attribute("src")[:50]}')
                    results.append(f'{kind}:{route}')
                    print(f'PASS {kind}:{route}',flush=True)
                page.evaluate("window.__testPath='/';window.dispatchEvent(new Event('popstate'))")
                if kind=='desktop':
                    page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
                    assert '2026–2027' in page.locator('.hero-info-card').inner_text()
                    page.get_by_role('link',name='View My Research').click()
                    assert page.evaluate('window.__testPath')=='/research'
                elif kind=='mobile':
                    page.screenshot(path=str(OUT/'home-mobile.png'),full_page=True)
                    toggle=page.locator('#menuToggle')
                    toggle.click()
                    assert toggle.get_attribute('aria-expanded')=='true'
                    page.locator('#mobileMenu').get_by_role('link',name='Research').click()
                    assert page.evaluate('window.__testPath')=='/research'
                page.evaluate("window.__testPath='/contact';window.dispatchEvent(new Event('popstate'))")
                assert page.locator('form').count()==0
                assert 'Contact is not available yet' in page.locator('main').inner_text()
                page.evaluate("window.__testPath='/blog/from-the-lab-coat-to-medicine';window.dispatchEvent(new Event('popstate'))")
                assert 'Page not found.' in page.locator('h1').inner_text()
                page.close()
        finally:browser.close()
    if errors:raise AssertionError('\n'.join(errors))
    print(f'PASS: {len(results)} page-size checks, CTA/menu interaction, disabled contact, unpublished draft protection. Preview images saved.')


if __name__=='__main__':check()
