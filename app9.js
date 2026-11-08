(function(){
'use strict';
var K=window.K;
if(!K||!K.views||!K.views.home)return;
var esc=K.esc;
var st=document.createElement('style');
st.textContent=[
'.bnr{padding:14px 0 6px}',
'.bnw{display:grid;grid-template-columns:1fr;gap:18px;align-items:center}',
'.bt h1{font-size:32px;line-height:1.1;margin:0 0 10px;font-weight:800;color:#0b0f1a}',
'.bt p{color:#4b5563;margin:0 0 18px;max-width:420px}',
'.bv{position:relative;height:280px;touch-action:pan-y;user-select:none;-webkit-user-select:none}',
'.arc{position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;border-radius:140px 28px 28px 28px;background:linear-gradient(145deg,#0f172a 0%,#1b3a9a 48%,#6fa3ff 100%)}',
'.arc::before{content:"";position:absolute;left:22px;bottom:26px;width:54px;height:54px;border:3px solid rgba(255,201,51,.65);border-radius:50%}',
'.sl img{position:absolute;top:46px;right:26px;bottom:38px;left:46px;width:calc(100% - 72px);height:calc(100% - 84px);object-fit:contain;background:#fff;border-radius:24px;box-shadow:0 10px 24px rgba(0,0,0,.28);opacity:0;transform:translateX(16px) scale(1.04);transition:opacity 1.1s ease,transform 1.8s cubic-bezier(.2,.7,.2,1)}',
'.sl img.k{top:0;left:0;right:0;bottom:0;width:100%;height:100%;box-sizing:border-box;padding:16px 12px 0;object-position:center bottom;background:none;border-radius:0;box-shadow:none;filter:drop-shadow(0 14px 18px rgba(0,0,0,.35))}',
'.sl img.on{opacity:1;transform:none}',
'.sl img.pv{transform:translateX(-16px) scale(1.01)}',
'.dt{position:absolute;left:0;right:0;bottom:10px;display:flex;justify-content:center;gap:6px;pointer-events:none}',
'.dt i{width:6px;height:6px;border-radius:3px;background:rgba(255,255,255,.45);transition:width .4s,background .4s}',
'.dt i.on{width:18px;background:#ffc933}',
'@media(min-width:760px){.bnw{grid-template-columns:1fr 1fr;gap:32px}.bv{height:360px}.bt h1{font-size:44px}}',
'@media(prefers-reduced-motion:reduce){.sl img{transition:opacity .3s}}',
'.hrow .card,.grid .card{border-radius:18px;overflow:hidden}',
'.card .ph{overflow:hidden}',
'.card .ph img{transition:transform .5s ease}',
'.card:active .ph img{transform:scale(1.06)}',
'@media(hover:hover){.card:hover .ph img{transform:scale(1.06)}}',
'@keyframes cz{from{transform:scale(.94);opacity:.65}to{transform:none;opacity:1}}',
'@supports(animation-timeline:view()){.hrow .card{animation:cz linear both;animation-timeline:view(inline);animation-range:entry 0% cover 35%}}'
].join('');
document.head.appendChild(st);

function cv(k,d){var v=K.cfg[k];return v==null||v===''?d:v;}
function photos(){
  var v=K.cfg.banner_photos,a=[];
  try{a=typeof v==='string'?JSON.parse(v):(Array.isArray(v)?v:[]);}catch(e){a=[];}
  a=(a||[]).filter(function(x){return x&&x.u;});
  if(!a.length){
    a=K.state.products.filter(function(p){return p.visible&&K.images(p).length;}).slice(0,5)
      .map(function(p){return{u:K.cover(p),k:0};});
  }
  return a;
}
function run(n,auto){
  var bv=document.getElementById('bv');
  if(!bv)return;
  var im=bv.querySelectorAll('.sl img'),dt=bv.querySelectorAll('.dt i'),c=0,t,x0=null;
  function show(j){
    j=(j+n)%n;
    if(j===c)return;
    var o=im[c],x=im[j];
    x.style.transition='none';
    x.classList.remove('pv');
    void x.offsetWidth;
    x.style.transition='';
    o.classList.remove('on');o.classList.add('pv');o.setAttribute('aria-hidden','true');
    x.classList.add('on');x.removeAttribute('aria-hidden');
    dt[c].classList.remove('on');dt[j].classList.add('on');
    c=j;
  }
  function arm(){
    clearInterval(t);
    if(auto&&n>1)t=setInterval(function(){
      if(!document.getElementById('bv')){clearInterval(t);return;}
      if(!document.hidden)show(c+1);
    },5000);
  }
  bv.addEventListener('pointerdown',function(e){x0=e.clientX;});
  bv.addEventListener('pointerup',function(e){
    if(x0==null)return;
    var d=e.clientX-x0;x0=null;
    if(Math.abs(d)>40){show(c+(d<0?1:-1));arm();}
  });
  bv.addEventListener('pointercancel',function(){x0=null;});
  arm();
}
var home0=K.views.home;
K.views.home=function(app,a){
  home0(app,a);
  var s=document.getElementById('hero');
  if(!s)return;
  if(cv('banner_on','1')==='0'){s.className='';s.innerHTML='';return;}
  var p=photos(),n=p.length;
  var im=p.map(function(x,i){
    return'<img class="'+(x.k?'k ':'')+(i?'':'on')+'" src="'+esc(x.u)+'" alt="Produit KBZ SHOP" decoding="async" draggable="false"'+(i?' loading="lazy" aria-hidden="true"':' fetchpriority="high"')+'>';
  }).join('');
  var dots='';
  if(n>1)for(var i=0;i<n;i++)dots+='<i'+(i?'':' class="on"')+'></i>';
  s.className='bnr';
  s.innerHTML='<div class="wrap bnw"><div class="bt"><h1>'+esc(cv('banner_title','Ton style, ton choix.'))+'</h1><p>'+esc(cv('banner_text','Découvre notre sélection de vêtements et d\'accessoires tendance.'))+'</p><button class="b1" data-bl="'+esc(cv('banner_link','#cat'))+'">'+esc(cv('banner_btn','Découvrir la boutique'))+'</button></div>'+
    '<div class="bv" id="bv" role="group" aria-roledescription="carrousel" aria-label="Sélection KBZ SHOP"><div class="arc"><div class="sl">'+im+'</div><div class="dt">'+dots+'</div></div></div></div>';
  var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  run(n,cv('banner_auto','1')!=='0'&&!rm);
};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-bl]');
  if(!b)return;
  var l=b.getAttribute('data-bl')||'#cat';
  if(/^https?:/.test(l))window.open(l,'_blank','noopener');
  else if(l.charAt(0)==='#'){
    var t=document.getElementById(l.slice(1));
    if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  }else K.go(l);
});
})();
// FIN app9.js
