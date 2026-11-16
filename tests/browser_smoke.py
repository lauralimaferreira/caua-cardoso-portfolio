"""Optional real-browser acceptance test.

Requires Python 3 and Playwright with Chromium installed:
  pip install playwright
  python -m playwright install chromium
Run after `npm run build`:
  python tests/browser_smoke.py
"""
import os
from pathlib import Path
import shutil
import socket
import subprocess
import time
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'previews'
OUTPUT.mkdir(exist_ok=True)


def unused_port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


def wait_for_url(url):
    for _ in range(50):
        try:
            with urlopen(url, timeout=.35) as resp:
                if resp.status == 200:
                    return
        except Exception:
            time.sleep(.1)
    raise RuntimeError('Could not reach the local production server')


def main():
    port=unused_port()
    base=f'http://127.0.0.1:{port}'
    env=dict(os.environ, PORT=str(port))
    server=subprocess.Popen(['node','scripts/serve-local.mjs','--production'],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    failures=[]
    checked=0
    try:
        wait_for_url(base)
        with sync_playwright() as p:
            # Use a system Chromium when one is installed, or Playwright's bundled browser otherwise.
            browser_kwargs={'headless': True,'args':['--no-sandbox']}
            system_chromium=shutil.which('chromium') or shutil.which('google-chrome')
            if system_chromium:
                browser_kwargs['executable_path']=system_chromium
            browser=p.chromium.launch(**browser_kwargs)
            try:
                routes=['/','/about','/research','/academics','/leadership','/service','/blog','/resume','/contact','/extracurriculars']
                for width,height,label in [(1600,900,'desktop'),(390,844,'mobile'),(320,700,'small-mobile')]:
                    context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1)
                    page=context.new_page()
                    errors=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    for route in routes:
                        page.goto(base+route,wait_until='domcontentloaded')
                        page.locator('main').wait_for()
                        checked+=1
                        over=page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
                        if over>2:
                            failures.append(f'{label} {route} overflows horizontally by {over}px')
                        title=page.locator('h1').first.inner_text().strip()
                        if not title:
                            failures.append(f'{label} {route} has no page title')
                        for img in page.locator('main img').all():
                            img.scroll_into_view_if_needed(timeout=3000)
                            ok=img.evaluate('i=>i.complete && i.naturalWidth>0')
                            if not ok:
                                failures.append(f'{label} {route} broken image: {img.get_attribute("src")}')
                    if errors:
                        failures.extend(f'{label} JS error: {x}' for x in errors)
                    page.goto(base+'/',wait_until='networkidle')
                    if label=='desktop':
                        page.screenshot(path=str(OUTPUT/'home-desktop.png'),full_page=True)
                        card=page.locator('.hero-info-card').inner_text()
                        if '2026–2027' not in card or 'Junior' not in card:
                            failures.append('School-year card has wrong year')
                        page.get_by_role('link',name='View My Research').click()
                        if page.url != base+'/research':
                            failures.append('Research CTA did not navigate')
                        page.go_back(wait_until='domcontentloaded')
                        if page.url != base+'/':
                            failures.append('Back navigation failed')
                    if label=='mobile':
                        page.screenshot(path=str(OUTPUT/'home-mobile.png'),full_page=True)
                        toggle=page.get_by_role('button',name='Open menu')
                        toggle.click()
                        if toggle.get_attribute('aria-expanded')!='true':
                            failures.append('Mobile nav button does not expand menu')
                        page.locator('#mobileMenu').get_by_role('link',name='Research').click()
                        if page.url != base+'/research':
                            failures.append('Mobile research link failed')
                    context.close()

                page=browser.new_page()
                page.goto(base+'/contact')
                assert page.get_by_text('Contact is not available yet').count()==1
                assert page.locator('form').count()==0
                checked+=1
                page.goto(base+'/blog/from-the-lab-coat-to-medicine')
                assert 'Page not found.' in page.locator('h1').inner_text()
                checked+=1
                page.goto(base+'/blog')
                assert page.get_by_text('Article coming soon').count()==3
                checked+=1
                page.goto(base+'/resume')
                assert page.get_by_role('button',name='Print / Save PDF').count()==1
                checked+=1
                page.close()
            finally:
                browser.close()
    finally:
        server.terminate()
        try: server.wait(timeout=4)
        except subprocess.TimeoutExpired: server.kill()
    if failures:
        print('\n'.join(failures))
        raise SystemExit(f'{len(failures)} browser check(s) failed')
    print(f'PASSED {checked} browser checks across three viewport sizes and ten routes.')
    print(f'Screenshots: {OUTPUT}')


if __name__ == '__main__':
    main()