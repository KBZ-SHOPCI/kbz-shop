(function(){
'use strict';
var K=window.K;
if(!K)return;
var ORDER=['Maillots','Vêtements','Chaussures','Accessoires','Autres'];
var PER=6;

var st=document.createElement('style');
st.textContent=
'#app{overflow-x:clip}'+
'.crow{display:flex;justify-content:space-between;align-items:center;margin:24px 0 8px}'+
'.crow h3{margin:0}'+
'.crow button{background:none;border:0;color:#2447e5;font-weight:700;font-size:14px;cursor:pointer}'+
'.hrow{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x proximity;padding:4px 2px 12px;-webkit-overflow-scrolling:touch}'+
'.hrow .card{flex:0 0 150px;min-width:0;scroll-snap-align:start}'+
'.hrow .more{flex:0 0 110px;scroll-snap-align:start;display:flex;align-items:center;justify-content:center;text-align:center;background:none;border:2px dashed #2447e5;border-radius:14px;color:#2447e5;font-weight:700;font-size:14px;padding:10px;cursor:pointer}'+
'.ctiles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}'+
'.ctile{border:0;padding:0;border-radius:14px;overflow:hidden;background:rgba(127,127,127,.14);text-align:center;cursor:pointer;color:inherit}'+
'.ctile img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}'+
'.ctile b{display:block;padding:8px 6px 2px}'+
'.ctile span{display:block;padding-bottom:10px;font-size:13px;opacity:.7}';
document.head.appendChild(st);

function vis(){return K.state.products.filter(function(p){return p.visible;});}

function card(p){
  var out=K.stock(p)<1;
  var old=(p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
  return '<div class="card" data-go="product" data-arg="'+p.id+'"><div class="ph"><img loading="lazy" src="'+K.esc(K.cover(p))+'" alt="">'+(out?'<span class="soldout">Épuisé</span>':'')+'</div><div class="in"><div class="cat">'+K.esc(p.category)+'</div><h4>'+K.esc(p.name)+'</h4><div class="price">'+K.fmt(K.price(p))+old+'</div></div></div>';
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

/* Accueil : une rangee par categorie */
K.views.home=function(app){
  var g=groups();
  var h='<section class="hero"><div class="wrap"><span class="tag">'+K.esc(K.cfg.slogan||'')+'</span><h2>L\'élégance urbaine à Abidjan</h2><p>Maillots, vêtements, chaussures et accessoires tendance. Commandez en quelques clics, on vous livre.</p><button class="btn" data-go="cats">Voir les catégories</button></div></section>'+
    '<section class="sec"><div class="wrap">';
  g.names.forEach(function(c){
    var l=g.by[c],n=K.esc(c);
    if(!l.length){
      h+='<div class="crow"><h3>'+n+'</h3></div><p class="mut" style="margin:0 0 8px">Bientôt disponible</p>';
      return;
    }
    h+='<div class="crow"><h3>'+n+'</h3><button data-go="cat" data-arg="'+n+'">Voir plus →</button></div>'+
       '<div class="hrow">'+l.slice(0,PER).map(card).join('');
    if(l.length>PER)h+='<button class="more" data-go="cat" data-arg="'+n+'">Voir plus<br>('+(l.length-PER)+' autres)</button>';
    h+='</div>';
  });
  h+='</div></section>';
  app.innerHTML=h;
};

/* Toute la gamme d'une categorie */
K.views.cat=function(app,name){
  var l=vis().filter(function(p){return(p.category||'Autres')===name;});
  app.innerHTML='<section class="sec"><div class="wrap"><button class="mut" data-go="home" style="margin:6px 0 12px">← Retour à l\'accueil</button>'+
    '<h3>'+K.esc(name)+' <span class="mut" style="font-size:14px">('+l.length+')</span></h3>'+
    (l.length?'<div class="grid">'+l.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">Bientôt disponible.</p>')+
    '</div></section>';
};

/* Page Categories (separee de l'accueil) */
K.views.cats=function(app){
  var g=groups();
  var h='<section class="sec"><div class="wrap"><button class="mut" data-go="home" style="margin:6px 0 12px">← Retour à l\'accueil</button><h3>Catégories</h3><div class="ctiles">';
  g.names.forEach(function(c){
    var l=g.by[c],n=K.esc(c);
    h+='<button class="ctile" data-go="cat" data-arg="'+n+'"><img loading="lazy" src="'+K.esc(l.length?K.cover(l[0]):K.PH)+'" alt=""><b>'+n+'</b><span>'+(l.length?l.length+' article'+(l.length>1?'s':''):'Bientôt disponible')+'</span></button>';
  });
  h+='</div></div></section>';
  app.innerHTML=h;
};

})();
// FIN app8.js
