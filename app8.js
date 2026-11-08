(function(){
'use strict';
var K=window.K;
if(!K)return;
var esc=K.esc;
var ORDER=['Maillots','Vêtements','Chaussures','Accessoires','Autres'];
var PER=6;
K.CATS=ORDER.slice();

var st=document.createElement('style');
st.textContent=
'#app{overflow-x:clip}'+
'.sec h2{font-size:26px;font-weight:800;margin-bottom:14px}'+
'.crow{display:flex;justify-content:space-between;align-items:center;margin:24px 0 8px}'+
'.crow h2{margin:0}'+
'.crow button{background:none;border:0;color:#2447e5;font-weight:700;font-size:14px;cursor:pointer;padding:8px 0}'+
'.hrow{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding:4px 2px 12px;-webkit-overflow-scrolling:touch}'+
'.hrow .card{flex:0 0 160px;min-width:0;scroll-snap-align:start}'+
'.hrow .more{flex:0 0 110px;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;text-align:center;background:none;border:2px dashed #2447e5;border-radius:14px;color:#2447e5;font-weight:700;font-size:14px;padding:10px;cursor:pointer}'+
'.sbar{margin:6px 0 10px}'+
'.ctiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}'+
'.ctile{border:0;padding:0;border-radius:14px;overflow:hidden;background:rgba(127,127,127,.14);text-align:center;cursor:pointer;color:inherit}'+
'.ctile img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}'+
'.ctile b{display:block;padding:8px 6px 2px}'+
'.ctile span{display:block;padding-bottom:10px;font-size:13px;opacity:.7}'+
'.ask h2{color:#fff;margin-bottom:6px}'+
'.sec .ask{background:#0f172a;background-image:none}'+
'.hero2{background:#f4f7ff;padding:34px 0 30px;text-align:center}'+
'.lg{position:relative;display:inline-block;overflow:hidden;padding:6px 20px}'+
'.lg .k{display:flex;justify-content:center;font-size:76px;font-weight:900;line-height:1;color:#2447e5;letter-spacing:4px}'+
'.lg .k span{opacity:0;transform:translateY(14px);animation:kU .5s ease forwards}'+
'.lg .k span:nth-child(2){animation-delay:.15s}'+
'.lg .k span:nth-child(3){animation-delay:.3s}'+
'.lg .s{margin-top:4px;padding-left:10px;font-size:22px;font-weight:800;letter-spacing:10px;color:#0f172a;opacity:0;animation:kF .4s ease .5s forwards}'+
'.lg .sh{position:absolute;top:0;left:0;width:45%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.85),transparent);transform:translateX(-120%) skewX(-18deg);animation:kS .9s ease .6s forwards}'+
'.hero2 .tg{margin-top:8px;color:#5b6478;font-size:14px;font-weight:600;opacity:0;animation:kF .5s ease .95s forwards}'+
'.hero2 h1{font-size:28px;line-height:1.15;margin:22px 0 10px;font-weight:800;color:#0f172a}'+
'.hero2 p.hp{color:#5b6478;margin:0 auto 20px;max-width:420px}'+
'.hbt{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'+
'.b1,.b2{border-radius:999px;padding:14px 24px;font-weight:700;font-size:16px;cursor:pointer}'+
'.b1{background:#2447e5;color:#fff;border:2px solid #2447e5}'+
'.b2{background:#fff;color:#2447e5;border:2px solid #2447e5}'+
'.b1:active,.b2:active{transform:scale(.95)}'+
'.hero2.nm *{animation:none!important;opacity:1!important;transform:none!important}'+
'.hero2.nm .sh{display:none}'+
'@keyframes kU{to{opacity:1;transform:none}}'+
'@keyframes kF{to{opacity:1}}'+
'@keyframes kS{to{transform:translateX(320%) skewX(-18deg)}}'+
'@media(prefers-reduced-motion:reduce){.hero2 *{animation:none!important;opacity:1!important;transform:none!important}.hero2 .sh{display:none}}';
document.head.appendChild(st);

function vis(){return K.state.products.filter(function(p){return p.visible;});}
function nz(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function cnt(n){return n+' article'+(n>1?'s':'')+' trouvé'+(n>1?'s':'');}

function card(p){
  var s=K.stock(p),nm=esc(p.name);
  var old=(p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
  var badge=s<1?'<span class="soldout">Épuisé</span>':(s<=5?'<span class="low">Plus que '+s+'</span>':'');
  return '<div class="card"><a href="#produit" data-go="product" data-arg="'+p.id+'" style="display:block;color:inherit;text-decoration:none"><div class="ph">'+badge+'<img loading="lazy" src="'+esc(K.cover(p))+'" alt="'+nm+'"></div><div class="in" style="padding-bottom:0"><div class="cat">'+esc(p.category)+'</div><div style="font-size:16px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nm+'</div><div class="mut dsc">'+esc((p.description||'').split('\n')[0])+'</div><div class="price">'+K.fmt(K.price(p))+old+'</div></div></a><div style="padding:0 14px 16px"><button class="btn full addb" data-add="'+p.id+'" aria-label="Ajouter au panier : '+nm+'"'+(s<1?' disabled':'')+'>+ Ajouter</button></div></div>';
}
function quick(id){
  var p=K.state.products.filter(function(x){return x.id===id;})[0];
  if(!p)return;
  var vs=(p.product_variants||[]).filter(function(v){return v.stock>0;});
  if(vs.length!==1){K.go('product',id);return;}
  var v=vs[0],ex=K.cart.filter(function(i){return i.variant_id===v.id;})[0];
  if(ex&&ex.qty+1>v.stock){K.toast('Stock maximum atteint',1);return;}
  if(ex){ex.qty++;ex.max=v.stock;}
  else{
    var im=K.images(p,v.color||null);
    K.cart.push({variant_id:v.id,product_id:p.id,name:p.name,color:v.color,size:v.size,
      price:K.price(p,v),qty:1,image:im.length?im[0].url:K.PH,max:v.stock});
  }
  K.saveCart();
  K.toast('Ajouté au panier ✓');
}
function clicks(e){
  var b=e.target.closest('[data-add]');
  if(b){quick(b.getAttribute('data-add'));return;}
  var s=e.target.closest('[data-scroll]');
  if(s){
    var t=document.getElementById(s.getAttribute('data-scroll'));
    if(t)t.scrollIntoView({behavior:'smooth',block:'start'});
  }
}

function groups(){
  var by={};
  vis().forEach(function(p){
    var c=p.category||'Autres';
    (by[c]=by[c]||[]).push(p);
  });
  var names=ORDER.slice();
  names.forEach(function(c){if(!by[c])by[c]=[];});
  Object.keys(by).forEach(function(c){if(names.indexOf(c)<0)names.push(c);});
  return {by:by,names:names};
}

/* Accueil : logo anime, une rangee par categorie + recherche */
K.views.home=function(app){
  var g=groups(),phone=K.cfg.phone||'',wa=K.cfg.whatsapp||'';
  var seen=false;
  try{seen=sessionStorage.getItem('kbz_intro')==='1';sessionStorage.setItem('kbz_intro','1');}catch(e){}
  var h='<section class="hero2'+(seen?' nm':'')+'"><div class="wrap"><div class="lg" role="img" aria-label="'+esc(K.cfg.shop_name||'KBZ SHOP')+'"><div class="k" aria-hidden="true"><span>K</span><span>B</span><span>Z</span></div><div class="s" aria-hidden="true">SHOP</div><span class="sh" aria-hidden="true"></span></div>'+
    '<div class="tg">'+esc(K.cfg.slogan||'Ton style, ton choix.')+'</div>'+
    '<h1>L\'élégance urbaine à Abidjan</h1><p class="hp">Maillots, vêtements, chaussures et accessoires tendance. Commandez en quelques clics, on vous livre.</p>'+
    '<div class="hbt"><button class="b1" data-scroll="cat">Découvrir la boutique</button><button class="b2" data-go="cats">Voir les catégories</button></div></div></section>'+
    '<section class="sec" id="cat"><div class="wrap"><div class="sbar"><label for="q" class="sr">Rechercher un article</label><input id="q" placeholder="Rechercher un article..." autocomplete="off"></div><p class="sr" id="rs" role="status"></p><div id="rows">';
  g.names.forEach(function(c){
    var l=g.by[c],n=esc(c);
    if(!l.length){
      h+='<div class="crow"><h2>'+n+'</h2></div><p class="mut" style="margin:0 0 8px">Bientôt disponible</p>';
      return;
    }
    h+='<div class="crow"><h2>'+n+'</h2><button data-go="cat" data-arg="'+n+'" aria-label="Voir tous les articles : '+n+'">Voir plus <span aria-hidden="true">→</span></button></div><div class="hrow" role="region" aria-label="'+n+', liste défilante">'+l.slice(0,PER).map(card).join('');
    if(l.length>PER)h+='<button class="more" data-go="cat" data-arg="'+n+'">Voir plus<br>('+(l.length-PER)+' autres)</button>';
    h+='</div>';
  });
  h+='</div><div id="res" style="display:none"></div></div></section>'+
  '<section class="sec"><div class="wrap"><div class="ask"><h2>Une question ?</h2><p>Écris-nous, nous te répondons avec plaisir.</p><a class="askr" target="_blank" rel="noopener" href="https://wa.me/'+esc(wa)+'"><small>WhatsApp<span class="sr"> (s\'ouvre dans WhatsApp)</span></small><b>'+esc(phone)+'</b></a>'+(K.cfg.email?'<a class="askr" href="mailto:'+esc(K.cfg.email)+'"><small>E-mail</small><b>'+esc(K.cfg.email)+'</b></a>':'')+(K.cfg.address?'<div class="askr"><small>Adresse</small><b>'+esc(K.cfg.address)+'</b></div>':'')+'</div></div></section>';
  app.innerHTML=h;
  var q=document.getElementById('q'),rows=document.getElementById('rows'),res=document.getElementById('res'),rs=document.getElementById('rs');
  q.oninput=function(){
    var s=nz(q.value).trim();
    if(!s){rows.style.display='';res.style.display='none';rs.textContent='';return;}
    var r=vis().filter(function(p){return nz(p.name+' '+p.category+' '+(p.description||'')).indexOf(s)>=0;});
    rows.style.display='none';res.style.display='';
    res.innerHTML=r.length?'<div class="grid">'+r.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">Aucun article trouvé.</p>';
    rs.textContent=r.length?cnt(r.length):'Aucun article trouvé';
  };
  app.onclick=clicks;
};

/* Toute la gamme d'une categorie, avec recherche */
K.views.cat=function(app,name){
  var all=vis().filter(function(p){return(p.category||'Autres')===name;});
  app.innerHTML='<section class="sec"><div class="wrap"><button class="mut" data-go="home" style="margin:6px 0 12px"><span aria-hidden="true">←</span> Retour à l\'accueil</button>'+
    '<h1 style="font-size:26px;font-weight:800;margin-bottom:14px">'+esc(name)+' <span class="mut" style="font-size:14px">('+all.length+')</span></h1>'+
    (all.length?'<div class="sbar"><label for="q2" class="sr">Rechercher dans '+esc(name)+'</label><input id="q2" placeholder="Rechercher dans '+esc(name)+'..." autocomplete="off"></div><p class="sr" id="rs2" role="status"></p>':'')+
    '<div id="list"></div></div></section>';
  var q=document.getElementById('q2'),list=document.getElementById('list'),rs=document.getElementById('rs2');
  function draw(){
    var s=q?nz(q.value).trim():'';
    var r=all.filter(function(p){return !s||nz(p.name+' '+(p.description||'')).indexOf(s)>=0;});
    list.innerHTML=r.length?'<div class="grid">'+r.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">'+(all.length?'Aucun article trouvé.':'Bientôt disponible.')+'</p>';
    if(rs)rs.textContent=s?(r.length?cnt(r.length):'Aucun article trouvé'):'';
  }
  if(q)q.oninput=draw;
  app.onclick=clicks;
  draw();
};

/* Page Categories */
K.views.cats=function(app){
  app.onclick=null;
  var g=groups();
  var h='<section class="sec"><div class="wrap"><button class="mut" data-go="home" style="margin:6px 0 12px"><span aria-hidden="true">←</span> Retour à l\'accueil</button><h1 style="font-size:26px;font-weight:800;margin-bottom:14px">Catégories</h1><div class="ctiles">';
  g.names.forEach(function(c){
    var l=g.by[c],n=esc(c);
    h+='<button class="ctile" data-go="cat" data-arg="'+n+'"><img loading="lazy" src="'+esc(l.length?K.cover(l[0]):K.PH)+'" alt=""><b>'+n+'</b><span>'+(l.length?l.length+' article'+(l.length>1?'s':''):'Bientôt disponible')+'</span></button>';
  });
  h+='</div></div></section>';
  app.innerHTML=h;
};
})();
// FIN app8.js
