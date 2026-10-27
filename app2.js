(function(){
'use strict';
var K=window.K;
function vis(){return K.state.products.filter(function(p){return p.visible;});}
function uniq(a){var r=[];a.forEach(function(x){if(x&&r.indexOf(x)<0)r.push(x);});return r;}

function card(p){
  var out=K.stock(p)<1;
  var old=(p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
  return '<div class="card" data-go="product" data-arg="'+p.id+'"><div class="ph"><img loading="lazy" src="'+K.esc(K.cover(p))+'" alt="">'+(out?'<span class="soldout">Épuisé</span>':'')+'</div><div class="in"><div class="cat">'+K.esc(p.category)+'</div><h4>'+K.esc(p.name)+'</h4><div class="price">'+K.fmt(K.price(p))+old+'</div></div></div>';
}

/* ---------- Accueil ---------- */
K.views.home=function(app){
  var list=vis().slice(0,8);
  app.innerHTML='<section class="hero"><div class="wrap"><span class="tag">'+K.esc(K.cfg.slogan||'')+'</span><h2>L\'élégance urbaine à Abidjan</h2><p>Vêtements, chaussures et accessoires tendance. Commandez en quelques clics, on vous livre.</p><button class="btn" data-go="shop">Explorer le catalogue</button></div></section>'+
  '<section class="sec"><div class="wrap"><div class="row"><h3>Articles vedettes</h3><button class="mut" data-go="shop">Voir tout →</button></div>'+
  (list.length?'<div class="grid">'+list.map(card).join('')+'</div>':'<p class="mut center">Les articles arrivent bientôt.</p>')+'</div></section>';
};

/* ---------- Catalogue ---------- */
K.views.shop=function(app){
  var cats=uniq(vis().map(function(p){return p.category;}));
  app.innerHTML='<section class="sec"><div class="wrap"><h3>Catalogue</h3><input id="q" placeholder="Rechercher un article…" value="'+K.esc(K.state.q)+'"><div class="chips" id="chips"></div><div id="list"></div></div></section>';
  var chips=K.$('#chips',app),list=K.$('#list',app),q=K.$('#q',app);
  function draw(){
    var h='<button class="chip'+(K.state.cat==='all'?' on':'')+'" data-cat="all">Tout</button>';
    cats.forEach(function(c,i){h+='<button class="chip'+(K.state.cat===c?' on':'')+'" data-cat="'+i+'">'+K.esc(c)+'</button>';});
    chips.innerHTML=h;
    var s=K.state.q.toLowerCase().trim();
    var r=vis().filter(function(p){
      if(K.state.cat!=='all'&&p.category!==K.state.cat)return false;
      if(s&&(p.name+' '+p.category).toLowerCase().indexOf(s)<0)return false;
      return true;
    });
    list.innerHTML=r.length?'<div class="grid">'+r.map(card).join('')+'</div>':'<p class="mut center" style="padding:30px 0">Aucun article trouvé.</p>';
  }
  q.oninput=function(){K.state.q=q.value;draw();};
  chips.onclick=function(e){
    var b=e.target.closest('[data-cat]');
    if(!b)return;
    var v=b.getAttribute('data-cat');
    K.state.cat=v==='all'?'all':cats[+v];
    draw();
  };
  draw();
};

/* ---------- Fiche article ---------- */
K.views.product=function(app,id){
  var p=K.state.products.filter(function(x){return x.id===id;})[0];
  if(!p||(!p.visible&&!K.state.staff)){
    app.innerHTML='<div class="wrap"><div class="box center">Article introuvable.<p style="margin-top:10px"><button class="btn s" data-go="shop">Retour au catalogue</button></p></div></div>';
    return;
  }
  var vs=p.product_variants||[];
  var colors=uniq(vs.map(function(v){return v.color;}));
  var sizes=uniq(vs.map(function(v){return v.size;}));
  var S={color:colors.length?(colors.length===1?colors[0]:null):'',
         size:sizes.length?(sizes.length===1?sizes[0]:null):'',qty:1,i:0};

  function variant(){
    if(S.color===null||S.size===null)return null;
    return vs.filter(function(v){return v.color===S.color&&v.size===S.size;})[0]||null;
  }
  function avail(c,s){
    return vs.some(function(v){
      return(c===null||v.color===c)&&(s===null||v.size===s)&&v.stock>0;
    });
  }
  function render(){
    var imgs=K.images(p,S.color||null);
    if(S.i>=imgs.length)S.i=0;
    var main=imgs.length?imgs[S.i].url:K.PH;
    var v=variant();
    var price=K.price(p,v);
    var old=(!v&&p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
    var h='<div class="wrap"><button class="mut" data-go="shop" style="margin:12px 0">← Retour au catalogue</button><div class="pg">';
    h+='<div class="gal"><div class="big" data-act="zoom"><img src="'+K.esc(main)+'" alt=""></div>';
    if(imgs.length>1){
      h+='<div class="thumbs">'+imgs.map(function(m,i){return '<img class="'+(i===S.i?'on':'')+'" data-act="thumb" data-i="'+i+'" src="'+K.esc(m.url)+'" alt="">';}).join('')+'</div>';
    }
    h+='</div><div><div class="cat">'+K.esc(p.category)+'</div><h2 style="font-size:22px;margin:4px 0">'+K.esc(p.name)+'</h2>';
    h+='<div class="price" style="font-size:22px">'+K.fmt(price)+old+'</div>';
    h+='<p class="mut" style="margin:10px 0;font-size:14px;white-space:pre-line">'+K.esc(p.description)+'</p>';
    if(colors.length){
      h+='<label>Couleur'+(S.color?' : <b>'+K.esc(S.color)+'</b>':'')+'</label><div class="opts">'+colors.map(function(c,i){
        return '<button class="opt'+(S.color===c?' on':'')+(avail(c,S.size)?'':' off')+'" data-act="color" data-i="'+i+'">'+K.esc(c)+'</button>';
      }).join('')+'</div>';
    }
    if(sizes.length){
      h+='<label>Taille / Pointure</label><div class="opts">'+sizes.map(function(s,i){
        return '<button class="opt'+(S.size===s?' on':'')+(avail(S.color,s)?'':' off')+'" data-act="size" data-i="'+i+'">'+K.esc(s)+'</button>';
      }).join('')+'</div>';
    }
    var info=v?(v.stock<1?'Épuisé':(v.stock<=3?'Plus que '+v.stock+' en stock':'En stock')):'';
    h+='<p class="mut" style="margin-top:10px">'+info+'</p>';
    h+='<label>Quantité</label><div class="qty"><button data-act="minus">−</button><b>'+S.qty+'</b><button data-act="plus">+</button></div>';
    var none=K.stock(p)<1;
    h+='<div style="margin-top:18px"><button class="btn full" data-act="add"'+(none?' disabled':'')+'>'+(none?'Article épuisé':'Ajouter au panier')+'</button></div>';
    h+='<p class="mut" style="margin-top:12px">Paiement : Mobile Money ou à la livraison.</p></div></div></div>';
    app.innerHTML=h;
  }
  function addCart(){
    if(colors.length&&S.color===null)return K.toast('Choisissez une couleur',1);
    if(sizes.length&&S.size===null)return K.toast('Choisissez une taille',1);
    var v=variant();
    if(!v||v.stock<1)return K.toast('Cette option est indisponible',1);
    var ex=K.cart.filter(function(i){return i.variant_id===v.id;})[0];
    var have=ex?ex.qty:0;
    if(have+S.qty>v.stock)return K.toast('Stock insuffisant ('+v.stock+' disponibles)',1);
    if(ex){ex.qty+=S.qty;ex.max=v.stock;}
    else{
      var im=K.images(p,v.color||null);
      K.cart.push({variant_id:v.id,product_id:p.id,name:p.name,color:v.color,size:v.size,
        price:K.price(p,v),qty:S.qty,image:im.length?im[0].url:K.PH,max:v.stock});
    }
    K.saveCart();
    K.toast('Ajouté au panier ✓');
  }
  function zoom(){
    var imgs=K.images(p,S.color||null);
    var u=imgs.length?imgs[S.i].url:K.PH;
    var z=document.createElement('div');
    z.className='zoom';
    z.innerHTML='<button class="x">✕</button><img src="'+K.esc(u)+'" alt="">';
    z.onclick=function(){z.remove();};
    document.body.appendChild(z);
  }
  app.onclick=function(e){
    var b=e.target.closest('[data-act]');
    if(!b)return;
    var a=b.getAttribute('data-act'),i=+b.getAttribute('data-i');
    if(a==='thumb'){S.i=i;}
    else if(a==='zoom'){return zoom();}
    else if(a==='color'){
      S.color=colors[i];S.i=0;
      if(sizes.length>1&&S.size!==null&&!avail(S.color,S.size))S.size=null;
    }
    else if(a==='size'){S.size=sizes[i];}
    else if(a==='minus'){S.qty=Math.max(1,S.qty-1);}
    else if(a==='plus'){var v=variant();S.qty=Math.min(v?v.stock:20,S.qty+1);if(S.qty<1)S.qty=1;}
    else if(a==='add'){return addCart();}
    render();
  };
  render();
};
})();
// FIN app2.js
