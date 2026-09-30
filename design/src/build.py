import os, re, base64
SRC=os.path.dirname(os.path.abspath(__file__))+'/'
OUT=os.path.dirname(SRC.rstrip('/'))+'/'
shell   = open(SRC+'flow-shell.html').read()
screens = open(SRC+'audan-screens.html').read()
s3      = open(OUT+'03-home-serie3.html').read()

base = re.search(r'<style>(.*?)</style>', screens, re.S).group(1)
defs3 = re.search(r'(<svg width="0"[^>]*>.*?</svg>)', s3, re.S).group(1)

def symbols_of(html):
    return dict((m.group(1), m.group(0)) for m in re.finditer(r'<symbol id="([^"]+)".*?</symbol>', html, re.S))

# Иконки — заказной пак (src/icons/icons-sprite.svg). Из старых defs оставляем только
# подложки карт streets/streets2: это иллюстрации, а не иконки.
sprite = open(SRC + 'icons/icons-sprite.svg').read()
pack   = symbols_of(sprite)
legacy = symbols_of(defs3 + screens)
maps   = dict((k, v) for k, v in legacy.items() if k in ('streets', 'streets2'))
s3_only = dict(maps)  # дописывается в 04-выдачу, где своих defs нет
merged = '\n'.join(list(pack.values()) + list(maps.values()))
defs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">\n<defs>\n' + merged + '\n</defs>\n</svg>'

sids={0:'home',1:'cats',11:'subcats',2:'list',3:'detail',4:'adnew',5:'food',6:'menu',19:'reviews',13:'order',22:'orders',
      7:'map',12:'maplist',20:'place',8:'jobs',14:'svc',15:'spec',16:'login',23:'otp',24:'pin',25:'notify',17:'owner',
      18:'stories',21:'storiesmap',9:'feed',10:'profile',
      26:'search',27:'post',28:'vacd',29:'story',30:'checkout',31:'myads',32:'favs',33:'compose',34:'employer',35:'signup',36:'addplace',37:'myplaces'}
parts=re.split(r'<!-- S(\d+):', screens)
pool={}
for i in range(1,len(parts),2):
    n=int(parts[i]); chunk=parts[i+1]
    m=re.search(r'<div class="phone"><div class="screen">(.*?)</div></div>\s*<div class="caption">', chunk, re.S)
    assert m, f'S{n}'
    pool[sids[n]]=m.group(1)
assert len(pool)==38, sorted(pool)

order=['login','signup','otp','pin','home','search','notify','cats','subcats','list','detail','adnew','myads','favs',
       'food','menu','reviews','checkout','order','orders','map','maplist','place','addplace','myplaces','jobs','vacd','employer','svc','spec',
       'feed','post','compose','stories','story','storiesmap','profile','owner']
assert sorted(order)==sorted(pool), set(order)^set(pool)
pool_html='\n'.join(f'<div class="pscreen" data-sid="{k}">{pool[k]}</div>' for k in order)
out=shell.replace('@@BASESTYLES@@',base).replace('@@DEFS@@',defs).replace('@@POOL@@',pool_html)

# --- инлайн фото: url(img/x.jpg) → data-URI (только реально используемые файлы) ---
import glob
def datauri(name):
    return 'data:image/jpeg;base64,'+base64.b64encode(open(SRC+'img/'+name,'rb').read()).decode()
def inline_images(html):
    used=set(re.findall(r'img/([a-z0-9-]+\.jpg)', html))
    for name in sorted(used):
        html=html.replace('img/'+name, datauri(name))
    return html

# мапа для всех рендеров в JS: только фото, на которые ссылаются исходники
allimg=sorted(os.path.basename(f)[:-4] for f in glob.glob(SRC+'img/*.jpg'))
srcs=shell+screens
used=[n for n in allimg if ("img/%s.jpg"%n) in srcs or ("'%s'"%n) in srcs]
skipped=sorted(set(allimg)-set(used))
if skipped: print('IMGS: пропущены неиспользуемые фото:', ', '.join(skipped))
imgs_js='var IMGS={'+','.join('"%s":"%s"'%(n,datauri(n+'.jpg')) for n in used)+'};'
out=out.replace('@@IMGS@@',imgs_js)
open(OUT+'flow.html','w').write(out)

