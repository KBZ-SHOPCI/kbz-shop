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
'.sbar{position:relative;margin:12px 0 10px}'+
'.sbar input{width:100%;padding:13px 16px 13px 46px;border:1px solid #e1e6f0;border-radius:999px;background:#f4f6fb;font-size:16px;color:#0f172a}'+
'.sbar svg{position:absolute;left:16px;top:50%;margin-top:-10px;width:20px;height:20px;fill:none;stroke:#5b6478;stroke-width:2;stroke-linecap:round;pointer-events:none}'+
'.ctiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}'+
'.ctile{border:0;padding:0;border-radius:14px;overflow:hidden;background:rgba(127,127,127,.14);text-align:center;cursor:pointer;color:inherit}'+
'.ctile img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}'+
'.ctile b{display:block;padding:8px 6px 2px}'+
'.ctile span{display:block;padding-bottom:10px;font-size:13px;opacity:.7}'+
'.hero2{background:#f4f7ff;padding:26px 0 24px;text-align:center}'+
'.hero2 h1{font-size:28px;line-height:1.15;margin:0 0 10px;font-weight:800;color:#0f172a}'+
'.hero2 p.hp{color:#5b6478;margin:0 auto 18px;max-width:420px}'+
'.b1{background:#2447e5;color:#fff;border:0;border-radius:999px;padding:14px 26px;font-weight:700;font-size:16px;cursor:pointer}'+
'.b1:active{transform:scale(.95)}';
document.head.appendChild(st);

var SI='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
function sb(id,lb,ph){return'<div class="sbar"><label for="'+id+'" class="sr">'+lb+'</label>'+SI+'<input id="'+id+'" placeholder="'+ph+'" autocomplete="off"></div>';}
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

/* Accueil : recherche sous l'en-tete, une rangee par categorie */
K.views.home=function(app){
  var g=groups();
  var h='<div class="wrap">'+sb('q','Rechercher un article','Rechercher un article...')+'</div><p class="sr" id="rs" role="status"></p>'+
    '<section class="hero2" id="hero"><div class="wrap"><h1>L\'élégance urbaine à Abidjan</h1><p class="hp">Maillots, vêtements, chaussures et accessoires tendance. Commandez en quelques clics, on vous livre.</p><button class="b1" data-scroll="cat">Découvrir la boutique</button></div></section>'+
    '<section class="sec" id="cat"><div class="wrap"><div id="rows">';
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
  h+='</div><div id="res" style="display:none"></div></div></section>';
  app.innerHTML=h;
  var q=document.getElementById('q'),rows=document.getElementById('rows'),res=document.getElementById('res'),rs=document.getElementById('rs'),hero=document.getElementById('hero');
  q.oninput=function(){
    var s=nz(q.value).trim();
    hero.style.display=s?'none':'';
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
    (all.length?sb('q2','Rechercher dans '+esc(name),'Rechercher dans '+esc(name)+'...')+'<p class="sr" id="rs2" role="status"></p>':'')+
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
