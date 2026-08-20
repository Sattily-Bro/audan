# Экспорт всех экранов в полноразмерные PNG (вся высота контента, без корпуса телефона).
# 1) генерирует .png-export/scr-<id>.html (по экрану на файл) и measure.html
# 2) высоты меряются в браузере, затем: python3 export_png.py shoot heights.json
import os, re, sys, json, base64, glob, subprocess

SRC = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = os.path.dirname(SRC.rstrip('/')) + '/'
EXP = OUT + '.png-export/'
os.makedirs(EXP, exist_ok=True)

screens = open(SRC + 'audan-screens.html').read()
s3 = open(OUT + '03-home-serie3.html').read()

base = re.search(r'<style>(.*?)</style>', screens, re.S).group(1)
defs3 = re.search(r'(<svg width="0"[^>]*>.*?</svg>)', s3, re.S).group(1)

def symbols_of(html):
    return dict((m.group(1), m.group(0)) for m in re.finditer(r'<symbol id="([^"]+)".*?</symbol>', html, re.S))
sym_scr = symbols_of(screens)
sym_s3 = symbols_of(defs3)
merged = '\n'.join([v for k, v in sym_s3.items() if k not in sym_scr] + list(sym_scr.values()))
DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\n' + merged + '\n</defs></svg>'

sids = {0:'home',1:'cats',11:'subcats',2:'list',3:'detail',4:'adnew',5:'food',6:'menu',19:'reviews',13:'order',22:'orders',
        7:'map',12:'maplist',20:'place',8:'jobs',14:'svc',15:'spec',16:'login',23:'otp',24:'pin',25:'notify',17:'owner',
        18:'stories',21:'storiesmap',9:'feed',10:'profile',
        26:'search',27:'post',28:'vacd',29:'story',30:'checkout',31:'myads',32:'favs',33:'compose',34:'employer'}
NAMES = {}
parts = re.split(r'<!-- S(\d+): ([^>]*?)-->', screens)
pool = {}
i = 1
while i < len(parts):
    n = int(parts[i]); title = parts[i+1].strip(); chunk = parts[i+2]
    m = re.search(r'<div class="phone"><div class="screen">(.*?)</div></div>\s*<div class="caption">', chunk, re.S)
    assert m, f'S{n}'
    pool[sids[n]] = m.group(1)
    NAMES[sids[n]] = title
    i += 3
assert len(pool) == 35, sorted(pool)

def datauri(name):
    return 'data:image/jpeg;base64,' + base64.b64encode(open(SRC + 'img/' + name, 'rb').read()).decode()
IMG = dict((os.path.basename(f), None) for f in glob.glob(SRC + 'img/*.jpg'))
def inline_images(html):
    for name in set(re.findall(r'img/([a-z0-9-]+\.jpg)', html)):
        if IMG.get(name) is None and name in IMG:
            IMG[name] = datauri(name)
        html = html.replace('img/' + name, IMG.get(name) or '')
    return html

FIXED = {'map', 'storiesmap'}  # полноэкранные карты — фиксированная высота вьюпорта

ORDER = ['login','otp','pin','home','search','notify','cats','subcats','list','detail','adnew','myads','favs',
         'food','menu','reviews','checkout','order','orders','map','maplist','place','jobs','vacd','employer','svc','spec',
         'feed','post','compose','stories','story','storiesmap','profile','owner']

EXPORT_CSS = """
html,body{margin:0;padding:0;background:#F7F6F2;}
body{width:392px;}
.screen{width:392px;border-radius:0;overflow:visible;height:auto;min-height:800px;display:flex;flex-direction:column;background:#F7F6F2;position:relative;}
.screen.fixed{height:800px;overflow:hidden;}
.app{overflow:visible;flex:1 0 auto;}
.m-cats,.m-tabs{position:static;}
"""

def page(sid, body):
    fixed = ' fixed' if sid in FIXED else ''
    return ('<!doctype html><html lang="ru"><head><meta charset="utf-8">'
            f'<style>{base}</style><style>{EXPORT_CSS}</style></head><body>'
            f'{DEFS}<div class="screen{fixed}" id="scr">{body}</div></body></html>')

if len(sys.argv) > 1 and sys.argv[1] == 'shoot':
    heights = json.load(open(sys.argv[2]))
    chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    png_dir = OUT + 'screens-png/'
    os.makedirs(png_dir, exist_ok=True)
    for idx, sid in enumerate(ORDER, 1):
        h = max(800, int(heights[sid]))
        name = '%02d-%s.png' % (idx, sid)
        subprocess.run([chrome, '--headless=new', '--disable-gpu', '--force-color-profile=srgb',
                        '--force-device-scale-factor=3', '--window-size=392,%d' % h, '--hide-scrollbars',
                        '--screenshot=' + png_dir + name, 'file://' + EXP + 'scr-' + sid + '.html'],
                       capture_output=True)
        print(name, h)
    print('done ->', png_dir)
else:
    for sid in ORDER:
        open(EXP + 'scr-' + sid + '.html', 'w').write(page(sid, inline_images(pool[sid])))
    blocks = ''.join(f'<div class="wrap" data-sid="{sid}"><div class="screen{" fixed" if sid in FIXED else ""}">{inline_images(pool[sid])}</div></div>' for sid in ORDER)
    open(EXP + 'measure.html', 'w').write(
        '<!doctype html><html><head><meta charset="utf-8">'
        f'<style>{base}</style><style>{EXPORT_CSS}</style>'
        '<style>.wrap{margin:0 0 20px;}</style></head><body>'
        f'{DEFS}{blocks}</body></html>')
    print('generated', len(ORDER), 'pages ->', EXP)
