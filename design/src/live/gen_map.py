# Генератор стилизованной подложки «карта Шуского района» для прототипа Audan Live.
# Это иллюстрация под Яндекс-карту (палитра светлой схемы), не реальные тайлы.
# python3 gen_map.py → live-map.svg (symbol #shumap) + live-geo.json (центры посёлков)
import math, random, json, os
random.seed(7)
W,H=2400,3000
TX,TY=1180,1250          # центр города Шу
ROT=math.radians(-11)
def rot(x,y,cx=TX,cy=TY,a=ROT):
    dx,dy=x-cx,y-cy
    return (cx+dx*math.cos(a)-dy*math.sin(a), cy+dx*math.sin(a)+dy*math.cos(a))
def P(pts): return ' '.join('%s%.0f %.0f'%('M' if i==0 else 'L',x,y) for i,(x,y) in enumerate(pts))
def smooth(pts):
    d='M%.0f %.0f'%pts[0]
    for i in range(1,len(pts)-1):
        mx=(pts[i][0]+pts[i+1][0])/2; my=(pts[i][1]+pts[i+1][1])/2
        d+=' Q%.0f %.0f %.0f %.0f'%(pts[i][0],pts[i][1],mx,my)
    d+=' L%.0f %.0f'%pts[-1]; return d
out=[]
A=out.append
A('<rect width="%d" height="%d" fill="#F2F0EB"/>'%(W,H))
# поля вокруг
for i in range(46):
    x=random.randint(0,W); y=random.randint(0,H)
    if abs(x-TX)<620 and abs(y-TY)<700: continue
    w=random.randint(160,360); h=random.randint(120,300); a=random.uniform(-20,20)
    A('<rect x="%d" y="%d" width="%d" height="%d" rx="18" fill="%s" transform="rotate(%.0f %d %d)"/>'%(x,y,w,h,random.choice(['#E6ECD6','#E9EBDD','#EDEADF']),a,x,y))
# река Шу
river=[(1780,-20),(1720,300),(1800,620),(1690,900),(1620,1180),(1700,1450),(1610,1760),(1660,2050),(1560,2380),(1620,2700),(1540,3020)]
A('<path d="%s" fill="none" stroke="#A9D2EE" stroke-width="30" stroke-linecap="round"/>'%smooth(river))
A('<path d="%s" fill="none" stroke="#C4E1F4" stroke-width="12" stroke-linecap="round" opacity=".7"/>'%smooth(river))
# канал
canal=[(1480,-20),(1470,500),(1500,900),(1440,1250),(1470,1600),(1420,2100),(1450,3020)]
A('<path d="%s" fill="none" stroke="#A9D2EE" stroke-width="10"/>'%smooth(canal))
# зелень вдоль реки
for (x,y) in [(1760,700),(1650,1300),(1700,1600),(1600,2250)]:
    A('<ellipse cx="%d" cy="%d" rx="70" ry="150" fill="#D6EAC6"/>'%(x,y))
# дороги к посёлкам
V={'Төле би':(760,2350),'Бірлік':(420,700),'Алға':(1980,560),'Жаңажол':(2040,2250),'Қорағаты':(300,2050),'Дулат':(1300,2780)}
for n,(x,y) in V.items():
    mx=(TX+x)/2+random.randint(-120,120); my=(TY+y)/2+random.randint(-120,120)
    A('<path d="M%d %d Q%d %d %d %d" fill="none" stroke="#EBCB7A" stroke-width="11"/>'%(TX,TY,mx,my,x,y))
    A('<path d="M%d %d Q%d %d %d %d" fill="none" stroke="#FCE7A2" stroke-width="7"/>'%(TX,TY,mx,my,x,y))
# кварталы города
nx,ny=13,15; bw,bh=88,72; gx0=TX-nx*bw/2; gy0=TY-ny*bh/2
blocks=[]
for i in range(nx):
    for j in range(ny):
        x0=gx0+i*bw; y0=gy0+j*bh
        if (i-nx/2)**2/(nx/2)**2+(j-ny/2)**2/(ny/2)**2>1.08: continue
        if x0>1400: continue
        pts=[rot(x0+7,y0+7),rot(x0+bw-7,y0+7),rot(x0+bw-7,y0+bh-7),rot(x0+7,y0+bh-7)]
        park=(i,j) in [(6,6),(7,6),(4,10),(9,3)]
        A('<path d="%sZ" fill="%s"/>'%(P(pts),'#D2E8C1' if park else '#E7E3D9'))
        blocks.append([round(sum(p[0] for p in pts)/4),round(sum(p[1] for p in pts)/4)])
