"""Local Chromium browser test with the test-only in-memory fixture."""
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
root = Path(__file__).resolve().parents[1]
server = subprocess.Popen(['node',str(root/'tests/browser-fixture.mjs')], stdout=subprocess.PIPE, text=True)
try:
    origin = server.stdout.readline().strip()
    assert origin.startswith('http://127.0.0.1:')
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for width,height in [(1440,900),(390,844),(320,640)]:
            context = browser.new_context(viewport={'width':width,'height':height})
            page=context.new_page()
            page.goto(origin+'/admin', wait_until='domcontentloaded')
            expect(page.get_by_role('heading',name='Portfolio Login')).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.get_by_label('Password').fill('wrong')
            page.get_by_role('button',name='Sign In').click()
            expect(page.locator('#message')).to_contain_text('Invalid username or password', timeout=5000)
            page.get_by_label('Password').fill('Local-test-only-phrase-23')
            page.get_by_role('button',name='Sign In').click()
            expect(page.get_by_role('heading',name='Welcome, Cauã!')).to_be_visible()
            page.reload()
            expect(page.get_by_role('heading',name='Welcome, Cauã!')).to_be_visible()
            page.get_by_role('button',name='Sign Out').click()
            expect(page.get_by_role('heading',name='Portfolio Login')).to_be_visible()
            context.close()
            print(f'PASS {width}x{height}: login, wrong password, refresh, logout, responsive layout')
        browser.close()
finally:
    server.terminate()
    server.wait(timeout=5)
