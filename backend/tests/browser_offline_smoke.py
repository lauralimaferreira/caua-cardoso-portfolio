"""Offline UI test only: mocked API responses, no real cookie or database assertions."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import os
root = Path(__file__).resolve().parents[1]
html = (root/'public/index.html').read_text().replace('<link rel="stylesheet" href="/admin/styles.css">','').replace('<script src="/admin/login.js" defer></script>','')
css = (root/'public/styles.css').read_text()
js = (root/'public/login.js').read_text()
output=os.environ.get('PHASE1_PREVIEW_DIR')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'), args=['--no-sandbox'])
    for width,height in [(1440,900),(390,844),(320,640)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_content(html)
        page.add_style_tag(content=css)
        page.evaluate('''() => {let authenticated=false; window.fetch=async(path,opts)=>{let status=200,data={};if(path.endsWith('/session')){status=authenticated?200:401;data={authenticated};}else if(path.endsWith('/login')){const body=JSON.parse(opts.body);authenticated=body.username==='caua'&&body.password==='mock-success';status=authenticated?200:401;data=authenticated?{authenticated:true}:{error:'Invalid username or password'};}else if(path.endsWith('/logout')){authenticated=false;data={authenticated:false};}return {status,ok:status===200,json:async()=>data};};}''')
        page.add_script_tag(content=js)
        expect(page.get_by_role('heading',name='Portfolio Login')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        if output and width in (1440,390):
            Path(output).mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(Path(output)/f'login-{width}.png'))
        page.get_by_label('Password').fill('wrong')
        page.get_by_role('button',name='Sign In').click()
        expect(page.locator('#message')).to_contain_text('Invalid username or password')
        page.get_by_label('Password').fill('mock-success')
        page.get_by_role('button',name='Sign In').click()
        expect(page.get_by_role('heading',name='Welcome, Cauã!')).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        if output and width==1440:page.screenshot(path=str(Path(output)/'session-desktop.png'))
        page.get_by_role('button',name='Sign Out').click()
        expect(page.get_by_role('heading',name='Portfolio Login')).to_be_visible()
        page.close()
        print(f'PASS {width}x{height}: UI transitions with mocked API and responsive layout')
    browser.close()
