(function(){
'use strict';
var K=window.K,esc=K.esc;
if(!K)return;
var ORDER=['Maillots','Vêtements','Chaussures','Accessoires','Autres'];
var PER=6;
K.CATS=ORDER.slice();

var st=document.createElement('style');
st.textContent=
'#app{overflow-x:clip}'+
'.crow{display:flex;justify-content:space-between;align-items:center;margin:24px 0 8px}'+
'.crow h3{margin:0}'+
'.crow button{background:none;border:0;color:#2447e5;font-weight:700;font-size:14px;cursor:pointer}'+
'.hrow{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding:4px 2px 12px;-webkit-overflow-scrolling:touch}'+
'.hrow .card{flex:0 0 160px;min-width:0;scroll-snap-align:start}'+
'.hrow .more{flex:0 0 110px;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;text-align:center;background:none;border:2px dashed #2447e5;border-radius:14px;color:#2447e5;font-weight:700;font-size:14px;padding:10px;cursor:pointer}'+
'.sbar{margin:6px 0 10px}'+
'.ctiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}'+
'.ctile{border:0;padding:0;border-radius:14px;overflow:hidden;background:rgba(127,127,127,.14);text-align:center;cursor:pointer;color:inherit}'+
'.ctile img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}'+
'.ctile b{display:block;padding:8px 6px 2px}'+
'.ctile span{display:block;padding-bottom:10px;font-size:13px;opacity:.7}';
document.head.appendChild(st);

function vis(){return K.state.products.filter(function(p){return p.visible;});}
function nz(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function toCat(){var e=document.getElementById('cat');if(e)e.scrollIntoView({behavior:'smooth'});}

function card(p){
  var s=K.stock(p);
  var old=(p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
  var badge=s<1?'<span class="soldout">Épuisé</span>':(s<=5?'<span class="low">Plus que '+s+'</span>':'');
  return '<div class="card" data-pid="'+p.id+'"><div class="ph">'+badge+'<img loading="lazy" src="'+esc(K.cover(p))+'" alt=""></div><div class="in"><div class="cat">'+esc(p.category)+'</div><h4>'+esc(p.name)+'</h4><div class="mut dsc">'+esc((p.description||'').split('\n')[0])+'</div><div class="price">'+K.fmt(K.price(p))+old+'</div><button class="btn full addb" data-add="'+p.id+'"'+(s<1?' disabled':'')+'>+ Ajouter</button></div></div>';
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
  var t=e.target,b;
  if((b=t.closest('[data-add]'))){quick(b.getAttribute('data-add'));return;}
  if((b=t.closest('[data-pid]'))){K.go('product',b.getAttribute('data-pid'));}
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

/* Accueil : une rangee par categorie + recherche */
K.views.home=function(app){
  var g=groups(),phone=K.cfg.phone||'',wa=K.cfg.whatsapp||'';
  var h='<section class="hero"><div class="wrap"><span class="tag">'+esc(K.cfg.slogan||'')+'</span><h2>L\'élégance urbaine à Abidjan</h2><p>Maillots, vêtements, chaussures et accessoires tendance. Commandez en quelques clics, on vous livre.</p><button class="btn" data-go="cats">Voir les catégories</button></div></section>'+
    '<section class="sec" id="cat"><div class="wrap"><div class="sbar"><input id="q" placeholder="Rechercher un article..."></div><div id="rows">';
  g.names.forEach(function(c){
    var l=g.by[c],n=esc(c);
    if(!l.length){
      h+='<div class="crow"><h3>'+n+'</h3></div><p class="mut" style="margin:0 0 8px">Bientôt disponible</p>';
      return;
    }
    h+='<div class="crow"><h3>'+n+'</h3><button data-go="cat" data-arg="'+n+'">Voir plus →</button></div><div class="hrow">'+l.slice(0,PER).map(card).join('');
    if(l.length>PER)h+='<button class="more" data-go="cat" data-arg="'+n+'">Voir plus<br>('+(l.length-PER)+' autres)</button>';
    h+='</div>';
  });
  h+='</div><div id="res" style="display:none"></div></div></section>'+
  '<section class="sec"><div class="wrap"><h3>Comment commander</h3><p class="mut" style="margin:-6px 0 14px">Simple et rapide, en trois étapes.</p><div class="step"><span class="num">1</span><div><b>Choisis tes articles</b><span class="mut">Parcours la boutique et trouve ce qui te plaît.</span></div></div><div class="step"><span class="num">2</span><div><b>Ajoute-les au panier</b><span class="mut">Modifie les quantités et vérifie le total.</span></div></div><div class="step"><span class="num">3</span><div><b>Confirme sur WhatsApp</b><span class="mut">Ta commande arrive au vendeur, qui la confirme avec toi.</span></div></div>'+
  '<div class="ask"><h3>Une question ?</h3><p>Écris-nous, nous te répondons avec plaisir.</p><a class="askr" target="_blank" rel="noopener" href="https://wa.me/'+esc(wa)+'"><small>WhatsApp</small><b>'+esc(phone)+'</b></a>'+(K.cfg.email?'<a class="askr" href="mailto:'+esc(K.cfg.email)+'"><small>E-mail</small><b>'+esc(K.cfg.email)+'</b></a>':'')+(K.cfg.address?'<div class="askr"><small>Adresse</small><b>'+esc(K.cfg.address)+'</b></div>':'')+'</div></div></section>';
  app.innerHTML=h;
  var q=document.getElementById('q'),rows=document.getElementById('rows'),res=document.getElementById('res');
  q.oninput=function(){
    var s=nz(q.value).trim();
    if(!s){rows.style.display='';res.style.display='none';return;}
    var r=vis().filter(function(p){return nz(p.name+' '+p.category+' '+(p.description||'')).indexOf(s)>=0;});
    rows.style.display='none';res.style.display='';
    res.innerHTML=r.length?'<div class="grid">'+r.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">Aucun article trouvé.</p>';
  };
  app.onclick=clicks;
};

/* Toute la gamme d'une categorie, avec recherche */
K.views.cat=function(app,name){
  var all=vis().filter(function(p){return(p.category||'Autres')===name;});
  app.innerHTML='<section class="sec"><div class="wrap"><button class="mut" data-go="home" style="margin:6px 0 12px">← Retour à l\'accueil</button>'+
    '<h3>'+esc(name)+' <span class="mut" style="font-size:14px">('+all.length+')</span></h3>'+
    (all.length?'<div class="sbar"><input id="q2" placeholder="Rechercher dans '+esc(name)+'..."></div>':'')+
    '<div id="list"></div></div></section>';
  var q=document.getElementById('q2'),list=document.getElementById('list');
  function draw(){
    var s=q?nz(q.value).trim():'';
    var r=all.filter(function(p){return !s||nz(p.name+' '+(p.description||'')).indexOf(s)>=0;});
    list.innerHTML=r.length?'<div class="grid">'+r.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">'+(all.length?'Aucun article trouvé.':'Bientôt disponible.')+'</p>';
  }
  if(q)q.oninput=draw;
  app.onclick=clicks;
  draw();
};

/* Page Categories */
K.views.cats=function(app){
  app.onclick=null;
  var g=groups();
  var h='<section class="sec"><div class="wrap"><button class="mut" data-go="home" style="margin:6px 0 12px">← Retour à l\'accueil</button><h3>Catégories</h3><div class="ctiles">';
  g.names.forEach(function(c){
    var l=g.by[c],n=esc(c);
    h+='<button class="ctile" data-go="cat" data-arg="'+n+'"><img loading="lazy" src="'+esc(l.length?K.cover(l[0]):K.PH)+'" alt=""><b>'+n+'</b><span>'+(l.length?l.length+' article'+(l.length>1?'s':''):'Bientôt disponible')+'</span></button>';
  });
  h+='</div></div></section>';
  app.innerHTML=h;
};
})();
// FIN app8.js