# улицы города
def street(p0,p1,main=False):
    a=rot(*p0); b=rot(*p1)
    if main:
        A('<path d="%s" stroke="#EBCB7A" stroke-width="15" stroke-linecap="round"/>'%P([a,b]))
        A('<path d="%s" stroke="#FCE7A2" stroke-width="11" stroke-linecap="round"/>'%P([a,b]))
    else:
        A('<path d="%s" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>'%P([a,b]))
    return a,b
labels=[]
MAINV={4:'ул. Сейфуллина',8:'ул. Сатпаева'}; MAINH={4:'ул. Шакирова',9:'ул. Пушкина',12:'ул. Толе би'}
for i in range(nx+1):
    x=gx0+i*bw
    if x>1410: continue
    a,b=street((x,gy0+30),(x,gy0+ny*bh-30),i in MAINV)
    if i in MAINV: labels.append((MAINV[i],a,b,0.38))
for j in range(ny+1):
    y=gy0+j*bh
    a,b=street((gx0+40,y),(1420,y),j in MAINH)
    if j in MAINH: labels.append((MAINH[j],a,b,0.3))
# железная дорога (узел Шу) — северо-запад → юго-восток по западной окраине
rail=[(-20,420),(520,760),(820,960),(980,1100),(1080,1240),(1180,1480),(1280,1900),(1360,2400),(1420,3020)]
for off in (-18,-6,6,18):
    pts=[(x+off*0.8,y-off*0.6) for x,y in rail[:6]]+[(x+off*0.3,y) for x,y in rail[6:]] if abs(off)<7 else [(x+off*0.8,y-off*0.6) for x,y in rail[1:6]]
    A('<path d="%s" fill="none" stroke="#B5AFA4" stroke-width="4"/>'%smooth(pts))
A('<path d="%s" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="10 10"/>'%smooth(rail))
rail2=[(980,1100),(700,1300),(300,1600),(-20,1820)]
A('<path d="%s" fill="none" stroke="#B5AFA4" stroke-width="4"/>'%smooth(rail2))
A('<path d="%s" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="10 10"/>'%smooth(rail2))
A('<rect x="876" y="1000" width="64" height="30" rx="4" fill="#D9D3C7" transform="rotate(34 908 1015)"/>')
# посёлки
vblocks={}
for n,(x,y) in V.items():
    a=math.radians(random.uniform(-25,25)); bl=[]
    for i in range(-2,3):
        for j in range(-2,2):
            if random.random()<.18: continue
            cx=x+i*60; cy=y+j*52
            pts=[rot(cx-24,cy-20,x,y,a),rot(cx+24,cy-20,x,y,a),rot(cx+24,cy+20,x,y,a),rot(cx-24,cy+20,x,y,a)]
            A('<path d="%sZ" fill="#E7E3D9"/>'%P(pts)); bl.append([round(cx),round(cy)])
    vblocks[n]=bl
# подписи
T=[]
def text(t,x,y,size,weight=600,fill='#5C5850',anchor='middle',rotdeg=0):
    tr=' transform="rotate(%.1f %.0f %.0f)"'%(rotdeg,x,y) if rotdeg else ''
    T.append('<text x="%.0f" y="%.0f" font-size="%d" font-weight="%d" fill="%s" text-anchor="%s" stroke="#F2F0EB" stroke-width="4" paint-order="stroke" stroke-linejoin="round"%s>%s</text>'%(x,y,size,weight,fill,anchor,tr,t))
for t,a,b,f in labels:
    x=a[0]+(b[0]-a[0])*f; y=a[1]+(b[1]-a[1])*f
    ang=math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))
    if ang>90: ang-=180
    if ang<-90: ang+=180
    text(t,x,y-9,15,500,'#77736A','middle',ang)
text('Шу',TX-40,TY-40,34,800,'#3F3C36')
for n,(x,y) in V.items(): text(n,x,y-70,24,750,'#3F3C36')
text('р. Шу',1700,980,17,600,'#5E91B8','middle',-80)
text('Шуйский канал',1488,1720,14,500,'#5E91B8','middle',-86)
text('вокзал Шу',860,960,15,600,'#77736A')
svg='<symbol id="shumap" viewBox="0 0 %d %d"><g font-family="Inter,Arial,sans-serif">%s%s</g></symbol>'%(W,H,''.join(out),''.join(T))
here=os.path.dirname(os.path.abspath(__file__))
open(os.path.join(here,'live-map.svg'),'w').write(svg)
json.dump({'W':W,'H':H,'town':[TX,TY],'villages':V,'blocks':blocks,'vblocks':vblocks},open(os.path.join(here,'live-geo.json'),'w'),ensure_ascii=False)
print('map',len(svg)//1024,'KB · blocks',len(blocks))
