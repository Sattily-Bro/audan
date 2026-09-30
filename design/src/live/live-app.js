/* ======================================================================
   Audan Live — рендер экранов и интерактив прототипа.
   LIVE.html(preset)          → HTML экрана (для канваса, статично)
   LIVE.mount(scrEl, preset)  → живой экран (презентация): стейт, жесты, шторки
   Правила брифа, зашитые в код: одна живая карта на экран, ≤60 меток,
   метки без анимации, © Яндекса видно всегда, звук видео только по тапу,
   жалоба/блок у каждого поста и комментария, без эффектов нажатия.
   ====================================================================== */
var LIVE = (function(){
'use strict';

var DEV = { ip:{W:390,H:844,sb:54,hb:34}, and:{W:360,H:800,sb:30,hb:20}, se:{W:375,H:667,sb:20,hb:0} };
var TBH = 52;
var ME_XY = [1150,1275];
var SBI = '<svg viewBox="0 0 70 13" aria-hidden="true"><g fill="currentColor"><rect x="0" y="8" width="3" height="4.5" rx="1"/><rect x="4.5" y="6" width="3" height="6.5" rx="1"/><rect x="9" y="3.5" width="3" height="9" rx="1"/><rect x="13.5" y="1" width="3" height="11.5" rx="1"/></g><path d="M26.6 4.6a8.4 8.4 0 0 1 11.8 0M29 7.1a5 5 0 0 1 7 0" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="32.5" cy="10.2" r="1.5" fill="currentColor"/><rect x="45" y="1.5" width="21" height="10" rx="3" stroke="currentColor" stroke-opacity=".4" fill="none"/><rect x="46.8" y="3.3" width="15.5" height="6.4" rx="1.6" fill="currentColor"/><path d="M67.7 5v3.2" stroke="currentColor" stroke-opacity=".4" stroke-width="1.4" stroke-linecap="round"/></svg>';
var LOGO = '<svg viewBox="0 0 24 24"><path d="M6 19.5 12 6l6 13.5" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="15.6" r="2.1" fill="#fff"/></svg>';
var PIN = '<svg viewBox="0 0 34 42" width="34" height="42"><path d="M17 40.5S30 28.3 30 17.6A13 13 0 0 0 4 17.6C4 28.3 17 40.5 17 40.5z" fill="#0F5FCC" stroke="#fff" stroke-width="2.4"/><circle cx="17" cy="17.2" r="5.2" fill="#fff"/></svg>';

/* ---------------- утилиты ---------------- */
function T(st,k,v){ var d=I18N[st.lang]||I18N.kk; var s=d[k]; if(s==null) s=I18N.kk[k]; if(s==null) s=k;
  if(v) for(var n in v) s=s.split('{'+n+'}').join(v[n]); return s; }
function ic(n,c){ return '<svg class="ic'+(c?' '+c:'')+'"><use href="#'+n+'"/></svg>'; }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function im(n){ return 'im-'+n; }
function fmtText(s){ return esc(s).replace(/\n/g,'<br>').replace(/@([a-z0-9_.]*[a-z0-9_])/gi,function(m,u){ return '<span class="mn" data-a="author" data-u="'+u+'">@'+u+'</span>'; }); }
function hash(s){ var h=0; for(var i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return Math.abs(h); }
function vname(st,v){ return v&&VILLAGES[v] ? VILLAGES[v][st.lang==='ru'?'ru':'kk'] : T(st,'out_of_area'); }
function clampAR(r){ return Math.max(0.8, Math.min(1.91, r||1)); }
function dur(s){ return '0:'+(s<10?'0':'')+s; }
function dims(st){ return DEV[st.dev]||DEV.ip; }
function W(st){ return st.W || dims(st).W; }
function H(st){ return st.H || dims(st).H; }

function ago(st,m){
  if(m<1) return T(st,'ago_now');
  if(m<60) return T(st,'ago_m',{n:m});
  if(m<1440) return T(st,'ago_h',{n:Math.floor(m/60)});
  var back=Math.ceil((m-NOW_MIN)/1440);
  return (28-back)+' '+(st.lang==='ru'?'сен':'қыр');
}
function exact(st,m){
  var t=NOW_MIN-m, d=T(st,'today');
  while(t<0){ t+=1440; d=(d===T(st,'today'))?T(st,'yday'):ago(st,m); }
  var hh=Math.floor(t/60), mm=t%60;
  return T(st,'exact',{d:d,t:hh+':'+(mm<10?'0':'')+mm});
}
function leftTxt(st,rem,sec){
  if(sec!=null && rem<1) return T(st,'left_s',{n:sec});
  if(rem<60) return T(st,'left_m',{n:Math.max(1,Math.round(rem))});
  return T(st,'left_h',{n:Math.floor(rem/60)});
}
function num(n){ return String(n); }

/* ---------------- гео ---------------- */
var POS={};
function pos(p){
  if(POS[p.id]) return POS[p.id];
  var xy;
  if(p.at) xy=p.at;
  else if(p.sp&&SPOTS[p.sp]&&SPOTS[p.sp].at){ var sa=SPOTS[p.sp].at; xy=[sa[0]+(hash(p.id+'x')%50)-25, sa[1]+(hash(p.id+'y')%40)-20]; }
  else if(p.v==='shu'){ var b=GEO.blocks[hash(p.id)%GEO.blocks.length]; xy=[b[0]+(hash(p.id+'x')%30)-15, b[1]+(hash(p.id+'y')%24)-12]; }
  else { var c=GEO.villages[VILLAGES[p.v].kk]; var vb=GEO.vblocks[VILLAGES[p.v].kk]; var b2=vb[hash(p.id)%vb.length]; xy=[b2[0]+(hash(p.id+'x')%20)-10,b2[1]+(hash(p.id+'y')%16)-8]; }
  return (POS[p.id]=xy);
}
function distM(p){
  if(p.v==='shu'||!VIL_KM[p.v]){ var xy=pos(p); return Math.round(Math.hypot(xy[0]-ME_XY[0],xy[1]-ME_XY[1])*4.5); }
  return VIL_KM[p.v]*1000;
}
function distTxt(st,p){ return fmtDist(st,distM(p)); }
function fmtDist(st,m){
  if(m<1000) return T(st,'m',{n:Math.max(10,Math.round(m/10)*10)});
  var k=m/1000; return T(st,'km',{n:(k<10?k.toFixed(1):Math.round(k)).toString().replace('.',',')});
}
function villageAt(x,y){
  if(Math.hypot(x-GEO.town[0],y-GEO.town[1])<680) return 'shu';
  var best=null,bd=1e9;
  for(var k in VILLAGES){ if(k==='shu') continue; var c=GEO.villages[VILLAGES[k].kk]; var d=Math.hypot(x-c[0],y-c[1]); if(d<bd){ bd=d; best=k; } }
  return bd<300?best:null;
}
function coords(x,y){ return (43.598-(y-1250)*0.000045).toFixed(5)+', '+(73.761+(x-1180)*0.00006).toFixed(5); }

/* ---------------- стейт ---------------- */
function newState(o){
  var st={ scr:'feed', lang:'kk', dev:'ip', guest:false, geo:true, saver:false, rm:false,
    cat:'all', vil:'all', sort:'new', time:24, hour:null, q:'', gseg:'today', who:'all', mode:'list', follows:{aizhan_s:1,'madina.t':1,erlan_k:1},
    seen:{}, liked:{p03:1,p13:1}, likeInit:{p03:1,p13:1}, cm:{}, cliked:{}, sends:{}, sentTo:{}, blocked:{}, deleted:{}, expanded:{}, slide:{}, played:{}, expired:{},
    sound:false, fresh:false, order:null, added:[], justPosted:[],
    used:['u','d'], view:null, sel:'p01', msheet:null,
    post:'p01', author:'aizhan_s', story:null, mine:'a',
    draft:[], dsel:0, dcat:null, dcap:'', dplace:null, pview:null,
    sheet:null, sheetArg:null, nav:[] };
  if(o) for(var k in o) st[k]=o[k];
  return st;
}
function allPosts(st){ return st.added.concat(POSTS, st.many?MANY():[]); }
function getPost(st,id){ var a=allPosts(st); for(var i=0;i<a.length;i++) if(a[i].id===id) return a[i]; return null; }
function isSeen(st,p){ return st.seen[p.id]!=null ? st.seen[p.id] : p.seen; }
function isLiked(st,p){ return !!st.liked[p.id]; }
function likeN(st,p){ return p.l + (st.liked[p.id]?1:0) - (st.likeInit[p.id]?1:0); }
function viewN(st,p){ return p.vw + ((!p.seen && st.seen[p.id])?1:0); }
function sendN(st,p){ return p.s + (st.sends[p.id]||0); }
function isExpired(st,p){ return !p.demo && (p.m>=1440 || st.expired[p.id]); }
function active(st){
  return allPosts(st).filter(function(p){ return !st.deleted[p.id] && !st.blocked[p.u] && (!p.fresh||st.fresh) && !isExpired(st,p) && !(st.empty); });
}
function comments(st,p){
  if(st.cm[p.id]) return st.cm[p.id];
  var list;
  if(COMMENTS[p.id]) list=COMMENTS[p.id].map(function(c){ var o={}; for(var k in c) o[k]=c[k]; return o; });
  else { var n=CCOUNT[p.id]!=null?CCOUNT[p.id]:(p.l>12?3:1); list=[];
    for(var i=0;i<n;i++){ var g=GENERIC[(hash(p.id)+i)%GENERIC.length]; var u=GEN_U[(hash(p.id)+i*3)%GEN_U.length]; if(u===p.u) u=GEN_U[(hash(p.id)+i*3+1)%GEN_U.length];
      var c={u:u,m:Math.max(1,p.m-20-i*37),l:(hash(p.id+i)%4)}; if(typeof g==='string') c.x=g; else c.s=g.s; list.push(c); } }
  st.cm[p.id]=list; return list;
}
function cN(st,p){ return comments(st,p).filter(function(c){ return !st.blocked[c.u]; }).length; }

var _many=null;
function MANY(){
  if(_many) return _many;
  var imgs=['lv-kokpar','lv-melons','lv-river','lv-station','lv-platform','lv-junction','lv-stbazaar','lv-elevator','lv-street','lv-mosque','lv-shop','lv-arch','lv-sunset','lv-chu','lv-children','lv-vesta','lv-lada4x4','lv-cat','lv-puddle','lv-paving','plov','samsa','bread','tea','shashlik','lagman'];
  var us=['aizhan_s','bekzat_m','dias.zh','nurlan_a','aru.sarsen','erlan_k','madina.t','temirlan','saule_zh'];
  var vs=['shu','shu','shu','shu','toleby','birlik','alga','zhanazhol','koragaty','dulat'];
  _many=[];
  for(var i=0;i<36;i++){ _many.push({id:'x'+i,u:us[i%us.length],c:CATS[i%8],v:vs[i%vs.length],imgs:[imgs[(i*7)%imgs.length]],cap:'',l:(i*13)%30,vw:(i*29)%90+10,s:0,m:30+i*37,seen:i%3===0,vid:0,at:null,demo:false,fresh:false}); }
  return _many;
}

/* ---------------- фильтры и порядок ---------------- */
function filtered(st,o){
  o=o||{};
  return active(st).filter(function(p){
    if(!o.nocat && st.cat!=='all' && p.c!==st.cat) return false;
    if(!o.novil && st.vil!=='all' && p.v!==st.vil) return false;
    if(o.map && !p.demo && p.m>st.time*60) return false;
    if(!o.nohour && st.hour!=null && hourOf(p)!==st.hour) return false;
    if(!o.nowho && st.who==='friends' && !st.follows[p.u]) return false;
    return true;
  });
}
function sorter(st){
  if(st.sort==='pop') return function(a,b){ return (likeN(st,b)-likeN(st,a))||(b.vw-a.vw)||(a.m-b.m); };
  if(st.sort==='near' && st.geo) return function(a,b){ return distM(a)-distM(b); };
  return function(a,b){ if(a.demo!==b.demo) return a.demo?1:-1; if(a.id===POD) return -1; if(b.id===POD) return 1; return a.m-b.m; };
}
/* Порядок фиксируется на визит: просмотренное во время визита не прыгает вниз */
function feedLists(st){
  var ps=filtered(st); if(st.only) ps=ps.filter(function(p){ return p.id===st.only; });
  var key=[st.cat,st.vil,st.sort,st.fresh,st.only,st.hour,ps.length].join('|');
  if(!st.order||st.order.key!==key){
    var un=ps.filter(function(p){ return !isSeen(st,p) || st.justPosted.indexOf(p.id)>=0; });
    var sn=ps.filter(function(p){ return un.indexOf(p)<0; });
    un.sort(sorter(st));
    un.sort(function(a,b){ var ja=st.justPosted.indexOf(a.id)>=0, jb=st.justPosted.indexOf(b.id)>=0; return ja===jb?0:(ja?-1:1); });
    sn.sort(st.sort==='near'&&st.geo?sorter(st):function(a,b){ return (likeN(st,b)-likeN(st,a))||(a.m-b.m); });
    st.order={key:key,un:un.map(function(p){return p.id;}),sn:sn.map(function(p){return p.id;})};
  }
  var byId={}; ps.forEach(function(p){ byId[p.id]=p; });
  return { un:st.order.un.map(function(i){return byId[i];}).filter(Boolean), sn:st.order.sn.map(function(i){return byId[i];}).filter(Boolean) };
}
function hourOf(p){ return ((Math.floor((NOW_MIN-p.m)/60)%24)+24)%24; }
/* горячие точки: именованные места + посёлки (посты без места вне Шу) */
function spotKey(p){ return p.sp?('s:'+p.sp):(p.v!=='shu'?('v:'+p.v):null); }
function spotName(st,key){ if(!key) return ''; var k=key.slice(2); return key[0]==='s'?(SPOTS[k][st.lang==='ru'?'ru':'kk']):vname(st,k); }
function spots(st){
  var by={};
  filtered(st,{nocat:1,novil:1,nohour:1}).forEach(function(p){ var k=spotKey(p); if(!k) return; (by[k]=by[k]||[]).push(p); });
  var list=Object.keys(by).map(function(k){ var ps=by[k].sort(function(a,b){ return a.m-b.m; }); var us={}; ps.forEach(function(p){ us[p.u]=1; });
    return {k:k, ps:ps, n:ps.length, un:ps.filter(function(p){ return !isSeen(st,p); }).length, last:ps[0].m, na:Object.keys(us).length, pod:ps.some(function(p){ return p.id===POD; })}; });
  list.sort(function(a,b){ if(!!a.un!==!!b.un) return a.un?-1:1; if(a.pod!==b.pod) return a.pod?-1:1; return a.last-b.last; });
  return list;
}
function spotPosts(st,key){ return filtered(st,{nocat:1,novil:1,nohour:1}).filter(function(p){ return spotKey(p)===key; }).sort(function(a,b){ return a.m-b.m; }); }
function viewerPosts(st){ return st.story.sp ? spotPosts(st,st.story.sp) : storyPosts(st,st.story.u); }
function authors(st){
  var by={};
  active(st).forEach(function(p){ if(p.u===ME) return; (by[p.u]=by[p.u]||[]).push(p); });
  var list=Object.keys(by).map(function(u){ var ps=by[u].sort(function(a,b){return b.m-a.m;});
    return {u:u, ps:ps, un:ps.some(function(p){return !isSeen(st,p);}), last:ps[ps.length-1].m, demo:u==='audan.kz'}; });
  list.sort(function(a,b){ if(a.demo!==b.demo) return a.demo?1:-1; if(a.un!==b.un) return a.un?-1:1; return a.last-b.last; });
  return list;
}
function storyPosts(st,u){ return active(st).filter(function(p){ return p.u===u; }).sort(function(a,b){ return b.m-a.m; }); }
function tring(st,p,sz){ sz=sz||18; if(p.demo) return ''; var r=remOf(st,p), f=Math.max(0,Math.min(1,r/1440)), C=2*Math.PI*7; return '<svg class="tring'+(r<60?' soon':'')+'" viewBox="0 0 20 20" style="width:'+sz+'px;height:'+sz+'px"><circle cx="10" cy="10" r="7" class="bg"/><circle cx="10" cy="10" r="7" class="fg" stroke-dasharray="'+C.toFixed(2)+'" stroke-dashoffset="'+(C*(1-f)).toFixed(2)+'"/></svg>'; }
function myToday(st){ return st.used.length; }

/* ---------------- общие куски ---------------- */
function sb(st,cls){ return '<div class="sb'+(cls?' '+cls:'')+'"><span class="t">9:41</span><span class="isl"></span><span class="ri">'+SBI+'</span></div>'; }
function hb(st,cls){ return '<div class="hb'+(cls?' '+cls:'')+'"><i></i></div>'; }
function tb(st,on){
  var t=[['home','home','tab_home'],['feed','svc-stories','tab_live'],['map','map','tab_map']];
  return '<div class="tb">'+t.map(function(x){ return '<div class="t'+(x[0]===on?' on':'')+'" data-a="tab" data-t="'+x[0]+'">'+ic(x[1])+'<span>'+T(st,x[2])+'</span></div>'; }).join('')+'</div>';
}
function av(u,s){
  var U=USERS[u]||{n:u}; var css='width:'+s+'px;height:'+s+'px;font-size:'+Math.round(s*.4)+'px';
  if(U.logo) return '<div class="av logo" style="'+css+'">'+LOGO+'</div>';
  if(U.av) return '<div class="av '+im(U.av)+'" style="'+css+'"></div>';
  return '<div class="av" style="'+css+'">'+U.n.charAt(0)+'</div>';
}
/* кольцо: сегмент на каждую публикацию автора за сутки (максимум 3 — лимит) */
function ring(segs,inner,pad){
  pad=pad||5;
  if(!segs||!segs.length) return '<div class="ring" style="padding:'+pad+'px">'+inner+'</div>';
  var A='#0F5FCC', S='#CCC7BD', n=segs.length, g;
  if(n===1) g=segs[0]?A:S;
  else { var seg=360/n, gap=7, parts=[];
    segs.forEach(function(u,i){ var a0=i*seg+gap/2, a1=(i+1)*seg-gap/2, c=u?A:S;
      parts.push('transparent '+(i*seg)+'deg '+a0+'deg', c+' '+a0+'deg '+a1+'deg', 'transparent '+a1+'deg '+((i+1)*seg)+'deg'); });
    g='conic-gradient('+parts.join(',')+')'; }
  return '<div class="ring" style="padding:'+pad+'px;background:'+g+'">'+inner+'</div>';
}
function ringAv(st,u,s){
  var ps=storyPosts(st,u); var un=ps.some(function(p){ return !isSeen(st,p); });
  return ring(un?[true]:null, av(u,s), 4);
}
function shw(st,kind,inner){ return '<div class="shw'+(st._anim?' anim':'')+'" data-sheet="'+kind+'"><div class="sh"><div class="grab"></div>'+inner+'</div></div>'; }
function opt(icn,label,sub,attrs,cls,right){ return '<div class="o'+(cls?' '+cls:'')+'" '+(attrs||'')+'>'+(icn?ic(icn):'')+'<div class="t">'+label+(sub?'<small>'+sub+'</small>':'')+'</div>'+(right||'')+'</div>'; }

/* статичная карта-картинка (не живая: в квоту Яндекса не входит) */
function smap(st,o){
  var vw=o.w/o.z, vh=o.h/o.z, x0=o.cx-vw/2, y0=o.cy-vh/2;
  var h='<div class="smap" style="height:'+o.h+'px"><svg viewBox="'+x0.toFixed(0)+' '+y0.toFixed(0)+' '+vw.toFixed(0)+' '+vh.toFixed(0)+'" preserveAspectRatio="xMidYMid slice"><use href="#shumap" width="2400" height="3000"/></svg>';
  (o.pins||[]).forEach(function(p){ var xy=pos(p); var l=(xy[0]-x0)/vw*100, t=(xy[1]-y0)/vh*100; if(l<3||l>97||t<6||t>94) return;
    h+='<div class="tpin '+im(p.imgs[0])+(isSeen(st,p)?'':' u')+'" style="left:'+l.toFixed(1)+'%;top:'+t.toFixed(1)+'%"></div>'; });
  if(o.me && st.geo){ var ml=(ME_XY[0]-x0)/vw*100, mt=(ME_XY[1]-y0)/vh*100; h+='<div class="me-dot" style="left:'+ml+'%;top:'+mt+'%;width:12px;height:12px;margin:-6px 0 0 -6px;box-shadow:0 0 0 2.5px #fff"></div>'; }
  if(o.pin) h+='<div class="pin" style="left:50%;top:50%">'+PIN+'</div>';
  if(o.lens){ var lz=o.z*4.2, lw=92/lz; h+='<div class="lens" style="right:10px;top:10px"><svg viewBox="'+(o.cx-lw/2)+' '+(o.cy-lw/2)+' '+lw+' '+lw+'"><use href="#shumap" width="2400" height="3000"/></svg><i class="c"></i></div>'; }
  h+='<span class="attr">© Яндекс</span></div>';
  return h;
}

/* ---------------- пост ---------------- */
function media(st,p,o){
  o=o||{};
  var ar=clampAR(IMGAR[p.imgs[0]]); var n=p.imgs.length; var cur=st.slide[p.id]||0;
  var vid=p.vid>0, stop=vid&&st.saver&&!st.played[p.id];
  var h='<div class="media'+(vid?' vid'+(stop?'':' loop'):'')+'" style="aspect-ratio:'+ar.toFixed(3)+'" data-dbl="'+p.id+'">';
  h+='<div class="trk" data-trk="'+p.id+'">'+p.imgs.map(function(x){ return '<div class="fr '+im(x)+'"></div>'; }).join('')+'</div>';
  if(p.id===POD&&!o.nobadge) h+='<div class="badge">'+ic('trophy')+T(st,'photo_day')+'</div>';
  if(n>1) h+='<div class="cnt num" data-cnt="'+p.id+'">'+(cur+1)+'/'+n+'</div>';
  if(vid){
    if(stop) h+='<div class="play" data-a="play" data-id="'+p.id+'">'+ic('play')+'</div><div class="vq">'+T(st,'slow_q')+' · '+dur(p.vid)+'</div>';
    else h+='<div class="vtime num" data-a="reels" data-id="'+p.id+'">'+ic('expand')+dur(p.vid)+'</div><div class="fab44 snd" data-a="snd">'+ic(st.sound?'vol-on':'vol-off')+'</div>';
  }
  h+='</div>';
  if(n>1){ h+='<div class="dots" data-dots="'+p.id+'">'; for(var i=0;i<n;i++) h+='<i class="'+(i===cur?'on':'')+'"></i>'; h+='</div>'; }
  return h;
}
function actions(st,p){
  var lk=isLiked(st,p), c=cN(st,p);
  return '<div class="p-a"><div class="b'+(lk?' on':'')+'" data-a="like" data-id="'+p.id+'">'+ic(lk?'heart-filled':'heart')+'<span class="num">'+likeN(st,p)+'</span></div>'+
    '<div class="b" data-a="comment" data-id="'+p.id+'">'+ic('chat')+(c?'<span class="num">'+c+'</span>':'')+'</div>'+
    '<div class="b" data-a="send" data-id="'+p.id+'">'+ic('send')+'</div><div class="b" data-a="share" data-id="'+p.id+'">'+ic('share')+'</div>'+
    '<div class="sp"></div><div class="vw num">'+ic('eye')+viewN(st,p)+'</div></div>';
}
function caption(st,p,full){
  if(!p.cap) return '';
  var long=full ? p.cap.length>420 : (p.cap.length>86||p.cap.indexOf('\n')>=0);
  var open=st.expanded[p.id]||!long;
  return '<div class="p-c"><div class="'+(open?'':(full?'clip6':'clip'))+'"><b data-a="author" data-u="'+p.u+'">'+p.u+'</b> '+fmtText(p.cap)+'</div>'+
    (long&&!open?'<span class="more" data-a="expand" data-id="'+p.id+'">'+T(st,'more')+'</span>':'')+'</div>';
}
function cText(st,c){ return c.x?fmtText(c.x):(c.s?'<i style="color:var(--ink3)">'+T(st,'cmt_stk')+'</i>':'<i style="color:var(--ink3)">GIF</i>'); }
function cpreview(st,p){
  var cms=comments(st,p).filter(function(c){ return !st.blocked[c.u]; }); if(!cms.length) return '';
  var last=cms[cms.length-1];
  return '<div class="p-k" data-a="comment" data-id="'+p.id+'"><div>'+(cms.length===1?T(st,'one_comment'):T(st,'all_comments',{n:cms.length}))+'</div><div class="lc"><b>'+last.u+'</b> '+cText(st,last)+'</div></div>';
}
function remOf(st,p){ return 1440-p.m; }
function footer(st,p){
  var h='<div class="p-f">';
  if(p.demo) h+='<span class="left">'+T(st,'permanent')+'</span>';
  else { var r=remOf(st,p); h+='<span class="left'+(r<60?' soon':'')+'">'+tring(st,p)+leftTxt(st,r)+'</span>'; }
  if(p.c==='roads'&&hasOfficial(st,p)) h+='<span class="offi">'+ic('shield-check')+T(st,'official')+'</span>';
  h+='<span class="loc" data-a="onmap" data-id="'+p.id+'">'+ic('map')+'<span>'+(st.geo?distTxt(st,p):vname(st,p.v))+'</span></span></div>';
  return h;
}
function phead(st,p,noMore){
  var sk=spotKey(p), place=sk?spotName(st,sk):vname(st,p.v);
  return '<div class="p-h"><div data-a="author" data-u="'+p.u+'">'+av(p.u,36)+'</div><div class="who"><div class="l1"><b data-a="author" data-u="'+p.u+'">'+p.u+'</b><span>· '+ago(st,p.m)+'</span>'+(!isFollowed(st,p.u)&&p.u!==ME&&!(USERS[p.u]&&USERS[p.u].logo)?'<em class="fl" data-a="follow" data-u="'+p.u+'">'+T(st,'follow')+'</em>':'')+'</div><div class="l2"><span class="pl" data-a="'+(sk?'spot':'onmap')+'" data-k="'+(sk||'')+'" data-id="'+p.id+'">'+ic('location')+place+'</span><span class="ct" data-a="cat" data-c="'+p.c+'">'+T(st,'cat_'+p.c)+'</span></div></div>'+
    (noMore?'':'<div class="mo" data-a="more" data-id="'+p.id+'">'+ic('more')+'</div>')+'</div>';
}
function hasOfficial(st,p){ return comments(st,p).some(function(c){ return USERS[c.u]&&USERS[c.u].official; }); }
function card(st,p){
  return '<article class="post card18" data-pid="'+p.id+'">'+phead(st,p)+media(st,p)+actions(st,p)+caption(st,p,false)+cpreview(st,p)+footer(st,p)+'</article>';
}
function tile(st,p,left){
  var tl='';
  if(left&&!p.demo){ var r=remOf(st,p); tl='<span class="tl'+(r<60?' soon':'')+'">'+leftTxt(st,r)+'</span>'; }
  return '<div class="tile '+im(p.imgs[0])+'" data-a="post" data-id="'+p.id+'">'+tl+'<span class="lk">'+ic('heart-filled')+likeN(st,p)+'</span>'+
    (p.vid?'<span class="ty">'+ic('play')+'</span>':(p.imgs.length>1?'<span class="ty">'+ic('carousel')+'</span>':''))+'</div>';
}

/* ---------------- экраны ---------------- */
var R={};

function hdRoot(st){
  var v=st.vil==='all'?T(st,'all_district'):vname(st,st.vil);
  var me=st.guest?'<div class="av" style="width:34px;height:34px;color:var(--ink3)" data-a="login">'+ic('user')+'</div>':'<div data-a="mine">'+av(ME,34)+'</div>';
  return '<div class="hd hd-live">'+me+'<div class="ttl">Live</div><div class="pill'+(st.vil==='all'?'':' on')+'" data-a="vil"><span>'+v+'</span>'+ic('chevron-down')+'</div><div class="sp"></div><div class="ib" data-a="add">'+ic('plus-square')+'</div></div>';
}
function rail(st){
  var h='<div class="sec-h"><b>'+T(st,'now_title')+'</b><span>'+T(st,'today_n',{n:filtered(st,{nocat:1,novil:1,nohour:1}).length})+'</span></div><div class="hs spots">';
  h+='<div class="spot me" data-a="'+(st.guest?'login':'add')+'"><div class="ph">'+(st.guest?ic('user'):av(ME,40))+'<span class="plus">'+ic('plus')+'</span></div><div class="nm">'+T(st,'add_card')+'</div></div>';
  if(!st.empty) spots(st).forEach(function(sp){ if(st.only&&sp.k!=='s:hippo') return; var cover=sp.ps.filter(function(p){ return !isSeen(st,p); })[0]||sp.ps[0];
    h+='<div class="spot'+(sp.un?'':' seen')+'" data-a="spot" data-k="'+sp.k+'"><div class="ph '+im(cover.imgs[0])+'">'+(sp.pod?'<span class="tr">'+ic('trophy')+'</span>':'')+'<span class="n">'+sp.n+'</span>'+(cover.vid?'<span class="vv">'+ic('play')+'</span>':'')+'</div><div class="nm">'+spotName(st,sp.k)+'</div><div class="sb2">'+ago(st,sp.last)+(sp.na>1?' · '+T(st,'authors_n',{n:sp.na}):'')+'</div></div>'; });
  return h+'</div>';
}
/* лента активности: 24 столбика по часам, тап — фильтр по часу */
function ribbon(st){
  var ps=filtered(st,{nohour:1}), cnt=[]; for(var i=0;i<24;i++) cnt.push(0);
  ps.forEach(function(p){ if(!p.demo) cnt[hourOf(p)]++; });
  var mx=Math.max(1,Math.max.apply(null,cnt)), nowH=Math.floor(NOW_MIN/60);
  var lbl=st.hour!=null?T(st,'hour_n',{h:st.hour,h2:(st.hour+1)%24,n:cnt[st.hour]}):T(st,'today_n',{n:ps.filter(function(p){return !p.demo;}).length});
  var h='<div class="rib"><div class="rl"><span>'+lbl+'</span>'+(st.hour!=null?'<u data-a="hour" data-h="">'+T(st,'clear_hour')+'</u>':'')+'</div><div class="bars">';
  for(var k=0;k<24;k++){ var hh=(nowH+1+k)%24; var v=cnt[hh]; h+='<i data-a="hour" data-h="'+hh+'" class="'+(st.hour===hh?'on':'')+(hh===nowH?' now':'')+(v?'':' z')+'" style="height:'+Math.max(3,Math.round(v/mx*26))+'px"></i>'; }
  h+='</div><div class="hrs"><span>'+((nowH+1)%24)+':00</span><span>'+((nowH+13)%24)+':00</span><span>'+nowH+':00</span></div></div>';
  return h;
}
function whoSeg(st){ return '<div class="segc who"><div class="o'+(st.who==='all'?' on':'')+'" data-a="who" data-w="all">'+T(st,'all')+'</div><div class="o'+(st.who==='friends'?' on':'')+'" data-a="who" data-w="friends">'+T(st,'friends')+'</div></div>'; }
function isFollowed(st,u){ return !!st.follows[u]; }
function followBtn(st,u,cls){ if(u===ME||(USERS[u]&&USERS[u].logo)) return ''; var on=isFollowed(st,u); return '<div class="btn '+(on?'ol':'pr')+' sm '+(cls||'')+'" data-a="follow" data-u="'+u+'">'+(on?ic('check'):'')+T(st,on?'following':'follow')+'</div>'; }
/* пустое состояние «Друзья»: подсказываем активных авторов */
function suggestAuthors(st){
  var list=authors(st).filter(function(a){ return !isFollowed(st,a.u)&&a.u!=='audan.kz'; }).slice(0,5);
  var h='<div class="empty" style="padding-bottom:10px">'+ic('user','big')+'<b>'+T(st,Object.keys(st.follows).length?'friends_empty':'no_friends_t')+'</b><span>'+T(st,'no_friends_s')+'</span></div>';
  if(!list.length) return h;
  h+='<div class="sec" style="padding-top:4px">'+T(st,'suggest')+'</div>'+list.map(function(a){ return '<div class="srow"><div data-a="author" data-u="'+a.u+'">'+av(a.u,44)+'</div><div class="t" data-a="author" data-u="'+a.u+'"><b>'+a.u+'</b><span>'+esc(USERS[a.u].n)+' · '+T(st,'posts_n',{n:a.ps.length})+'</span></div>'+followBtn(st,a.u)+'</div>'; }).join('');
  return h;
}
function toolsRow(st){ return '<div class="tools">'+whoSeg(st)+'<div class="sp"></div><div class="vtog"><i class="'+(st.mode==='list'?'on':'')+'" data-a="mode" data-m="list">'+ic('list')+'</i><i class="'+(st.mode==='grid'?'on':'')+'" data-a="mode" data-m="grid">'+ic('grid')+'</i></div></div>'; }
function chipsRow(st){ return chipsCat(st,false); }
function chipsCat(st,forMap){
  var base=filtered(st,{nocat:1,map:forMap});
  var h='<div class="hs chips">';
  if(!forMap) h+='<div class="chip ol" data-a="sort">'+ic('sort')+T(st,'sort_'+st.sort)+ic('chevron-down')+'</div>';
  h+='<div class="chip'+(st.cat==='all'?' on':'')+'" data-a="cat" data-c="all">'+T(st,'all_places')+'<i>'+base.length+'</i></div>';
  CATS.forEach(function(c){ var n=base.filter(function(p){ return p.c===c; }).length;
    h+='<div class="chip'+(st.cat===c?' on':'')+(n||st.cat===c?'':' off')+'" data-a="cat" data-c="'+c+'">'+T(st,'cat_'+c)+(n?'<i>'+n+'</i>':'')+'</div>'; });
  return h+'</div>';
}
function teaser(st){
  var ps=filtered(st); var un=ps.filter(function(p){ return !isSeen(st,p); }).length;
  var pins=ps.filter(function(p){ return p.v==='shu'; }).slice(0,14);
  return '<div class="mteaser" data-a="tab" data-t="map"><div class="t"><b>'+T(st,'on_map')+'</b><span>'+T(st,'posts_n',{n:ps.length})+(un?' · '+T(st,'new_n',{n:un}):'')+'</span><em>'+T(st,'open')+ic('chevron-right')+'</em></div>'+
    smap(st,{cx:1230,cy:1300,z:.3,w:W(st),h:150,pins:pins,me:1})+'</div>';
}
function skeleton(st){
  var h='<div class="hs rail">'; for(var i=0;i<5;i++) h+='<div class="it"><div class="sk c" style="width:66px;height:66px"></div><div class="sk" style="width:48px;height:10px;margin-top:3px"></div></div>'; h+='</div>';
  h+='<div class="hs chips">'; [110,90,84,96].forEach(function(w){ h+='<div class="sk" style="flex:none;width:'+w+'px;height:36px;border-radius:18px"></div>'; }); h+='</div>';
  for(var k=0;k<2;k++) h+='<div class="post"><div class="p-h"><div class="sk c" style="width:36px;height:36px"></div><div style="flex:1"><div class="sk" style="width:120px;height:12px"></div><div class="sk" style="width:90px;height:10px;margin-top:6px"></div></div></div><div class="sk" style="border-radius:0;aspect-ratio:1"></div><div style="padding:14px"><div class="sk" style="width:60%;height:12px"></div><div class="sk" style="width:85%;height:12px;margin-top:8px"></div></div></div>';
  return h;
}
R.feed=function(st){
  var h=sb(st)+hdRoot(st)+'<div class="app" data-scroll="feed">';
  if(st.loading){ h+=skeleton(st); }
  else if(st.mode==='grid'){
    h+=toolsRow(st)+rail(st)+chipsRow(st);
    h+='<div class="gsearch"><div class="fld">'+ic('search')+'<input data-gq placeholder="'+esc(T(st,'search_live'))+'" value="'+esc(st.q||'')+'">'+(st.q?'<span class="x" data-a="gclearq">'+ic('close')+'</span>':'')+'</div></div>';
    var today=filtered(st,{nohour:1}).length;
    h+='<div class="segs2"><div class="s'+(st.gseg==='today'?' on':'')+'" data-a="gseg" data-s="today">'+T(st,'today_seg')+'<i>'+today+'</i></div><div class="s'+(st.gseg==='week'?' on':'')+'" data-a="gseg" data-s="week">'+T(st,'week_best')+'<i>'+WEEK.length+'</i></div></div>';
    if(st.who==='friends'&&!today&&st.gseg==='today') h+=suggestAuthors(st);
    else h+='<div data-ggrid>'+galleryGrid(st)+'</div>';
  } else {
    h+=toolsRow(st)+rail(st)+chipsRow(st);
    var F=feedLists(st);
    if(st.saver) h+='<div class="post" style="padding:12px 0"><div class="hint">'+ic('wifi-off')+'<span><b style="color:var(--ink);font-weight:650">'+T(st,'saver_t')+'.</b> '+T(st,'saver_s')+'</span></div></div>';
    if(!F.un.length&&!F.sn.length){
      if(st.who==='friends') h+=suggestAuthors(st);
      else { var f=st.cat!=='all'||st.vil!=='all';
        h+='<div class="empty">'+ic('camera','big')+'<b>'+T(st,f?'empty_f':'empty_t')+'</b><span>'+(f?'':T(st,'empty_s'))+'</span>'+
          (f?'<div class="btn ol" data-a="clearf">'+T(st,'clear_f')+'</div>':'<div class="btn pr" data-a="add">'+ic('camera')+T(st,'add_photo')+'</div>')+'</div>'; }
    } else {
      if(!F.un.length) h+='<div class="caught">'+ic('check-circle')+'<b>'+T(st,'caught')+'</b><span>'+T(st,'caught_s')+'</span></div>';
      F.un.forEach(function(p,i){ h+=card(st,p); if(i===1 && !st.only) h+=teaser(st); });
      if(F.un.length && F.un.length<2 && !st.only && F.sn.length) h+=teaser(st);
      if(F.sn.length){
        if(F.un.length) h+='<div class="caught">'+ic('check-circle')+'<b>'+T(st,'caught')+'</b><span>'+T(st,'caught_s')+'</span></div>';
        h+='<div class="grid3">'+F.sn.map(function(p){ return tile(st,p,false); }).join('')+'</div>';
      }
      if(st.only) h+='<div class="empty" style="padding:26px 28px 30px"><span style="margin:0">'+T(st,'one_note')+'</span><div class="btn pr" data-a="add">'+ic('camera')+T(st,'add_photo')+'</div></div>';
      else h+='<div class="endnote">'+T(st,'end')+'<div style="display:flex;justify-content:center;margin-top:14px"><div class="btn ol sm" data-a="add">'+ic('camera')+T(st,'add_photo')+'</div></div></div>';
    }
  }
  h+='</div>'+tb(st,'feed')+hb(st);
  if(st.freshPill) h+='<div class="newpill" data-a="fresh" style="top:'+(dims(st).sb+60)+'px">'+ic('arrow-left')+T(st,'new_posts',{n:2})+'</div>';
  return h;
};

R.home=function(st){
  var ps=active(st), un=ps.filter(function(p){ return !isSeen(st,p); }).length;
  var avs=authors(st).filter(function(a){return a.un&&USERS[a.u]&&USERS[a.u].av;}).slice(0,4);
  var h=sb(st)+'<div class="app">';
  h+='<div class="h-head"><div class="h-logo">Audan<i>.</i>kz</div><div class="h-shu">Shu</div><div style="flex:1"></div><div class="hd" style="padding:0;height:auto;background:none"><div class="ib">'+ic('bell')+'</div></div><div class="pill" style="padding:0 8px 0 10px">'+T(st,'lang')+ic('chevron-down')+'</div></div>';
  h+='<div class="h-search">'+ic('search')+T(st,'search_ph')+'</div>';
  h+='<div class="lban" data-a="tab" data-t="feed">'+smap(st,{cx:1210,cy:1290,z:.27,w:W(st)-32,h:164,pins:ps.filter(function(p){return p.v==='shu';}).slice(0,12),me:1})+
     '<div class="in"><div class="t"><b>Audan Live<i></i></b><span>'+T(st,'live_s',{n:ps.length,k:un})+'</span></div><div class="avs">'+avs.map(function(a){ return av(a.u,28); }).join('')+'</div>'+ic('chevron-right')+'</div></div>';
  h+='</div>';
  var G=[['home','g_home',null],['svc-market','g_market','cats'],['svc-food','g_food','food'],['user','g_profile','profile']];
  h+='<div class="tb">'+G.map(function(g,i){ return '<div class="t'+(i===0?' on':'')+'" '+(g[2]?'data-a="ext" data-s="'+g[2]+'"':'')+'>'+ic(g[0])+'<span>'+T(st,g[1])+'</span></div>'; }).join('')+'</div>'+hb(st);
  return h;
};

function storySegs(ps){ var s=[]; ps.forEach(function(q,i){ (q.vid?[q.imgs[0]]:q.imgs).forEach(function(x,j){ s.push({pi:i,si:j,img:x}); }); }); return s; }
R.story=function(st){
  var d=dims(st), s=st.story||{sp:'s:hippo',pi:0,si:0,t:.45};
  var ps=viewerPosts(st); if(!ps.length) return '';
  var p=ps[Math.min(s.pi,ps.length-1)], segs=storySegs(ps);
  var idx=0; segs.forEach(function(g,i){ if(g.pi===s.pi&&g.si===s.si) idx=i; });
  var bot=d.hb+66, lk=isLiked(st,p), us={}; ps.forEach(function(q){ us[q.u]=1; });
  var title=s.sp?spotName(st,s.sp):p.u, sub=s.sp?T(st,'spot_sub',{a:T(st,'authors_n',{n:Object.keys(us).length}),p:T(st,'spot_photos',{n:segs.length})}):ago(st,p.m);
  var h=sb(st,'ov w');
  h+='<div class="sp-media '+im(segs[idx].img)+(p.vid&&!(st.saver&&!st.played[p.id])?' vidloop':'')+'" style="top:'+d.sb+'px;bottom:'+bot+'px;border-radius:14px"></div>';
  h+='<div class="sp-shade" style="top:'+d.sb+'px;height:120px;border-radius:14px 14px 0 0;background:linear-gradient(rgba(0,0,0,.5),transparent)"></div>';
  h+='<div class="sp-shade" style="bottom:'+bot+'px;height:230px;border-radius:0 0 14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.66))"></div>';
  h+='<div class="sp-prog" style="top:'+(d.sb+8)+'px">'+segs.map(function(g,i){ return '<i class="'+(i<idx?'done':'')+'"><b'+(i===idx?' data-cur style="width:'+(s.t*100).toFixed(1)+'%"':'')+'></b></i>'; }).join('')+'</div>';
  h+='<div class="sp-head" style="top:'+(d.sb+16)+'px">'+(s.sp?'<div class="spic">'+ic('location')+'</div>':av(p.u,32))+'<div class="who"><b>'+title+'</b><span>'+sub+'</span></div>'+
     '<div class="ib" data-a="more" data-id="'+p.id+'">'+ic('more')+'</div><div class="ib" data-a="back">'+ic('close')+'</div></div>';
  if(p.vid){ if(st.saver&&!st.played[p.id]) h+='<div class="sp-hint" data-a="play" data-id="'+p.id+'" style="top:50%">'+ic('play')+T(st,'slow_q')+'</div>';
    else h+='<div class="sp-hint" data-a="snd" style="top:'+(d.sb+68)+'px">'+ic(st.sound?'vol-on':'vol-off')+T(st,st.sound?'sound_on':'sound_tap')+'</div>'; }
  h+='<div class="sp-tap" data-tap="-1" style="left:0;width:32%"></div><div class="sp-tap" data-tap="1" style="right:0;width:68%"></div>';
  h+='<div class="sp-foot" style="bottom:'+(d.hb+8)+'px"><div class="sp-au" data-a="author" data-u="'+p.u+'">'+av(p.u,26)+'<b>'+p.u+'</b><span>'+ago(st,p.m)+(p.demo?'':' · '+leftTxt(st,remOf(st,p)))+'</span></div>'+
     (s.sp?'':'<div class="loc" data-a="onmap" data-id="'+p.id+'">'+ic('location')+vname(st,p.v)+(st.geo?' · '+distTxt(st,p):'')+'</div>')+
     (p.cap?'<div class="cap" data-a="comment" data-id="'+p.id+'"><div class="clip">'+fmtText(p.cap)+'</div></div>':'')+
     '<div class="sp-bar"><div class="fld" data-a="comment" data-id="'+p.id+'">'+T(st,'write_comment')+'</div><div class="ib'+(lk?' on':'')+'" data-a="like" data-id="'+p.id+'">'+ic(lk?'heart-filled':'heart')+'</div><div class="ib" data-a="send" data-id="'+p.id+'">'+ic('send')+'</div><div class="ib" data-a="share" data-id="'+p.id+'">'+ic('share')+'</div></div></div>';
  h+=hb(st,'ov w');
  return h;
};

/* ---------------- галерея (masonry) ---------------- */
function galItems(st){
  if(st.gseg==='week') return WEEK.map(function(w,i){ return {id:'w'+i,imgs:[w[0]],u:w[2],l:w[3],v:w[4],day:w[1],week:1,cap:'',vid:0,m:9999,demo:1}; });
  var ps=filtered(st,{nohour:1}); if(st.only) ps=ps.filter(function(p){ return p.id===st.only; });
  ps.sort(sorter(st));
  var q=(st.q||'').trim().toLowerCase();
  if(q) ps=ps.filter(function(p){ var sk=spotKey(p); return (p.cap+' '+p.u+' '+(USERS[p.u]?USERS[p.u].n:'')+' '+(sk?spotName(st,sk):'')+' '+vname(st,p.v)+' '+T(st,'cat_'+p.c)).toLowerCase().indexOf(q)>=0; });
  return ps;
}
function gtile(st,p){
  var ar=Math.max(.62,Math.min(1.5,clampAR(IMGAR[p.imgs[0]])));
  var h='<div class="gi" data-a="'+(p.week?'':'post')+'" data-id="'+p.id+'" data-lp="'+p.id+'"><div class="gt '+im(p.imgs[0])+(p.week?'':(isSeen(st,p)?' seen':''))+'" style="aspect-ratio:'+ar.toFixed(3)+'">';
  if(p.id===POD||p.week) h+='<span class="tr">'+ic('trophy')+(p.week?'<b>'+p.day+'</b>':'')+'</span>';
  if(p.vid) h+='<span class="ty">'+ic('play')+'</span>'; else if(p.imgs.length>1) h+='<span class="ty">'+ic('carousel')+'</span>';
  h+='</div><div class="gf"><div class="au">'+av(p.u,20)+'<span>'+p.u+'</span></div><span class="lk">'+ic('heart-filled')+(p.week?p.l:likeN(st,p))+'</span></div></div>';
  return h;
}
function galleryGrid(st){
  var ps=galItems(st), w=W(st), colW=(w-16-8)/2, cols=[[],[]], hs=[0,0];
  ps.forEach(function(p){ var ar=Math.max(.62,Math.min(1.5,clampAR(IMGAR[p.imgs[0]]))); var i=hs[0]<=hs[1]?0:1; cols[i].push(p); hs[i]+=colW/ar+8+22; });
  if(!ps.length) return '<div class="empty" style="padding-top:60px">'+ic('search','big')+'<b>'+T(st,'nothing_found')+'</b><span>'+T(st,st.q?'empty_f':'empty_t')+'</span>'+(st.q||st.cat!=='all'?'<div class="btn ol" data-a="gclear">'+T(st,'clear_f')+'</div>':'')+'</div>';
  return '<div class="masonry"><div class="col">'+cols[0].map(function(p){ return gtile(st,p); }).join('')+'</div><div class="col">'+cols[1].map(function(p){ return gtile(st,p); }).join('')+'</div></div><div class="endnote" style="padding-top:8px">'+T(st,'gal_hint')+'</div>';
}
function fromSpot(st,p){
  var sk=spotKey(p), ps=(sk?spotPosts(st,sk):[]).filter(function(q){ return q.id!==p.id; });
  if(!ps.length){ sk=null; ps=active(st).filter(function(q){ return q.v===p.v&&q.id!==p.id; }); }
  ps=ps.slice(0,8); if(!ps.length) return '';
  return '<div class="sec" style="padding-top:14px">'+T(st,sk?'from_spot':'from_vil')+'<span>'+(sk?spotName(st,sk):vname(st,p.v))+'</span>'+(sk?'<a data-a="spot" data-k="'+sk+'">'+T(st,'spot_all')+'</a>':'')+'</div>'+
    '<div class="hs fstrip">'+ps.map(function(q){ return '<div class="ft '+im(q.imgs[0])+(isSeen(st,q)?' seen':'')+'" data-a="post" data-id="'+q.id+'">'+(q.vid?'<span class="ty">'+ic('play')+'</span>':'')+'<span class="lk">'+ic('heart-filled')+likeN(st,q)+'</span></div>'; }).join('')+'</div>';
}
function metaRows(st,p){
  var r=remOf(st,p), soon=!p.demo&&r<60;
  var h='<div class="meta"><div class="r'+(soon?' soon':'')+'">'+ic('clock')+'<span><b>'+exact(st,p.m)+'</b>'+(p.demo?' · '+T(st,'permanent'):' · <span data-left>'+leftTxt(st,r,st.expSec)+'</span>')+'</span></div>';
  h+='<div class="r">'+ic('eye')+'<span>'+T(st,'views_n',{n:viewN(st,p)})+' · '+T(st,'sends_n',{n:sendN(st,p)})+'</span></div></div>';
  return h;
}
function loccard(st,p,w){
  var xy=pos(p);
  return '<div class="loccard">'+smap(st,{cx:xy[0],cy:xy[1],z:p.v==='shu'?.62:.8,w:w,h:132,pin:1,lens:1})+
    '<div class="in"><div class="t"><b>'+vname(st,p.v)+'</b><span>'+(st.geo?T(st,'from_you',{d:distTxt(st,p)}):coords(xy[0],xy[1]))+'</span></div><div class="btn ol sm" data-a="onmap" data-id="'+p.id+'">'+ic('map')+T(st,'open_on_map')+'</div></div></div>';
}
function cmRow(st,p,c,i){
  if(st.blocked[c.u]) return '';
  var k=p.id+':'+i, lk=!!st.cliked[k], body;
  if(c.x) body='<div class="x">'+fmtText(c.x)+'</div>';
  else if(c.s){ var S=STICKERS.filter(function(s){return s.id===c.s;})[0]||STICKERS[0]; body='<div><span class="stk" style="background:'+S.bg+';color:'+S.fg+'">'+S.t+'</span></div>'; }
  else body='<div class="gifb '+im(c.g)+'"></div>';
  return '<div class="cm">'+'<div data-a="author" data-u="'+c.u+'">'+av(c.u,32)+'</div><div class="bd"><div class="h"><b data-a="author" data-u="'+c.u+'">'+c.u+'</b><span>'+ago(st,c.m)+'</span></div>'+body+
    '<div class="f"><span data-a="reply" data-u="'+c.u+'">'+T(st,'reply')+'</span><span class="mo" data-a="cmore" data-id="'+p.id+'" data-i="'+i+'">'+ic('more')+'</span></div></div>'+
    '<div class="rt'+(lk?' on':'')+'" data-a="clike" data-k="'+k+'">'+ic(lk?'heart-filled':'heart')+'<span>'+((c.l||0)+(lk?1:0)||'')+'</span></div></div>';
}
function composer(st){
  if(st.guest) return '<div class="cbar guest"><div class="btn ol sm" data-a="login" style="flex:1">'+ic('user')+T(st,'login_to_comment')+'</div></div>';
  return '<div class="cbar">'+av(ME,32)+'<div class="fld"><input data-cin placeholder="'+esc(T(st,'write_comment'))+'" enterkeyhint="send"><div class="ib" data-a="stk">'+ic('sticker')+'</div><div class="ib" data-a="gif">'+ic('gif')+'</div></div><div class="snd off" data-a="csend">'+T(st,'send')+'</div></div>';
}
R.post=function(st){
  var p=getPost(st,st.post)||POSTS[0], d=dims(st);
  var h=sb(st)+'<div class="hd sub line"><div class="bk" data-a="back">'+ic('chevron-right')+'</div><div class="ct">'+T(st,'post')+'</div><div class="ib" data-a="more" data-id="'+p.id+'">'+ic('more')+'</div></div>';
  if(isExpired(st,p)){
    return h+'<div class="app"><div class="empty" style="padding-top:120px">'+ic('clock','big')+'<b>'+T(st,'expired_t')+'</b><span>'+T(st,'expired_s')+'</span><div class="btn ol" data-a="tab" data-t="feed">'+T(st,'back_feed')+'</div></div></div>'+hb(st);
  }
  var r=remOf(st,p);
  if(!p.demo&&r<60) h+='<div class="bar soon"><i data-leftbar style="width:'+(st.expSec!=null?st.expSec/60*100/60:r/60*100).toFixed(2)+'%"></i></div>';
  h+='<div class="app" data-scroll="post"><div style="background:var(--card);padding-bottom:6px">'+phead(st,p,true)+media(st,p)+actions(st,p)+caption(st,p,true)+
     '<div class="tags">'+(spotKey(p)?'<div class="tag" data-a="spot" data-k="'+spotKey(p)+'">'+ic('location')+spotName(st,spotKey(p))+'</div>':'')+'<div class="tag" data-a="cat" data-c="'+p.c+'">'+T(st,'cat_'+p.c)+'</div><div class="tag" data-a="vilset" data-v="'+p.v+'">'+vname(st,p.v)+'</div>'+(p.id===POD?'<div class="tag">'+ic('trophy')+T(st,'photo_day')+'</div>':'')+'</div>'+
     metaRows(st,p)+loccard(st,p,W(st)-28)+'</div>';
  h+=fromSpot(st,p);
  var cms=comments(st,p), offI=-1; cms.forEach(function(c,i){ if(offI<0&&USERS[c.u]&&USERS[c.u].official) offI=i; });
  h+='<div class="sec">'+T(st,'comments')+'<span>'+cN(st,p)+'</span></div><div data-cms>'+(offI>=0?'<div class="official"><div class="oh">'+ic('shield-check')+T(st,'official_pin')+'</div>'+cmRow(st,p,cms[offI],offI)+'</div>':'')+cms.map(function(c,i){ return i===offI?'':cmRow(st,p,c,i); }).join('')+'</div><div style="height:16px"></div></div>';
  h+=composer(st)+hb(st);
  return h;
};

R.author=function(st){
  var u=st.author, U=USERS[u]||{n:u,v:'shu',y:2025,fl:0,fg:0};
  var ps=storyPosts(st,u).slice().reverse();
  var fl=(U.fl||0)+(isFollowed(st,u)?1:0);
  var h=sb(st)+'<div class="hd sub"><div class="bk" data-a="back">'+ic('chevron-right')+'</div><div class="ct">'+u+'</div>'+(u===ME?'<div style="width:44px"></div>':'<div class="ib" data-a="amore">'+ic('more')+'</div>')+'</div><div class="app">';
  h+='<div class="prof"><div class="top"><div data-a="story" data-u="'+u+'">'+ring(ps.length?ps.map(function(p){return !isSeen(st,p);}):null,av(u,80),5.5)+'</div><div class="st"><div><b>'+ps.length+'</b><span>'+T(st,'posts_w')+'</span></div><div><b>'+fl+'</b><span>'+T(st,'followers_w')+'</span></div><div><b>'+(U.fg||0)+'</b><span>'+T(st,'following_w')+'</span></div></div></div>'+
     '<div class="nm">'+esc(U.n)+(U.official?' '+ic('shield-check','off-ic'):'')+'</div><div class="bio">'+ic('location')+vname(st,U.v)+' · '+T(st,'since',{y:U.y})+'</div>'+
     (u===ME||U.logo?'':'<div class="btns">'+followBtn(st,u,'grow')+'<div class="btn ol sm" data-a="dm">'+ic('send')+T(st,'message')+'</div></div>')+'</div>';
  h+='<div class="gtitle">'+T(st,'active_posts')+'<span>· '+T(st,'vanish')+'</span></div>';
  h+=ps.length?'<div class="grid3">'+ps.map(function(p){ return tile(st,p,true); }).join('')+'</div>':'<div class="endnote">'+T(st,'empty_f')+'</div>';
  h+='<div style="height:30px"></div></div>'+hb(st);
  return h;
};

/* ---------------- карта ---------------- */
function mapPosts(st){ var ps=filtered(st,{map:1}); ps.sort(function(a,b){ var ua=!isSeen(st,a), ub=!isSeen(st,b); if(ua!==ub) return ua?-1:1; return a.m-b.m; }); return ps.slice(0,60); }
function mapGeom(st){ var d=dims(st), w=W(st), h=H(st); var cardsB=TBH+d.hb+10; var top=d.sb+104, bot=h-cardsB-112-40;
  return {w:w,h:h,cx:w/2,cy:(top+bot)/2,cardsB:cardsB,top:top,bot:bot}; }
function defView(st){
  var s=W(st)/390;
  if(st.many) return {x:1200,y:1650,z:.15*s};
  if(st.vil!=='all'){ var c=st.vil==='shu'?GEO.town:GEO.villages[VILLAGES[st.vil].kk]; return {x:c[0],y:c[1],z:(st.vil==='shu'?.42:.95)*s}; }
  return {x:1215,y:1300,z:.42*s};
}
function toScr(st,v,xy){ var g=mapGeom(st); return [(xy[0]-v.x)*v.z+g.cx,(xy[1]-v.y)*v.z+g.cy]; }
function markersHTML(st,v){
  var ps=mapPosts(st), g=mapGeom(st);
  var pts=ps.map(function(p){ var s=toScr(st,v,pos(p)); return {p:p,x:s[0],y:s[1]}; })
    .filter(function(q){ return q.x>-40&&q.x<g.w+40&&q.y>-40&&q.y<g.h+40; });
  pts.sort(function(a,b){ function pr(q){ return (q.p.id===st.sel?1000:0)+(q.p.id===POD?100:0)+(!isSeen(st,q.p)?50:0)+likeN(st,q.p)/10; } return pr(b)-pr(a); });
  var cl=[];
  pts.forEach(function(q){ var hit=null; for(var i=0;i<cl.length;i++){ if(Math.hypot(cl[i].h.x-q.x,cl[i].h.y-q.y)<46){ hit=cl[i]; break; } } if(hit&&q.p.id!==st.sel) hit.n.push(q); else cl.push({h:q,n:[]}); });
  var html=cl.map(function(c){ var p=c.h.p, sel=p.id===st.sel, un=!isSeen(st,p), n=c.n.length;
    var cls='mk '+im(p.imgs[0])+(sel?' sel':(un?' u':' seen'))+(n&&!sel?' cl':'');
    return '<div class="'+cls+'" data-a="'+(n&&!sel?'cl':'mk')+'" data-id="'+p.id+'" style="left:'+c.h.x.toFixed(1)+'px;top:'+c.h.y.toFixed(1)+'px">'+
      (p.vid?'<span class="v">'+ic('play')+'</span>':'')+(p.id===POD?'<span class="tr">'+ic('trophy')+'</span>':'')+(n&&!sel?'<span class="n">+'+n+'</span>':'')+
      (sel?'<span class="lb">'+p.u+'<span>'+ago(st,p.m)+'</span></span>':'')+'</div>'; }).join('');
  if(st.geo){ var m=toScr(st,v,ME_XY); html+='<div class="me-dot" style="left:'+m[0]+'px;top:'+m[1]+'px"></div>'; }
  st._vis=pts.length; st._tot=ps.length;
  return html;
}
function worldTf(st,v){ var g=mapGeom(st); return 'transform:translate('+(g.cx-v.x*v.z).toFixed(1)+'px,'+(g.cy-v.y*v.z).toFixed(1)+'px) scale('+v.z.toFixed(4)+')'; }
function lmap(st,v,withMk){
  return '<div class="lmap" data-map><div class="world" style="'+worldTf(st,v)+'"><svg width="'+GEO.W+'" height="'+GEO.H+'" viewBox="0 0 '+GEO.W+' '+GEO.H+'"><use href="#shumap"/></svg></div><div class="mks">'+(withMk?markersHTML(st,v):'')+'</div></div>';
}
function mcard(st,p){
  var un=!isSeen(st,p), lk=isLiked(st,p);
  return '<div class="mcard'+(p.id===st.sel?' sel':'')+'" data-a="card" data-id="'+p.id+'"><div class="th '+im(p.imgs[0])+'">'+(p.vid?ic('play'):(p.imgs.length>1?ic('carousel'):''))+'</div><div class="bd"><div class="a">'+(un?'<i class="u"></i>':'')+'<b>'+p.u+'</b><span>· '+ago(st,p.m)+'</span></div>'+
    '<div class="x'+(p.cap?'':' e')+'">'+(p.cap?esc(p.cap):T(st,'no_caption'))+'</div><div class="s"><span>'+ic(lk?'heart-filled':'heart')+likeN(st,p)+'</span><span>'+ic('chat')+cN(st,p)+'</span><span class="d">'+(st.geo?distTxt(st,p):vname(st,p.v))+'</span></div></div></div>';
}
function psheet(st){
  var ps=mapPosts(st); if(!ps.length) return '';
  var idx=0; ps.forEach(function(p,i){ if(p.id===st.sel) idx=i; });
  var seq=ps.length>1?[ps[ps.length-1]].concat(ps,[ps[0]]):ps;
  var d=dims(st), bar=TBH+d.hb, hh=st.msheet==='full'?H(st)-d.sb-6-bar:Math.round(H(st)*.5);
  var h='<div class="psheet" data-psheet style="height:'+hh+'px;bottom:'+bar+'px"><div class="grab" data-grab><i></i></div><div class="pcar" data-pcar data-n="'+ps.length+'">';
  seq.forEach(function(p,i){ var on=(i===idx+(ps.length>1?1:0));
    h+='<div class="pc'+(on?' on':'')+'" data-pc="'+p.id+'"><div class="pm '+im(p.imgs[0])+'" data-a="post" data-id="'+p.id+'">'+(p.id===POD?'<div class="badge">'+ic('trophy')+T(st,'photo_day')+'</div>':'')+(p.imgs.length>1?'<div class="cnt num">1/'+p.imgs.length+'</div>':'')+(p.vid?'<div class="vtime num">'+ic('play')+dur(p.vid)+'</div>':'')+'</div>'+
      '<div class="pb">'+phead(st,p)+actions(st,p)+caption(st,p,true)+cpreview(st,p)+footer(st,p)+metaRows(st,p)+'<div style="height:16px"></div></div></div>'; });
  h+='</div></div>';
  return h;
}
R.map=function(st){
  var g=mapGeom(st), d=dims(st), v=st.view||(st.view=defView(st));
  var ps=mapPosts(st);
  if(!st.sel||!ps.some(function(p){return p.id===st.sel;})) st.sel=ps.length?ps[0].id:null;
  var h=lmap(st,v,true)+sb(st,'ov');
  h+='<div class="m-top" style="top:'+d.sb+'px"><div class="m-row">'+whoSeg(st).replace('segc who','segc who mapw')+'<div class="sp"></div>'+
     '<div class="segc">'+[1,6,24].map(function(t){ return '<div class="o'+(st.time===t?' on':'')+'" data-a="time" data-t="'+t+'">'+T(st,'t'+t)+'</div>'; }).join('')+'</div></div>'+chipsCat(st,true)+'</div>';
  h+='<div class="m-side" style="top:'+(d.sb+114)+'px"><div class="fab44'+(st.geo?'':' off')+'" data-a="locate">'+ic('locate-me')+'</div><div class="fab44" data-a="zin">'+ic('plus')+'</div><div class="fab44" data-a="zout">'+ic('minus')+'</div></div>';
  h+='<div class="attr" style="bottom:'+(g.cardsB+120)+'px">© Яндекс<u>'+T(st,'terms')+'</u></div>';
  h+='<div class="hs mcards" data-cards style="bottom:'+(g.cardsB-32)+'px">'+(ps.length?ps.map(function(p){ return mcard(st,p); }).join(''):'<div class="mcard" style="width:'+(W(st)-32)+'px;align-items:center;justify-content:center;color:var(--ink2);font-size:14px">'+T(st,'empty_f')+'</div>')+'</div>';
  h+='<div style="flex:1;pointer-events:none"></div>'+tb(st,'map')+hb(st);
  if(st.msheet) h+=psheet(st);
  return h;
};

R.reels=function(st){
  var d=dims(st);
  var vids=active(st).filter(function(p){ return p.vid>0; }).sort(function(a,b){ return a.id===st.post?-1:(b.id===st.post?1:a.m-b.m); });
  var h=sb(st,'ov w')+'<div class="rv-trk" data-reels>';
  vids.forEach(function(p){ var lk=isLiked(st,p);
    h+='<div class="rv-it" data-rid="'+p.id+'"><div class="sp-media '+im(p.imgs[0])+(st.saver&&!st.played[p.id]?'':' vidloop')+'" style="top:0;bottom:0" data-a="snd"></div>'+
      '<div class="sp-shade" style="bottom:0;height:300px;background:linear-gradient(transparent,rgba(0,0,0,.7))"></div><div class="sp-shade" style="top:0;height:130px;background:linear-gradient(rgba(0,0,0,.45),transparent)"></div>'+
      (st.saver&&!st.played[p.id]?'<div class="sp-hint" data-a="play" data-id="'+p.id+'" style="top:46%">'+ic('play')+T(st,'slow_q')+'</div>':'')+
      '<div class="rv-side" style="bottom:'+(d.hb+40)+'px"><div class="b'+(lk?' on':'')+'" data-a="like" data-id="'+p.id+'">'+ic(lk?'heart-filled':'heart')+likeN(st,p)+'</div><div class="b" data-a="comment" data-id="'+p.id+'">'+ic('chat')+cN(st,p)+'</div>'+
      '<div class="b" data-a="send" data-id="'+p.id+'">'+ic('send')+'</div><div class="b" data-a="share" data-id="'+p.id+'">'+ic('share')+'</div><div class="b" data-a="more" data-id="'+p.id+'">'+ic('more')+'</div></div>'+
      '<div class="rv-foot" style="bottom:'+(d.hb+30)+'px"><div class="a" data-a="author" data-u="'+p.u+'">'+av(p.u,32)+'<b>'+p.u+'</b><span style="opacity:.75">· '+ago(st,p.m)+'</span></div><div class="x">'+fmtText(p.cap)+'</div><div class="loc" data-a="onmap" data-id="'+p.id+'">'+ic('location')+vname(st,p.v)+(st.geo?' · '+distTxt(st,p):'')+'</div></div>'+
      '<div class="rv-prog" style="bottom:'+(d.hb+14)+'px"><i data-rprog="'+p.id+'"></i></div></div>'; });
  h+='</div><div class="sp-head" style="top:'+(d.sb+4)+'px"><div class="who" style="font-size:17px"><b>'+T(st,'videos')+'</b></div><div class="ib" data-a="snd">'+ic(st.sound?'vol-on':'vol-off')+'</div><div class="ib" data-a="back">'+ic('close')+'</div></div>'+hb(st,'ov w');
  return h;
};

R.mine=function(st){
  var h=sb(st)+'<div class="hd sub"><div class="bk" data-a="back">'+ic('chevron-right')+'</div><div class="ct">'+T(st,'mine_title')+'</div><div class="ib" data-a="add">'+ic('plus-square')+'</div></div><div class="app" data-scroll="mine">';
  if(st.guest){ h+='<div class="empty" style="padding-top:90px">'+ic('user','big')+'<b>'+T(st,'login_t')+'</b><span>'+T(st,'login_s')+'</span><div class="btn pr" data-a="login">'+T(st,'login')+'</div></div></div>'+hb(st); return h; }
  var act=storyPosts(st,ME).slice().reverse(), U=USERS[ME], used=myToday(st), left=Math.max(0,3-used);
  h+='<div class="prof" style="padding-bottom:16px"><div class="top" style="gap:14px">'+av(ME,64)+'<div style="flex:1;min-width:0"><div class="nm" style="margin:0">'+esc(U.n)+'</div><div class="bio" style="margin-top:2px">@'+ME+' · '+vname(st,U.v)+'</div></div></div>'+
     '<div class="limit"><div class="h">'+T(st,'limit_t')+'<span class="'+(left?'':'full')+'">'+(left?T(st,'limit_left',{n:left}):T(st,'limit_full'))+'</span></div><div class="seg">'+[0,1,2].map(function(i){ return '<i class="'+(st.used[i]||'')+'"></i>'; }).join('')+'</div><div class="n">'+T(st,'limit_note')+'</div></div></div>';
  h+='<div class="segs"><div class="s'+(st.mine==='a'?' on':'')+'" data-a="seg" data-s="a">'+T(st,'active')+'<i>'+act.length+'</i></div><div class="s'+(st.mine==='r'?' on':'')+'" data-a="seg" data-s="r">'+T(st,'archive')+'<i>'+ARCHIVE.length+'</i></div></div>';
  if(st.mine==='a'){
    if(!act.length) h+='<div class="endnote">'+T(st,'empty_t')+'</div>';
    act.forEach(function(p){ var r=remOf(st,p);
      h+='<div class="arow"><div class="th '+im(p.imgs[0])+'" data-a="post" data-id="'+p.id+'"></div><div class="bd" data-a="post" data-id="'+p.id+'"><div class="c1">'+(p.cap?esc(p.cap):T(st,'no_caption'))+'</div><div class="c2">'+vname(st,p.v)+' · '+T(st,'cat_'+p.c)+' · '+ago(st,p.m)+'</div>'+
        '<div class="stt"><span>'+ic('heart')+likeN(st,p)+'</span><span>'+ic('chat')+cN(st,p)+'</span><span>'+ic('eye')+viewN(st,p)+'</span><span>'+ic('send')+sendN(st,p)+'</span></div>'+
        '<div class="tlft"><span>'+leftTxt(st,r)+'</span><span>'+exact(st,p.m)+'</span></div><div class="bar'+(r<60?' soon':'')+'"><i style="width:'+(r/1440*100).toFixed(1)+'%"></i></div></div><div class="mo" data-a="more" data-id="'+p.id+'">'+ic('more')+'</div></div>'; });
  } else {
    h+='<div class="lock">'+ic('lock')+T(st,'only_you')+'</div>';
    var last=null, buf=[];
    function flush(){ if(buf.length) h+='<div class="gtitle" style="padding-top:8px">'+(st.lang==='ru'?last.replace(/қыр|там/,function(m){return ARCH_MONTH_RU[m];}):last)+'</div><div class="grid3">'+buf.join('')+'</div>'; buf=[]; }
    ARCHIVE.forEach(function(a){ if(a[1]!==last){ flush(); last=a[1]; } buf.push('<div class="tile '+im(a[0])+'"><span class="lk">'+ic('heart-filled')+a[2]+'</span></div>'); }); flush();
  }
  h+='<div style="height:24px"></div></div>'+hb(st);
  return h;
};

function addHead(st,step){
  var ok=step===1?st.draft.length>0:true;
  return '<div class="hd sub"><div class="bk" data-a="'+(step===1?'close-add':'back')+'">'+ic(step===1?'close':'chevron-right')+'</div><div class="ct">'+T(st,'new_post')+'</div>'+
    (step===1?'<div class="tx'+(ok?'':' off')+'" data-a="next">'+T(st,'next')+'</div>':'<div style="width:44px"></div>')+'</div><div class="steps"><i class="on"></i><i class="'+(step===2?'on':'')+'"></i></div>';
}
R.add=function(st){
  var d=dims(st), left=3-myToday(st);
  var h=sb(st);
  if(left<=0){
    return h+'<div class="hd sub"><div class="bk" data-a="close-add">'+ic('close')+'</div><div class="ct">'+T(st,'new_post')+'</div><div style="width:44px"></div></div><div class="app"><div class="empty" style="padding-top:70px">'+ic('clock','big')+'<b>'+T(st,'limit_reached_t')+'</b><span>'+T(st,'limit_reached_s')+'</span>'+
      '<div class="limit" style="text-align:left;margin-top:22px"><div class="seg" style="margin-top:0">'+st.used.slice(0,3).map(function(u){ return '<i class="'+u+'"></i>'; }).join('')+'</div><div class="n">'+T(st,'limit_note')+'</div></div>'+
      '<div class="btn ol" data-a="tab" data-t="mine">'+T(st,'to_archive')+'</div></div></div>'+hb(st);
  }
  h+=addHead(st,1)+'<div class="app">';
  if(!st.draft.length){
    h+='<div class="drop">'+ic('layers-photo','big')+'<b>'+T(st,'pick_media')+'</b><span>'+T(st,'pick_media_s')+'</span><div class="row"><div class="btn pr sm" data-a="src" data-k="gallery">'+ic('image')+T(st,'gallery')+'</div><div class="btn ol sm" data-a="src" data-k="camera">'+ic('camera')+T(st,'camera')+'</div></div>'+
       '<div class="btn tx sm" data-a="src" data-k="video" style="margin-top:6px">'+ic('video')+T(st,'video30')+'</div></div>';
  } else {
    var cur=st.draft[Math.min(st.dsel,st.draft.length-1)], ar=clampAR(IMGAR[cur.img]);
    var ph=Math.min(W(st)/ar, 430);
    h+='<div class="aprev" style="height:'+ph.toFixed(0)+'px"><div class="fr '+im(cur.img)+'"></div>'+(st.dsel===0&&st.draft.length>1?'<div class="cv">'+T(st,'cover')+'</div>':'')+(cur.vid?'<div class="media" style="position:absolute;inset:0;background:none"><div class="vtime num">'+ic('play')+dur(cur.vid)+'</div></div>':'')+'</div>';
    h+='<div class="hs strip">'+st.draft.map(function(x,i){ return '<div class="th '+im(x.img)+(i===st.dsel?' on':'')+'" data-a="thumb" data-i="'+i+'"><span class="no">'+(i+1)+'</span>'+(i===st.dsel?'<span class="rm" data-a="rm" data-i="'+i+'">'+ic('close')+'</span>':'')+'</div>'; }).join('')+
       (st.draft[0].vid||st.draft.length>=10?'':'<div class="add" data-a="src" data-k="more">'+ic('plus')+'</div>')+'</div>';
    h+='<div class="hint">'+ic('info')+'<span>'+(st.draft[0].vid?T(st,'video_one',{s:st.draft[0].vid}):T(st,'n_of_10',{n:st.draft.length}))+'</span></div>';
  }
  h+='<div class="hint'+(left===1?' w':'')+'" style="margin-top:10px">'+ic('clock')+'<span>'+T(st,'left_today',{n:left})+' · '+T(st,'limit_note')+'</span></div>';
  h+='</div>'+hb(st);
  return h;
};
R.adddet=function(st){
  var d=dims(st), left=3-myToday(st), cover=(st.draft[0]||{img:'lv-kokpar3'}).img;
  var ok=st.dcat&&st.dplace;
  var h=sb(st)+addHead(st,2)+'<div class="app"><div class="frm">';
  h+='<div class="capbox"><div class="th '+im(cover)+'"></div><textarea data-cap maxlength="2000" placeholder="'+esc(T(st,'caption_ph'))+'">'+esc(st.dcap)+'</textarea></div><div class="lbl" style="margin-top:6px"><span data-capn>'+T(st,'chars',{n:st.dcap.length})+'</span></div>';
  h+='<div class="lbl" style="margin-top:6px">'+T(st,'cat')+'<em>*</em></div><div class="chips wrap" style="padding:0">'+CATS.map(function(c){ return '<div class="chip'+(st.dcat===c?' on':'')+'" data-a="dcat" data-c="'+c+'">'+T(st,'cat_'+c)+'</div>'; }).join('')+'</div>';
  h+='<div class="lbl">'+T(st,'place_title')+'<em>*</em></div>';
  if(st.dplace){ var vk=villageAt(st.dplace[0],st.dplace[1]);
    h+='<div class="loccard" style="margin:0">'+smap(st,{cx:st.dplace[0],cy:st.dplace[1],z:.62,w:W(st)-32,h:132,pin:1})+'<div class="in"><div class="t"><b>'+vname(st,vk)+'</b><span>'+(st.dplaceAuto?T(st,'auto_place'):coords(st.dplace[0],st.dplace[1]))+'</span></div><div class="btn tx sm" data-a="pickplace">'+T(st,'change')+'</div></div></div>';
  } else h+='<div class="loccard" style="margin:0" data-a="pickplace"><div class="in" style="padding:16px 14px">'+ic('location')+'<div class="t"><b>'+T(st,'pick_place')+'</b><span>'+T(st,'pick_place_s')+'</span></div>'+ic('chevron-right')+'</div></div>';
  h+='<div class="hint" style="padding:14px 2px 20px">'+ic('info')+'<span>'+T(st,'vis_24')+'</span></div></div></div>';
  h+='<div class="afoot"><div class="btn pr'+(ok?'':' off')+'" data-a="publish">'+T(st,'publish')+'</div><div class="note">'+T(st,'left_today',{n:left})+'</div></div>'+hb(st);
  return h;
};
R.pick=function(st){
  var d=dims(st), g=pickGeom(st), v=st.pview||(st.pview={x:(st.dplace||ME_XY)[0],y:(st.dplace||ME_XY)[1],z:.9*W(st)/390});
  var vk=villageAt(v.x,v.y);
  var h='<div class="lmap" data-map data-pick><div class="world" style="transform:translate('+(g.cx-v.x*v.z).toFixed(1)+'px,'+(g.cy-v.y*v.z).toFixed(1)+'px) scale('+v.z.toFixed(4)+')"><svg width="'+GEO.W+'" height="'+GEO.H+'" viewBox="0 0 '+GEO.W+' '+GEO.H+'"><use href="#shumap"/></svg></div><div class="mks">'+
    (st.geo?'<div class="me-dot" style="left:'+((ME_XY[0]-v.x)*v.z+g.cx)+'px;top:'+((ME_XY[1]-v.y)*v.z+g.cy)+'px"></div>':'')+'</div></div>'+sb(st,'ov');
  h+='<div class="m-top" style="top:'+(d.sb+4)+'px"><div class="m-row"><div class="fab44" data-a="back">'+ic('chevron-right','flip')+'</div><div class="sp"></div><div class="pill" style="height:40px;border-radius:20px;box-shadow:var(--sh-float);padding:0 16px">'+T(st,'place_title')+'</div><div class="sp"></div><div class="fab44'+(st.geo?'':' off')+'" data-a="pme">'+ic('locate-me')+'</div></div></div>';
  h+='<div class="cpin" style="top:'+(g.cy-48)+'px">'+PIN.replace('width="34" height="42"','width="48" height="58"')+'</div>';
  h+='<div class="attr" style="bottom:'+(g.cardH+10)+'px">© Яндекс<u>'+T(st,'terms')+'</u></div>';
  h+='<div class="pkcard" style="height:'+g.cardH+'px"><div class="v" data-pv>'+vname(st,vk)+'</div><div class="c" data-pc>'+coords(v.x,v.y)+' · '+T(st,'drag_hint')+'</div><div class="btn pr'+(vk?'':' off')+'" data-a="pickhere">'+T(st,'choose_here')+'</div>'+hb(st)+'</div>';
  return h;
};
function pickGeom(st){ var d=dims(st), w=W(st), h=H(st), cardH=150+d.hb; return {w:w,h:h,cx:w/2,cy:(d.sb+60+(h-cardH))/2,cardH:cardH}; }

/* ---------------- шторки (общий компонент) ---------------- */
var SH={};
SH.vil=function(st){
  var base=filtered(st,{novil:1});
  var h='<h5>'+T(st,'vil_title')+'</h5><div class="grp">'+opt(null,T(st,'all_district'),null,'data-a="pvil" data-v="all"',st.vil==='all'?'on':'','<em>'+base.length+'</em><span class="tick"></span>');
  Object.keys(VILLAGES).forEach(function(k){ var n=base.filter(function(p){ return p.v===k; }).length;
    h+=opt(null,vname(st,k),null,'data-a="pvil" data-v="'+k+'"',(st.vil===k?'on':'')+(n?'':' off'),'<em>'+n+'</em><span class="tick"></span>'); });
  return h+'</div>';
};
SH.sort=function(st){
  return '<h5>'+T(st,'sort_title')+'</h5><div class="grp">'+['new','pop','near'].map(function(s){ var off=s==='near'&&!st.geo;
    return opt(s==='near'?'location':(s==='pop'?'heart':'clock'),T(st,'sort_'+s),off?T(st,'sort_near_off'):T(st,'sort_'+s+'_s'),'data-a="psort" data-s="'+s+'"',(st.sort===s?'on':'')+(off?' off':''),'<span class="tick"></span>'); }).join('')+'</div>';
};
SH.more=function(st,id){
  var p=getPost(st,id);
  if(p&&p.u===ME) return SH.ownmore(st,id);
  return '<div class="grp">'+opt('copy-link',T(st,'copy_link'),null,'data-a="copy"')+opt('flag',T(st,'report'),null,'data-a="goreport"')+(p&&p.u!=='audan.kz'?opt('block',T(st,'block_author'),'@'+p.u,'data-a="goblock" data-u="'+p.u+'"'):'')+'</div>';
};
SH.amore=function(st){ return '<div class="grp">'+opt('copy-link',T(st,'copy_link'),null,'data-a="copy"')+opt('flag',T(st,'report'),null,'data-a="goreport"')+opt('block',T(st,'block_author'),'@'+st.author,'data-a="goblock" data-u="'+st.author+'"')+'</div>'; };
SH.ownmore=function(st,id){
  var p=getPost(st,id)||POSTS[0];
  return '<h5>'+T(st,'you_post')+'</h5><div class="grp">'+opt('eye',T(st,'views_n',{n:viewN(st,p)}),T(st,'sends_n',{n:sendN(st,p)})+' · '+likeN(st,p)+' '+T(st,'likes_w'),'')+'</div><div class="grp">'+opt('copy-link',T(st,'copy_link'),null,'data-a="copy"')+opt('trash',T(st,'delete'),null,'data-a="godel" data-id="'+p.id+'"','dg')+'</div>';
};
SH.report=function(st){
  return '<h5>'+T(st,'report_t')+'</h5><div class="grp">'+['r_spam','r_nsfw','r_insult','r_fake','r_private','r_other'].map(function(k,i){ return opt(null,T(st,k),null,'data-a="rsn" data-i="'+i+'"','','<span class="tick"></span>'); }).join('')+'</div><div class="btn pr off" data-a="rsend">'+T(st,'send')+'</div>';
};
SH.block=function(st,u){ return '<div class="hero">'+ic('block')+'<b>'+T(st,'block_t')+'</b><span>'+T(st,'block_s',{u:'@'+u})+'</span></div><div class="btn pr" data-a="blockok" data-u="'+u+'">'+T(st,'block_ok')+'</div><div class="btn tx" data-a="shx">'+T(st,'cancel')+'</div>'; };
SH.del=function(st,id){ return '<div class="hero">'+ic('trash')+'<b>'+T(st,'del_t')+'</b><span>'+T(st,'del_s')+'</span></div><div class="btn pr del" data-a="delok" data-id="'+id+'">'+T(st,'delete')+'</div><div class="btn tx" data-a="shx">'+T(st,'cancel')+'</div>'; };
SH.send=function(st,id){
  return '<h5>'+T(st,'send_to')+'</h5><div class="srch">'+ic('search')+T(st,'search')+'</div>'+CHATS.map(function(c,i){ var done=st.sentTo[id+':'+i];
    return '<div class="chat">'+(c.u?av(c.u,44):'<div class="av" style="width:44px;height:44px;font-size:18px">'+c.l+'</div>')+'<div class="t"><b>'+esc(c.n)+'</b><small>'+c.s+'</small></div><div class="btn ol sm'+(done?' done':'')+'" data-a="sendto" data-i="'+i+'" data-id="'+id+'">'+T(st,done?'sent':'send')+'</div></div>'; }).join('');
};
SH.quick=function(st,id){
  var p=getPost(st,id); if(!p) return ''; var lk=isLiked(st,p), sk=spotKey(p);
  return '<div class="qk"><div class="th '+im(p.imgs[0])+'"></div><div class="t"><b>'+p.u+'</b><span>'+(sk?spotName(st,sk):vname(st,p.v))+' · '+ago(st,p.m)+'</span><div class="x">'+(p.cap?esc(p.cap):T(st,'no_caption'))+'</div></div></div>'+
    '<div class="qrow"><div class="qb'+(lk?' on':'')+'" data-a="qlike" data-id="'+id+'">'+ic(lk?'heart-filled':'heart')+'<span>'+likeN(st,p)+'</span></div><div class="qb" data-a="comment" data-id="'+id+'">'+ic('chat')+'<span>'+cN(st,p)+'</span></div><div class="qb" data-a="send" data-id="'+id+'">'+ic('send')+'<span>'+T(st,'send')+'</span></div><div class="qb" data-a="onmap" data-id="'+id+'">'+ic('map')+'<span>'+T(st,'on_map')+'</span></div></div>'+
    '<div class="grp"><div class="o" data-a="post" data-id="'+id+'">'+ic('expand')+'<div class="t">'+T(st,'open')+'</div></div>'+(p.u===ME?'':'<div class="o" data-a="goreport">'+ic('flag')+'<div class="t">'+T(st,'report')+'</div></div>')+'</div>';
};
SH.dm=function(st){ return '<h5>'+T(st,'message')+' · @'+st.author+'</h5><div class="cbar" style="border:0;border-radius:16px;padding:8px;box-shadow:var(--sh-card)"><div class="fld"><input data-dm placeholder="…"></div><div class="snd" data-a="dmsend">'+T(st,'send')+'</div></div>'; };
SH.share=function(st){ return '<h5>'+T(st,'share')+'</h5><div class="grp">'+opt('copy-link',T(st,'copy_link'),'audan.kz/live/'+(st.sheetArg||''),'data-a="copy"')+opt('whatsapp','WhatsApp',null,'data-a="shx"')+opt('send','Telegram',null,'data-a="shx"')+opt('share',T(st,'other_apps'),null,'data-a="shx"')+'</div>'; };
SH.login=function(st){ return '<div class="hero">'+ic('user')+'<b>'+T(st,'login_t')+'</b><span>'+T(st,'login_s')+'</span></div><div class="btn pr" data-a="dologin">'+T(st,'login')+'</div><div class="btn tx" data-a="dologin">'+T(st,'signup')+'</div>'; };
SH.stk=function(st){ return '<h5>'+T(st,'stickers')+'</h5><div class="stks">'+STICKERS.map(function(s){ return '<span class="stk" data-a="pstk" data-s="'+s.id+'" style="background:'+s.bg+';color:'+s.fg+'">'+s.t+'</span>'; }).join('')+'</div>'; };
SH.gif=function(st){ return '<h5>GIF</h5><div class="srch">'+ic('search')+T(st,'gif_search')+'</div><div class="gifs">'+GIFS.map(function(g){ return '<div class="gifb '+im(g)+'" data-a="pgif" data-g="'+g+'"></div>'; }).join('')+'</div>'; };
SH.geo=function(st){ return '<div class="hero">'+ic('locate-me')+'<b>'+T(st,'geo_off_t')+'</b><span>'+T(st,'geo_off_s')+'</span></div><div class="btn pr" data-a="geoon">'+T(st,'open_settings')+'</div><div class="btn tx" data-a="shx">'+T(st,'not_now')+'</div>'; };
SH.src=function(st){ return '<div class="grp">'+opt('image',T(st,'gallery'),null,'data-a="src" data-k="gallery"')+opt('camera',T(st,'camera'),null,'data-a="src" data-k="camera"')+(st.draft.length?'':opt('video',T(st,'video30'),null,'data-a="src" data-k="video"'))+'</div>'; };
SH.cmore=function(st,a){
  var p=getPost(st,a.id), c=comments(st,p)[a.i];
  if(c.u===ME) return '<div class="grp">'+opt('trash',T(st,'delete'),null,'data-a="cdel" data-id="'+a.id+'" data-i="'+a.i+'"','dg')+'</div>';
  return '<div class="grp">'+opt('flag',T(st,'report'),null,'data-a="goreport"')+opt('block',T(st,'block_author'),'@'+c.u,'data-a="goblock" data-u="'+c.u+'"')+'</div>';
};

/* ---------------- сборка экрана ---------------- */
function html(st){
  var f=R[st.scr]||R.feed; var h=f(st);
  if(st.sheet&&SH[st.sheet]) h+=shw(st,st.sheet,SH[st.sheet](st,st.sheetArg));
  return h;
}
function isDark(st){ return st.scr==='story'||st.scr==='reels'; }
function screenClass(st){ return 'scr'+(isDark(st)?' dark':'')+(st.rm?' rm':''); }
function preset(p){ var st=newState(p); if(p&&p.dev&&!p.W){ st.W=DEV[p.dev].W; st.H=DEV[p.dev].H; } if(st.expSec!=null) st.post=st.post; return st; }
/* после вставки статичного превью: скролл, слайд карусели */
function finish(el,st){
  var app=el.querySelector('.app[data-scroll]');
  if(app&&st.scrollTo){ var t=el.querySelector('[data-pid="'+st.scrollTo+'"]'); if(t) app.scrollTop=t.offsetTop-6; }
  if(app&&st.scrollY) app.scrollTop=st.scrollY;
  Object.keys(st.slide).forEach(function(id){ el.querySelectorAll('[data-trk="'+id+'"]').forEach(function(t){ t.scrollLeft=st.slide[id]*t.clientWidth; }); });
  var cards=el.querySelector('[data-cards]'); if(cards){ var s=cards.querySelector('.mcard.sel'); if(s) cards.scrollLeft=s.offsetLeft-16; }
}

/* ======================================================================
   Живой режим (презентация)
   ====================================================================== */
function mount(el,st,hooks){
  el._st=st; el._hooks=hooks||{};
  if(!el._bound){ bind(el); el._bound=true; }
  stopTimers(el); el._freshDone=false; el._scr=null;
  render(el);
  finish(el,st); st.scrollTo=null; st.scrollY=null;
}
function render(el,keepScroll){
  var st=el._st;
  var prevScr=el._scr, app=el.querySelector('.app[data-scroll]'), sy=app?app.scrollTop:0, key=app?app.getAttribute('data-scroll'):null;
  var cards=el.querySelector('[data-cards]'), cx=cards?cards.scrollLeft:0;
  var trks={}; el.querySelectorAll('[data-trk]').forEach(function(t){ trks[t.getAttribute('data-trk')]=t.scrollLeft; });
  el.className=screenClass(st);
  el.innerHTML=html(st);
  st._anim=false;
  el._scr=st.scr;
  var app2=el.querySelector('.app[data-scroll]');
  if(app2&&keepScroll!==false&&prevScr===st.scr&&key===app2.getAttribute('data-scroll')) app2.scrollTop=sy;
  el.querySelectorAll('[data-trk]').forEach(function(t){ var id=t.getAttribute('data-trk'); if(trks[id]!=null) t.scrollLeft=trks[id]; else if(st.slide[id]) t.scrollLeft=st.slide[id]*t.clientWidth; });
  var cards2=el.querySelector('[data-cards]'); if(cards2){ if(prevScr===st.scr&&!st._cardJump) cards2.scrollLeft=cx; else { var s=cards2.querySelector('.mcard.sel'); if(s) cards2.scrollLeft=s.offsetLeft-16; } st._cardJump=false; }
  if(el._toast) el.appendChild(el._toast);
  after(el);
  if(el._hooks.onRender) el._hooks.onRender(st);
}
function go(el,scr,patch){
  var st=el._st;
  st.nav.push({scr:st.scr,post:st.post,author:st.author,story:st.story,msheet:st.msheet,sel:st.sel});
  if(st.nav.length>40) st.nav.shift();
  st.scr=scr; st.sheet=null; if(patch) for(var k in patch) st[k]=patch[k];
  stopTimers(el); render(el,false);
  var a=el.querySelector('.app[data-scroll]'); if(a&&!(patch&&patch._keep)) a.scrollTop=0;
}
function back(el){
  var st=el._st, prev=st.nav.pop();
  stopTimers(el);
  if(!prev){ st.scr='feed'; }
  else { for(var k in prev) st[k]=prev[k]; }
  st.sheet=null; render(el,false);
}
function tab(el,t){ var st=el._st; st.nav=[]; st.sheet=null; st.msheet=null; st.scr=t; stopTimers(el); render(el,false); }
function openSheet(el,kind,arg){ var st=el._st; st.sheet=kind; st.sheetArg=arg; st._anim=!st.rm; stopStory(el,true); render(el); }
function closeSheet(el){ var st=el._st; st.sheet=null; var w=el.querySelector('.shw'); if(w) w.remove(); if(st.scr==='story') resumeStory(el); }
function toast(el,msg,icn,undo){
  if(el._toast){ el._toast.remove(); clearTimeout(el._tt); }
  var st=el._st, d=dims(st), t=document.createElement('div');
  var bottomBar=(st.scr==='feed'||st.scr==='map')?TBH:(st.scr==='post'?64:0);
  t.className='toast'; t.style.bottom=(d.hb+bottomBar+12)+'px';
  t.innerHTML=ic(icn||'check-circle')+'<span>'+msg+'</span>'+(undo?'<u data-undo>'+T(st,'undo')+'</u>':'');
  if(undo) t.querySelector('[data-undo]').onclick=function(e){ e.stopPropagation(); undo(); t.remove(); el._toast=null; };
  el.appendChild(t); el._toast=t;
  el._tt=setTimeout(function(){ if(el._toast===t){ t.remove(); el._toast=null; } },2600);
}
function needLogin(el){ if(el._st.guest){ openSheet(el,'login'); return true; } return false; }

/* обновления без перерисовки — лайк, звук, счётчики */
function refreshLikes(el,id){
  var st=el._st, p=getPost(st,id), lk=isLiked(st,p);
  el.querySelectorAll('[data-a="like"][data-id="'+id+'"]').forEach(function(b){
    b.classList.toggle('on',lk); var u=b.querySelector('use'); if(u) u.setAttribute('href','#'+(lk?'heart-filled':'heart'));
    var s=b.querySelector('span'); if(s) s.textContent=likeN(st,p); else if(b.parentNode.classList.contains('rv-side')) b.lastChild.textContent=likeN(st,p);
  });
}
function like(el,id,only){
  var st=el._st; if(needLogin(el)) return;
  if(only&&st.liked[id]) return;
  st.liked[id]=!st.liked[id]; refreshLikes(el,id);
}

function bind(el){
  el.addEventListener('click',function(ev){
    var st=el._st;
    if(ev.target.classList&&ev.target.classList.contains('shw')){ closeSheet(el); return; }
    if(el._lpFired){ el._lpFired=false; return; }
    var a=ev.target.closest('[data-a]'); if(!a||!el.contains(a)) return;
    if(el._dragged){ el._dragged=false; return; }
    act(el,a.getAttribute('data-a'),a,ev);
  });
  el.addEventListener('dblclick',function(ev){ var m=ev.target.closest('[data-dbl]'); if(m) like(el,m.getAttribute('data-dbl'),true); });
  el.addEventListener('input',function(ev){
    var st=el._st, t=ev.target;
    if(t.hasAttribute('data-cin')){ var s=el.querySelector('[data-a="csend"]'); if(s) s.classList.toggle('off',!t.value.trim()); mention(el,t); }
    if(t.hasAttribute('data-gq')){ st.q=t.value; var g=el.querySelector('[data-ggrid]'); if(g) g.innerHTML=galleryGrid(st); return; }
    if(t.hasAttribute('data-cap')){ st.dcap=t.value; var n=el.querySelector('[data-capn]'); if(n) n.textContent=T(st,'chars',{n:t.value.length}); mention(el,t); }
  });
  el.addEventListener('keydown',function(ev){ if(ev.key==='Enter'&&ev.target.hasAttribute('data-cin')){ ev.preventDefault(); act(el,'csend',ev.target); } });
  el.addEventListener('focusin',function(ev){ if(ev.target.hasAttribute('data-cin')&&el._st.guest){ ev.target.blur(); openSheet(el,'login'); } });
  /* жесты: карта (пан/зум), шторка поста, сторис (тап/удержание/свайп) */
  var drag=null;
  el.addEventListener('pointerdown',function(ev){
    var st=el._st;
    if(ev.target.closest('.shw')) return;
    var grab=ev.target.closest('[data-grab]');
    if(grab){ drag={k:'sheet',y:ev.clientY,h:el.querySelector('[data-psheet]').offsetHeight}; el.setPointerCapture(ev.pointerId); return; }
    var mp=ev.target.closest('[data-map]');
    if(mp&&!ev.target.closest('.mk')){ var v=mp.hasAttribute('data-pick')?st.pview:st.view; drag={k:'map',x:ev.clientX,y:ev.clientY,vx:v.x,vy:v.y,moved:false,pick:mp.hasAttribute('data-pick')}; el.setPointerCapture(ev.pointerId); return; }
    var lp=ev.target.closest('[data-lp]');
    if(lp){ clearTimeout(el._lp); el._lp=setTimeout(function(){ el._lpFired=true; openSheet(el,'quick',lp.getAttribute('data-lp')); },450); }
    if(st.scr==='story'&&!ev.target.closest('[data-a]')){ drag={k:'story',x:ev.clientX,y:ev.clientY,t:Date.now(),tap:ev.target.closest('[data-tap]')}; stopStory(el,true); el.setPointerCapture(ev.pointerId); }
  });
  el.addEventListener('pointermove',function(ev){
    if(el._lp&&!drag) clearTimeout(el._lp);
    if(!drag) return; var st=el._st, sc=el.getBoundingClientRect().width/el.offsetWidth||1;
    if(drag.k==='map'){ var dx=(ev.clientX-drag.x)/sc, dy=(ev.clientY-drag.y)/sc; if(Math.abs(dx)+Math.abs(dy)>4) drag.moved=true; if(!drag.moved) return;
      var v=drag.pick?st.pview:st.view; v.x=drag.vx-dx/v.z; v.y=drag.vy-dy/v.z; updateMap(el); }
    if(drag.k==='sheet'){ var ps=el.querySelector('[data-psheet]'); var nh=Math.max(120,Math.min(H(st)-dims(st).sb-6-TBH-dims(st).hb,drag.h-(ev.clientY-drag.y)/sc)); ps.style.transition='none'; ps.style.height=nh+'px'; }
  });
  el.addEventListener('pointerup',function(ev){
    clearTimeout(el._lp);
    if(!drag) return; var st=el._st, dd=drag; drag=null; var sc=el.getBoundingClientRect().width/el.offsetWidth||1;
    if(dd.k==='map'&&dd.moved){ el._dragged=true; setTimeout(function(){ el._dragged=false; },50); if(dd.pick) return; renderMarkers(el); }
    if(dd.k==='sheet'){ var ps=el.querySelector('[data-psheet]'); var hh=ps.offsetHeight, half=H(st)*.5;
      st.msheet= hh<half*.62 ? null : (hh>half*1.18?'full':'half'); render(el); }
    if(dd.k==='story'){ var dy=(ev.clientY-dd.y)/sc, dx=(ev.clientX-dd.x)/sc, dt=Date.now()-dd.t;
      if(dy>90) { back(el); return; }
      if(dy<-90){ var p=curStoryPost(st); go(el,'post',{post:p.id}); return; }
      if(Math.abs(dx)>90){ nextAuthor(el,dx<0?1:-1); return; }
      if(dt<260&&dd.tap) storyStep(el,+dd.tap.getAttribute('data-tap')); else resumeStory(el); }
  });
  el.addEventListener('wheel',function(ev){
    var st=el._st, mp=ev.target.closest('[data-map]'); if(!mp) return; ev.preventDefault();
    var v=mp.hasAttribute('data-pick')?st.pview:st.view; zoom(el,v,Math.pow(1.0018,-ev.deltaY),mp.hasAttribute('data-pick'));
  },{passive:false});
}
function zoom(el,v,f,pick){ var st=el._st, s=W(st)/390; v.z=Math.max(.12*s,Math.min(1.6*s,v.z*f)); if(pick) updateMap(el); else { updateMap(el); renderMarkers(el); } }
function updateMap(el){
  var st=el._st, w=el.querySelector('[data-map] .world'); if(!w) return;
  if(st.scr==='pick'){ var g=pickGeom(st), v=st.pview; w.style.transform='translate('+(g.cx-v.x*v.z)+'px,'+(g.cy-v.y*v.z)+'px) scale('+v.z+')';
    var me=el.querySelector('.me-dot'); if(me){ me.style.left=((ME_XY[0]-v.x)*v.z+g.cx)+'px'; me.style.top=((ME_XY[1]-v.y)*v.z+g.cy)+'px'; }
    var vk=villageAt(v.x,v.y); el.querySelector('[data-pv]').textContent=vname(st,vk); el.querySelector('[data-pc]').textContent=coords(v.x,v.y)+' · '+T(st,'drag_hint');
    el.querySelector('[data-a="pickhere"]').classList.toggle('off',!vk); return; }
  w.setAttribute('style',worldTf(st,st.view));
  /* метки на время жеста сдвигаются вместе с подложкой, пересчёт кластеров — по отпусканию */
  var mk=el.querySelector('[data-map] .mks'); if(mk&&mk._base){ var dx=(mk._base.x-st.view.x)*st.view.z, dy=(mk._base.y-st.view.y)*st.view.z; if(mk._base.z===st.view.z) mk.style.transform='translate('+dx+'px,'+dy+'px)'; else renderMarkers(el); }
}
function renderMarkers(el){
  var st=el._st, mk=el.querySelector('[data-map] .mks'); if(!mk) return;
  mk.style.transform=''; mk.innerHTML=markersHTML(st,st.view); mk._base={x:st.view.x,y:st.view.y,z:st.view.z};
}
function mention(el,t){
  var old=el.querySelector('.mention'); if(old) old.remove();
  var m=t.value.slice(0,t.selectionStart).match(/@([a-z0-9_.]*)$/i); if(!m) return;
  var q=m[1].toLowerCase(), us=Object.keys(USERS).filter(function(u){ return u!==ME&&u.indexOf(q)===0&&!USERS[u].logo; }).slice(0,4);
  if(!us.length) return;
  var box=document.createElement('div'); box.className='mention';
  if(t.hasAttribute('data-cap')){ box.style.bottom='auto'; box.style.top=(t.getBoundingClientRect().bottom-el.getBoundingClientRect().top)/(el.getBoundingClientRect().width/el.offsetWidth)+8+'px'; }
  box.innerHTML=us.map(function(u){ return '<div class="o" data-mu="'+u+'">'+av(u,32)+'<div><b>'+u+'</b><br><span>'+esc(USERS[u].n)+'</span></div></div>'; }).join('');
  box.onclick=function(ev){ var o=ev.target.closest('[data-mu]'); if(!o) return; ev.stopPropagation();
    var before=t.value.slice(0,t.selectionStart).replace(/@([a-z0-9_.]*)$/i,'@'+o.getAttribute('data-mu')+' ');
    t.value=before+t.value.slice(t.selectionStart); t.dispatchEvent(new Event('input',{bubbles:true})); box.remove(); t.focus(); };
  el.appendChild(box);
}

/* ---------------- сторис: таймер ---------------- */
function curStoryPost(st){ var ps=viewerPosts(st); return ps[Math.min(st.story.pi,ps.length-1)]; }
function stopTimers(el){ stopStory(el); if(el._exp){ clearInterval(el._exp); el._exp=null; } if(el._fresh){ clearTimeout(el._fresh); el._fresh=null; } if(el._io){ el._io.disconnect(); el._io=null; } if(el._rv){ cancelAnimationFrame(el._rv); el._rv=null; } }
function stopStory(el,pause){ if(el._raf){ clearInterval(el._raf); el._raf=null; } el._paused=!!pause; }
function resumeStory(el){ var st=el._st; if(st.scr!=='story'||st.sheet) return; stopStory(el); runStory(el); }
function runStory(el){
  var st=el._st, last=Date.now();
  var p=curStoryPost(st); if(!p) return;
  var D=(p.vid?Math.min(p.vid,30):5)*1000;
  el._raf=setInterval(function(){ if(st.scr!=='story'){ clearInterval(el._raf); el._raf=null; return; }
    var now=Date.now(); st.story.t+=(now-last)/D; last=now;
    var b=el.querySelector('[data-cur]'); if(b) b.style.width=Math.min(100,st.story.t*100)+'%';
    if(st.story.t>=1){ storyStep(el,1); } },50);
}
function storyStep(el,d){
  var st=el._st, ps=viewerPosts(st), segs=storySegs(ps), i=0;
  segs.forEach(function(g,k){ if(g.pi===st.story.pi&&g.si===st.story.si) i=k; });
  i+=d;
  if(i<0){ st.story.t=0; nextAuthor(el,-1); return; }
  if(i>=segs.length){ nextAuthor(el,1); return; }
  st.story.pi=segs[i].pi; st.story.si=segs[i].si; st.story.t=0;
  stopStory(el); render(el);
}
function nextAuthor(el,d){
  var st=el._st;
  if(st.story.sp){
    var list=spots(st).map(function(x){ return x.k; }), i=list.indexOf(st.story.sp)+d;
    if(d>0){ while(i<list.length&&!spotPosts(st,list[i]).some(function(p){return !isSeen(st,p);})) i++; }
    if(i<0||i>=list.length){ stopStory(el); back(el); return; }
    st.story=startSpot(st,list[i]); stopStory(el); render(el); return;
  }
  var ul=[ME].concat(authors(st).map(function(a){return a.u;})).filter(function(u){ return storyPosts(st,u).length; });
  var j=ul.indexOf(st.story.u)+d;
  if(j<0||j>=ul.length){ stopStory(el); back(el); return; }
  st.story=startStory(st,ul[j]); stopStory(el); render(el);
}
function startSpot(st,k){ var ps=spotPosts(st,k), pi=0; for(var i=0;i<ps.length;i++){ if(!isSeen(st,ps[i])){ pi=i; break; } } return {sp:k,pi:pi,si:0,t:0}; }
function startStory(st,u){ var ps=storyPosts(st,u), pi=0; for(var i=0;i<ps.length;i++){ if(!isSeen(st,ps[i])){ pi=i; break; } } return {u:u,pi:pi,si:0,t:0}; }

/* ---------------- после рендера ---------------- */
function after(el){
  var st=el._st;
  el.querySelectorAll('[data-trk]').forEach(function(t){
    t.addEventListener('scroll',function(){ var id=t.getAttribute('data-trk'), i=Math.round(t.scrollLeft/t.clientWidth); if(st.slide[id]===i) return; st.slide[id]=i;
      el.querySelectorAll('[data-cnt="'+id+'"]').forEach(function(c){ c.textContent=(i+1)+'/'+t.children.length; });
      el.querySelectorAll('[data-dots="'+id+'"] i').forEach(function(d,k){ d.classList.toggle('on',k===i); }); },{passive:true});
  });
  if(st.scr==='story'){ var p=curStoryPost(st); if(p&&!isSeen(st,p)){ st.seen[p.id]=true; } if(!st.sheet&&!el._paused) runStory(el); else if(!st.sheet) runStory(el); }
  if(st.scr==='feed'&&!st.loading&&window.IntersectionObserver){
    var app=el.querySelector('.app[data-scroll]'), timers={};
    el._io=new IntersectionObserver(function(es){ es.forEach(function(e){ var id=e.target.getAttribute('data-pid');
      if(e.isIntersecting&&e.intersectionRatio>=.6){ timers[id]=setTimeout(function(){ if(!st.seen[id]&&!getPost(st,id).seen){ st.seen[id]=true; updRail(el); } },900); }
      else clearTimeout(timers[id]); }); },{root:app,threshold:[0,.6]});
    el.querySelectorAll('.post[data-pid]').forEach(function(a){ el._io.observe(a); });
    if(!st.fresh&&!st.freshPill&&!st.only&&!st.empty&&!el._freshDone){ el._fresh=setTimeout(function(){ if(st.scr!=='feed') return; st.freshPill=true; el._freshDone=true;
      var pill=document.createElement('div'); pill.className='newpill'; pill.setAttribute('data-a','fresh'); pill.style.top=(dims(st).sb+60)+'px'; pill.innerHTML=ic('arrow-left')+T(st,'new_posts',{n:2}); el.appendChild(pill); },14000); }
  }
  if(st.scr==='map'){ var mk=el.querySelector('[data-map] .mks'); if(mk) mk._base={x:st.view.x,y:st.view.y,z:st.view.z};
    var car=el.querySelector('[data-pcar]');
    if(car){ var n=+car.getAttribute('data-n'), on=car.querySelector('.pc.on'); var step=car.children[0].offsetWidth+8;
      if(on) car.scrollLeft=on.offsetLeft-(car.clientWidth-on.offsetWidth)/2;
      var ct;
      car.addEventListener('scroll',function(){ clearTimeout(ct); ct=setTimeout(function(){
        var i=Math.round((car.scrollLeft-(car.children[0].offsetLeft-(car.clientWidth-car.children[0].offsetWidth)/2))/step);
        if(n>1){ if(i<=0){ i=n; car.scrollLeft+=n*step; } else if(i>=n+1){ i=1; car.scrollLeft-=n*step; } }
        var c=car.children[i]; if(!c) return; var id=c.getAttribute('data-pc');
        Array.prototype.forEach.call(car.children,function(x){ x.classList.toggle('on',x===c); });
        if(id===st.sel) return; st.sel=id; var xy=pos(getPost(st,id)); st.view.x=xy[0]; st.view.y=xy[1]; updateMap(el); renderMarkers(el);
      },90); },{passive:true}); }
    var cards=el.querySelector('[data-cards]'), tm;
    if(cards) cards.addEventListener('scroll',function(){ clearTimeout(tm); tm=setTimeout(function(){
      var best=null,bd=1e9; cards.querySelectorAll('.mcard[data-id]').forEach(function(c){ var d=Math.abs(c.offsetLeft-16-cards.scrollLeft); if(d<bd){ bd=d; best=c; } });
      if(!best) return; var id=best.getAttribute('data-id'); if(id===st.sel) return;
      st.sel=id; var xy=pos(getPost(st,id)); st.view.x=xy[0]; st.view.y=xy[1];
      cards.querySelectorAll('.mcard').forEach(function(c){ c.classList.toggle('sel',c===best); });
      updateMap(el); renderMarkers(el); },140); },{passive:true});
  }
  if(st.scr==='post'){ var p2=getPost(st,st.post);
    if(p2&&!isSeen(st,p2)) st.seen[p2.id]=true;
    if(st.expSec!=null&&p2&&!isExpired(st,p2)&&!el._exp){ el._exp=setInterval(function(){
      if(st.scr!=='post'){ clearInterval(el._exp); el._exp=null; return; }
      st.expSec--; var l=el.querySelector('[data-left]'); if(l) l.textContent=leftTxt(st,0,st.expSec); var b=el.querySelector('[data-leftbar]'); if(b) b.style.width=(st.expSec/60*100/60)+'%';
      if(st.expSec<=0){ clearInterval(el._exp); el._exp=null; st.expired[p2.id]=true; st.order=null; render(el); } },1000); }
    if(st._focusCmt){ st._focusCmt=false; var i=el.querySelector('[data-cin]'); var a2=el.querySelector('.app[data-scroll]'); var cm=el.querySelector('.sec'); if(a2&&cm) a2.scrollTop=cm.offsetTop-60; if(i) setTimeout(function(){ i.focus({preventScroll:true}); },60); }
  }
  if(st.scr==='reels'){ var trk=el.querySelector('[data-reels]'), start=performance.now();
    function tick(now){ if(st.scr!=='reels'){ el._rv=null; return; } var idx=Math.round(trk.scrollTop/trk.clientHeight), it=trk.children[idx]; if(it){ var id=it.getAttribute('data-rid'), p=getPost(st,id); if(!isSeen(st,p)) st.seen[id]=true;
        var bar=it.querySelector('[data-rprog]'); if(bar&&!(st.saver&&!st.played[id])) bar.style.width=(((now-start)/1000)%p.vid)/p.vid*100+'%'; }
      el._rv=requestAnimationFrame(tick); }
    el._rv=requestAnimationFrame(tick); }
}
function updRail(el){ var st=el._st, r=el.querySelector('.rail'); if(r){ var sx=r.scrollLeft; var tmp=document.createElement('div'); tmp.innerHTML=rail(st); r.replaceWith(tmp.firstChild); el.querySelector('.rail').scrollLeft=sx; } }

/* ---------------- действия ---------------- */
function act(el,a,t,ev){
  var st=el._st, id=t.getAttribute('data-id'), u=t.getAttribute('data-u');
  switch(a){
  case 'tab': if(t.getAttribute('data-t')==='map'){ st.msheet=null; } tab(el,t.getAttribute('data-t')); break;
  case 'ext': if(el._hooks.ext) el._hooks.ext(t.getAttribute('data-s')); break;
  case 'back': back(el); break;
  case 'vil': openSheet(el,'vil'); break;
  case 'pvil': st.vil=t.getAttribute('data-v'); st.order=null; st.view=null; st.sheet=null; render(el); break;
  case 'vilset': st.vil=t.getAttribute('data-v'); st.cat='all'; st.order=null; st.view=null; tab(el,'feed'); break;
  case 'sort': openSheet(el,'sort'); break;
  case 'psort': if(t.classList.contains('off')){ closeSheet(el); openSheet(el,'geo'); break; } st.sort=t.getAttribute('data-s'); st.order=null; st.sheet=null; render(el); break;
  case 'cat': st.cat=t.getAttribute('data-c'); st.order=null; if(st.scr==='post'||st.scr==='story'){ tab(el,'feed'); } else { if(st.scr==='map'){ st.sel=null; } render(el); } break;
  case 'clearf': st.cat='all'; st.vil='all'; st.order=null; render(el); break;
  case 'time': st.time=+t.getAttribute('data-t'); st.sel=null; render(el); break;
  case 'add': if(needLogin(el)) break; st.draft=[]; st.dsel=0; st.dcat=null; st.dcap=''; st.dplace=null; st.pview=null; go(el,'add'); break;
  case 'close-add': back(el); break;
  case 'login': openSheet(el,'login'); break;
  case 'dologin': st.guest=false; st.sheet=null; render(el); if(el._hooks.onGuest) el._hooks.onGuest(false); break;
  case 'story': if(u===ME&&!storyPosts(st,ME).length){ act(el,'add',t); break; } if(!storyPosts(st,u).length){ st.author=u; go(el,'author'); break; } go(el,'story',{story:startStory(st,u)}); break;
  case 'spot': var sk=t.getAttribute('data-k'); if(!sk||!spotPosts(st,sk).length) break; st.sheet=null; go(el,'story',{story:startSpot(st,sk)}); break;
  case 'mine': if(needLogin(el)) break; go(el,'mine'); break;
  case 'who': var w=t.getAttribute('data-w'); if(w==='friends'&&needLogin(el)) break; st.who=w; st.order=null; st.sel=null; render(el); break;
  case 'mode': st.mode=t.getAttribute('data-m'); render(el); break;
  case 'follow': if(needLogin(el)) break; var fu=t.getAttribute('data-u'); if(st.follows[fu]){ delete st.follows[fu]; toast(el,T(st,'unfollowed',{u:'@'+fu}),'user'); } else { st.follows[fu]=1; toast(el,T(st,'followed',{u:'@'+fu}),'check-circle'); } st.order=null; render(el); break;
  case 'hour': var hv=t.getAttribute('data-h'); st.hour=(hv===''||st.hour===+hv)?null:+hv; st.order=null; render(el); break;
  case 'gseg': st.gseg=t.getAttribute('data-s'); render(el); break;
  case 'gclearq': st.q=''; render(el); break;
  case 'gclear': st.q=''; st.cat='all'; st.vil='all'; render(el); break;
  case 'quick': openSheet(el,'quick',id); break;
  case 'qlike': if(needLogin(el)) break; st.liked[id]=!st.liked[id]; st.sheet=null; render(el); break;
  case 'author': st.author=u; go(el,'author'); break;
  case 'post': go(el,'post',{post:id,expSec:null}); break;
  case 'comment': if(st.scr==='post'){ var i=el.querySelector('[data-cin]'); if(i) i.focus(); else if(st.guest) openSheet(el,'login'); break; } go(el,'post',{post:id,_focusCmt:!st.guest,expSec:null}); break;
  case 'expand': st.expanded[id]=true; render(el); break;
  case 'like': like(el,id); break;
  case 'snd': st.sound=!st.sound; el.querySelectorAll('[data-a="snd"] use').forEach(function(u2){ u2.setAttribute('href','#'+(st.sound?'vol-on':'vol-off')); });
    if(st.scr==='story'||st.scr==='reels'){ var hint=el.querySelector('.sp-hint[data-a="snd"]'); if(hint) hint.lastChild.textContent=T(st,st.sound?'sound_on':'sound_tap'); if(st.scr==='story') resumeStory(el); } break;
  case 'play': st.played[id]=true; render(el); break;
  case 'reels': go(el,'reels',{post:id}); break;
  case 'send': if(needLogin(el)) break; openSheet(el,'send',id); break;
  case 'sendto': if(t.classList.contains('done')) break; var k=id+':'+t.getAttribute('data-i'); st.sentTo[k]=1; st.sends[id]=(st.sends[id]||0)+1; t.classList.add('done'); t.textContent=T(st,'sent'); break;
  case 'share': openSheet(el,'share',id); break;
  case 'copy': closeSheet(el); toast(el,T(st,'link_copied'),'copy-link'); break;
  case 'shx': closeSheet(el); break;
  case 'more': openSheet(el,'more',id); break;
  case 'amore': openSheet(el,'amore'); break;
  case 'goreport': st.sheet=null; openSheet(el,'report'); break;
  case 'rsn': t.parentNode.querySelectorAll('.o').forEach(function(o){ o.classList.toggle('on',o===t); }); el.querySelector('[data-a="rsend"]').classList.remove('off'); break;
  case 'rsend': if(t.classList.contains('off')) break; closeSheet(el); toast(el,T(st,'report_done'),'flag'); break;
  case 'goblock': if(needLogin(el)) break; st.sheet=null; openSheet(el,'block',u); break;
  case 'blockok': st.blocked[u]=1; st.order=null; st.sheet=null;
    if((st.scr==='post'&&getPost(st,st.post).u===u)||(st.scr==='author'&&st.author===u)||(st.scr==='story'&&st.story.u===u)) back(el); else render(el);
    toast(el,T(st,'blocked',{u:'@'+u}),'block',function(){ delete st.blocked[u]; st.order=null; render(el); }); break;
  case 'godel': st.sheet=null; openSheet(el,'del',id); break;
  case 'delok': var p=getPost(st,id); st.deleted[id]=1; st.order=null; st.sheet=null;
    if(p.m<=NOW_MIN){ var ix=st.used.indexOf('u'); if(ix>=0) st.used[ix]='d'; }
    if(st.scr==='post'||st.scr==='story') back(el); else render(el); toast(el,T(st,'deleted'),'trash'); break;
  case 'onmap': var q=getPost(st,id); var xy=pos(q); st.sel=id; st.cat='all'; st.vil='all'; st.time=24; st.view={x:xy[0],y:xy[1],z:(q.v==='shu'?.62:.95)*W(st)/390}; st.msheet=null; st._cardJump=true; stopTimers(el); st.nav=[]; st.scr='map'; st.sheet=null; render(el,false); break;
  case 'fresh': st.fresh=true; st.freshPill=false; st.order=null; var pl=el.querySelector('.newpill'); if(pl) pl.remove(); render(el); var ap=el.querySelector('.app[data-scroll]'); if(ap) ap.scrollTop=0; break;
  /* карта */
  case 'mk': st.sel=id; st._cardJump=true; st.msheet='half'; render(el); break;
  case 'mksel': st.sel=id; st._cardJump=true; renderMarkers(el); var cards=el.querySelector('[data-cards]'); if(cards){ var c=cards.querySelector('.mcard[data-id="'+id+'"]'); cards.querySelectorAll('.mcard').forEach(function(x){ x.classList.toggle('sel',x===c); }); if(c) cards.scrollLeft=c.offsetLeft-16; } break;
  case 'cl': var xy2=pos(getPost(st,id)); st.view.x=xy2[0]; st.view.y=xy2[1]; zoom(el,st.view,2.2); break;
  case 'card': st.sel=id; st._cardJump=true; st.msheet='half'; render(el); break;
  case 'psx': st.msheet=null; render(el); break;
  case 'zin': zoom(el,st.view,1.5); break;
  case 'zout': zoom(el,st.view,1/1.5); break;
  case 'locate': if(!st.geo){ openSheet(el,'geo'); break; } st.view.x=ME_XY[0]; st.view.y=ME_XY[1]; st.view.z=Math.max(st.view.z,.62*W(st)/390); updateMap(el); renderMarkers(el); break;
  case 'geoon': st.geo=true; st.sheet=null; render(el); if(el._hooks.onGeo) el._hooks.onGeo(true); break;
  /* комментарии */
  case 'csend': var inp=el.querySelector('[data-cin]'); if(!inp||!inp.value.trim()) break; addComment(el,{x:inp.value.trim()}); break;
  case 'clike': if(needLogin(el)) break; var ck=t.getAttribute('data-k'); st.cliked[ck]=!st.cliked[ck]; var cp=getPost(st,ck.split(':')[0]), cc=comments(st,cp)[+ck.split(':')[1]];
    t.classList.toggle('on',!!st.cliked[ck]); t.querySelector('use').setAttribute('href','#'+(st.cliked[ck]?'heart-filled':'heart')); t.querySelector('span').textContent=((cc.l||0)+(st.cliked[ck]?1:0))||''; break;
  case 'cmore': openSheet(el,'cmore',{id:id,i:+t.getAttribute('data-i')}); break;
  case 'cdel': comments(st,getPost(st,id)).splice(+t.getAttribute('data-i'),1); st.sheet=null; render(el); break;
  case 'reply': if(needLogin(el)) break; var ri=el.querySelector('[data-cin]'); if(ri){ ri.value='@'+u+' '; ri.focus(); ri.dispatchEvent(new Event('input',{bubbles:true})); } break;
  case 'stk': if(needLogin(el)) break; openSheet(el,'stk'); break;
  case 'gif': if(needLogin(el)) break; openSheet(el,'gif'); break;
  case 'pstk': st.sheet=null; addComment(el,{s:t.getAttribute('data-s')}); break;
  case 'pgif': st.sheet=null; addComment(el,{g:t.getAttribute('data-g')}); break;
  case 'dm': if(needLogin(el)) break; openSheet(el,'dm'); setTimeout(function(){ var i=el.querySelector('[data-dm]'); if(i) i.focus(); },320); break;
  case 'dmsend': closeSheet(el); toast(el,T(st,'sent'),'send'); break;
  /* мои */
  case 'seg': st.mine=t.getAttribute('data-s'); render(el); break;
  /* добавление */
  case 'src': var kk=t.getAttribute('data-k'); st.sheet=null;
    if(kk==='more'){ openSheet(el,'src'); break; }
    if(kk==='video'){ st.draft=[{img:'lv-boydombra',vid:27}]; st.dplace=[1245,1215]; st.dplaceAuto=true; }
    else if(kk==='camera'){ if(st.draft.length<10) st.draft.push({img:'lv-street'}); if(!st.dplace){ st.dplace=st.geo?ME_XY.slice():null; st.dplaceAuto=st.geo; } }
    else { var add=GALLERY.filter(function(g){ return !st.draft.some(function(d){return d.img===g;}); }).slice(0,st.draft.length?1:3); add.forEach(function(g){ if(st.draft.length<10) st.draft.push({img:g}); }); if(!st.dplace){ st.dplace=[1290,1530]; st.dplaceAuto=true; } }
    st.dsel=st.draft.length-1; render(el); break;
  case 'thumb': var ti=+t.getAttribute('data-i'); if(ti===st.dsel&&ti>0){ st.draft.unshift(st.draft.splice(ti,1)[0]); st.dsel=0; } else st.dsel=ti; render(el); break;
  case 'rm': ev.stopPropagation(); st.draft.splice(+t.getAttribute('data-i'),1); st.dsel=Math.max(0,Math.min(st.dsel,st.draft.length-1)); if(!st.draft.length){ st.dplace=null; } render(el); break;
  case 'next': if(!st.draft.length) break; go(el,'adddet'); break;
  case 'dcat': st.dcat=t.getAttribute('data-c'); render(el); break;
  case 'pickplace': st.pview=null; go(el,'pick'); break;
  case 'pme': if(!st.geo){ openSheet(el,'geo'); break; } st.pview.x=ME_XY[0]; st.pview.y=ME_XY[1]; updateMap(el); break;
  case 'pickhere': if(t.classList.contains('off')) break; st.dplace=[st.pview.x,st.pview.y]; st.dplaceAuto=false; back(el); break;
  case 'publish': if(t.classList.contains('off')){ toast(el,T(st,st.dcat?'pick_place':'cat'),'info'); break; } publish(el); break;
  }
}
function addComment(el,c){
  var st=el._st, p=getPost(st,st.post); if(needLogin(el)) return;
  c.u=ME; c.m=0; c.l=0; comments(st,p).push(c); st.sheet=null; render(el);
  var a=el.querySelector('.app[data-scroll]'); if(a) a.scrollTop=a.scrollHeight;
}
var _n=0;
function publish(el){
  var st=el._st; _n++;
  var p={id:'n'+_n,u:ME,c:st.dcat,v:villageAt(st.dplace[0],st.dplace[1])||'shu',imgs:st.draft.map(function(d){return d.img;}),cap:st.dcap,l:0,vw:0,s:0,m:0,seen:true,vid:st.draft[0].vid||0,at:st.dplace.slice(),demo:false,fresh:false};
  st.added.unshift(p); st.justPosted.push(p.id); st.used.push('u'); st.order=null;
  st.draft=[]; st.dcap=''; st.dcat=null; st.dplace=null; st.nav=[]; st.scr='feed'; st.cat='all'; st.vil='all'; stopTimers(el); render(el,false);
  toast(el,T(st,'published'),'check-circle');
}

return { html:function(p){ var st=preset(p); return html(st); }, state:preset, klass:function(p){ return screenClass(preset(p)); },
  finish:function(el,p){ finish(el,preset(p)); }, mount:mount, render:render, T:T, DEV:DEV };
})();