body=screens
m=re.search(r'<title>(.*?)</title>',body); title=m.group(1)
body=body.replace(m.group(0),'',1)
# в defs самого audan-screens может не быть подложек карт из серии-3 — дописываем недостающее
have=set(symbols_of(body))
add=[v for k,v in s3_only.items() if k not in have]
if add: body=body.replace('</defs>', '\n'.join(add)+'\n</defs>', 1)
body=inline_images(body)
open(OUT+'04-screens-v12.html','w').write(
 f'<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>{title}</title>\n</head>\n<body>\n{body}\n</body>\n</html>')
print('built', len(out)//1024,'KB')

# ======================= Audan Live → live.html =======================
# Исходники: src/live/ (live.css, live-data.js, live-app.js, live-shell.html, live-map.svg, live-geo.json),
# иконки: заказной пак + src/icons/live/ (линия 1.9 по брифу), фото: src/img/ → CSS-классы .im-NAME (по одному разу).
import json, struct
LV = SRC + 'live/'
def jpeg_size(path):
    with open(path, 'rb') as f:
        d = f.read()
    i = 2
    while i < len(d):
        if d[i] != 0xFF: i += 1; continue
        m = d[i+1]
        if m in (0xC0, 0xC1, 0xC2):
            h, w = struct.unpack('>HH', d[i+5:i+9]); return w, h
        i += 2 + struct.unpack('>H', d[i+2:i+4])[0]
    return 1, 1
lshell = open(LV + 'live-shell.html').read()
lcss   = open(LV + 'live.css').read()
ldata  = open(LV + 'live-data.js').read()
lapp   = open(LV + 'live-app.js').read()
lmap   = open(LV + 'live-map.svg').read()
lgeo   = open(LV + 'live-geo.json').read()
font   = '\n'.join(re.findall(r'@font-face\{[^}]*\}', base))
lsyms  = dict((k, v.replace('stroke-width="2"', 'stroke-width="1.9"')) for k, v in pack.items())
for f in sorted(glob.glob(SRC + 'icons/live/*.svg')):
    n = os.path.basename(f)[:-4]; s = open(f).read()
    inner = re.search(r'<svg[^>]*>(.*)</svg>', s, re.S).group(1)
    attrs = re.search(r'<svg([^>]*)>', s).group(1)
    attrs = re.sub(r'\s(xmlns|width|height)="[^"]*"', '', attrs)
    lsyms[n] = '<symbol id="%s"%s>%s</symbol>' % (n, attrs, inner)
ldefs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>\n' + '\n'.join(lsyms.values()) + '\n' + lmap + '\n</defs></svg>'
lsrc = ldata + lapp + lshell
names = sorted(n for n in set(re.findall(r"['\"]([a-z0-9-]+)['\"]", lsrc)) if os.path.exists(SRC + 'img/' + n + '.jpg'))
imgcss = '\n'.join('.im-%s{background-image:url(%s)}' % (n, datauri(n + '.jpg')) for n in names)
imgar = 'var IMGAR={' + ','.join('"%s":%.4f' % (n, (lambda wh: wh[0] / wh[1])(jpeg_size(SRC + 'img/' + n + '.jpg'))) for n in names) + '};'
lout = (lshell.replace('@@FONT@@', font).replace('@@LIVECSS@@', lcss).replace('@@IMGCSS@@', imgcss).replace('@@DEFS@@', ldefs)
        .replace('@@GEO@@', 'var GEO=' + lgeo + ';' + imgar).replace('@@DATA@@', ldata).replace('@@APP@@', lapp))
open(OUT + 'live.html', 'w').write(lout)
print('built live.html', len(lout) // 1024, 'KB ·', len(names), 'фото ·', len(lsyms), 'иконок')
