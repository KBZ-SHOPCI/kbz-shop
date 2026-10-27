(function(){
'use strict';
var K=window.K,esc=K.esc;
K.CATS=['Vêtements','Chaussures','Accessoires'];
var EM={'Vêtements':'👕','Chaussures':'👟','Accessoires':'⌚'};

var css=document.createElement('style');
css.textContent='.hero h2 span{color:var(--yel)}.cats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:30px}.catc{background:#fff;color:var(--txt);border-radius:20px;padding:18px 6px;font-weight:800;font-size:15px;box-shadow:0 10px 24px rgba(15,23,42,.14);text-align:center}.catc i{display:block;font-style:normal;font-size:34px;margin-bottom:6px}.low{position:absolute;top:10px;left:10px;background:#fff;color:#b45309;font-size:13px;font-weight:800;padding:6px 12px;border-radius:16px;box-shadow:0 2px 8px rgba(15,23,42,.12)}.dsc{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:2px 0 8px;font-size:14px}.addb{margin-top:10px}.step{display:flex;gap:14px;align-items:flex-start;background:var(--card2);border-radius:20px;padding:18px;margin-bottom:12px}.num{flex:none;width:44px;height:44px;border-radius:50%;background:var(--gold);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:18px}.step b{display:block;font-size:17px}.ask{background:var(--navy);color:#fff;border-radius:28px;padding:24px;margin:26px 0}.ask h3{color:#fff;margin-bottom:6px}.ask p{color:#b8c2d9}.askr{display:block;background:#202b3f;border-radius:16px;padding:14px 16px;margin-top:12px;color:#fff}.askr small{display:block;color:#aeb9d1;font-size:13px}.askr b{font-size:17px}';
document.head.appendChild(css);

function vis(){return K.state.products.filter(function(p){return p.visible;});}
function cats(){
  var c=K.CATS.slice(),low=c.map(function(x){return x.toLowerCase();});
  vis().forEach(function(p){
    var k=(p.category||'').trim();
    if(k&&low.indexOf(k.toLowerCase())<0){c.push(k);low.push(k.toLowerCase());}
  });
  return c;
}
function toCat(){var e=document.getElementById('cat');if(e)e.scrollIntoView({behavior:'smooth'});}

function card(p){
  var st=K.stock(p);
  var old=(p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
  var badge=st<1?'<span class="soldout">Épuisé</span>':(st<=5?'<span class="low">Plus que '+st+'</span>':'');
  return '<div class="card" data-pid="'+p.id+'"><div class="ph">'+badge+'<img loading="lazy" src="'+esc(K.cover(p))+'" alt=""></div><div class="in"><div class="cat">'+esc(p.category)+'</div><h4>'+esc(p.name)+'</h4><div class="mut dsc">'+esc((p.description||'').split('\n')[0])+'</div><div class="price">'+K.fmt(K.price(p))+old+'</div><button class="btn full addb" data-add="'+p.id+'"'+(st<1?' disabled':'')+'>+ Ajouter</button></div></div>';
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

K.views.home=function(app){
  var phone=K.cfg.phone||'',wa=K.cfg.whatsapp||'';
  app.innerHTML='<section class="hero"><div class="wrap"><span class="tag">Boutique en ligne à Abidjan</span><h2>Ton style,<br><span>ton choix.</span></h2><p>Vêtements, chaussures et accessoires. Ajoute tes articles au panier et confirme ta commande sur WhatsApp.</p><button class="btn" data-sc="1">Voir les articles</button><div class="cats">'+K.CATS.map(function(c){return '<button class="catc" data-c="'+esc(c)+'"><i>'+EM[c]+'</i>'+esc(c)+'</button>';}).join('')+'</div></div></section>'+
  '<section class="sec" id="cat"><div class="wrap"><h3>Nos articles</h3><p class="mut" style="margin:-6px 0 12px">Trouve ton prochain coup de cœur.</p><input id="q" placeholder="Rechercher un article..." value="'+esc(K.state.q)+'"><div class="chips" id="chips"></div><div id="list"></div></div></section>'+
  '<section class="sec"><div class="wrap"><h3>Comment commander</h3><p class="mut" style="margin:-6px 0 14px">Simple et rapide, en trois étapes.</p><div class="step"><span class="num">1</span><div><b>Choisis tes articles</b><span class="mut">Parcours la boutique et trouve ce qui te plaît.</span></div></div><div class="step"><span class="num">2</span><div><b>Ajoute-les au panier</b><span class="mut">Modifie les quantités et vérifie le total.</span></div></div><div class="step"><span class="num">3</span><div><b>Confirme sur WhatsApp</b><span class="mut">Ta commande arrive au vendeur, qui la confirme avec toi.</span></div></div>'+
  '<div class="ask"><h3>Une question ?</h3><p>Écris-nous, nous te répondons avec plaisir.</p><a class="askr" target="_blank" rel="noopener" href="https://wa.me/'+esc(wa)+'"><small>WhatsApp</small><b>'+esc(phone)+'</b></a>'+(K.cfg.email?'<a class="askr" href="mailto:'+esc(K.cfg.email)+'"><small>E-mail</small><b>'+esc(K.cfg.email)+'</b></a>':'')+(K.cfg.address?'<div class="askr"><small>Adresse</small><b>'+esc(K.cfg.address)+'</b></div>':'')+'</div></div></section>';
  var chips=document.getElementById('chips'),list=document.getElementById('list'),q=document.getElementById('q');
  function draw(){
    var cs=cats(),cc=K.state.cat;
    var h='<button class="chip'+(cc==='all'?' on':'')+'" data-cat="all">Tous</button>';
    cs.forEach(function(c){h+='<button class="chip'+(cc.toLowerCase()===c.toLowerCase()?' on':'')+'" data-cat="'+esc(c)+'">'+esc(c)+'</button>';});
    chips.innerHTML=h;
    var s=K.state.q.toLowerCase().trim();
    var r=vis().filter(function(p){
      if(cc!=='all'&&(p.category||'').toLowerCase()!==cc.toLowerCase())return false;
      if(s&&(p.name+' '+p.category).toLowerCase().indexOf(s)<0)return false;
      return true;
    });
    list.innerHTML=r.length?'<div class="grid">'+r.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">Aucun article dans cette catégorie pour le moment.</p>';
  }
  q.oninput=function(){K.state.q=q.value;draw();};
  app.onclick=function(e){
    var t=e.target,b;
    if(t.closest('[data-sc]')){toCat();return;}
    if((b=t.closest('[data-c]'))){K.state.cat=b.getAttribute('data-c');draw();toCat();return;}
    if((b=t.closest('[data-cat]'))){K.state.cat=b.getAttribute('data-cat');draw();return;}
    if((b=t.closest('[data-add]'))){quick(b.getAttribute('data-add'));return;}
    if((b=t.closest('[data-pid]'))){K.go('product',b.getAttribute('data-pid'));}
  };
  draw();
};
K.views.shop=function(app){
  K.views.home(app);
  setTimeout(toCat,60);
};

/* categories proposees dans l'editeur d'articles */
new MutationObserver(function(){
  var d=document.getElementById('cats');
  if(!d||d.getAttribute('data-k'))return;
  d.setAttribute('data-k','1');
  var have=[].map.call(d.options,function(o){return o.value;});
  K.CATS.forEach(function(c){
    if(have.indexOf(c)<0){var o=document.createElement('option');o.value=c;d.appendChild(o);}
  });
}).observe(document.body,{childList:true,subtree:true});
})();
// FIN app6.js
