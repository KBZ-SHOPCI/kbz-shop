(function(){
'use strict';
var K=window.K;
function uniq(a){var r=[];a.forEach(function(x){if(x&&r.indexOf(x)<0)r.push(x);});return r;}

/* ---------- Fiche article ---------- */
K.views.product=function(app,id){
  var p=K.state.products.filter(function(x){return x.id===id;})[0];
  if(!p||(!p.visible&&!K.state.staff)){
    app.innerHTML='<div class="wrap"><div class="box center" role="alert">Article introuvable.<p style="margin-top:10px"><button class="btn s" data-go="shop">Retour au catalogue</button></p></div></div>';
    return;
  }
  var vs=p.product_variants||[];
  var colors=uniq(vs.map(function(v){return v.color;}));
  var sizes=uniq(vs.map(function(v){return v.size;}));
  var S={color:colors.length?(colors.length===1?colors[0]:null):'',
         size:sizes.length?(sizes.length===1?sizes[0]:null):'',qty:1,i:0};
  var LB='font-weight:600;margin:12px 0 4px';

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
    var nm=K.esc(p.name);
    var old=(!v&&p.promo_price!=null&&p.promo_price<p.base_price)?'<span class="old">'+K.fmt(p.base_price)+'</span>':'';
    var h='<div class="wrap"><button class="mut" data-go="shop" style="margin:12px 0"><span aria-hidden="true">←</span> Retour au catalogue</button><div class="pg">';
    h+='<div class="gal"><button class="big" data-act="zoom" style="display:block;width:100%"><img src="'+K.esc(main)+'" alt="'+nm+' : agrandir la photo"></button>';
    if(imgs.length>1){
      h+='<div class="thumbs">'+imgs.map(function(m,i){
        return '<button data-act="thumb" data-i="'+i+'" style="flex:none;display:block" aria-label="Photo '+(i+1)+' sur '+imgs.length+'" aria-pressed="'+(i===S.i)+'"><img class="'+(i===S.i?'on':'')+'" src="'+K.esc(m.url)+'" alt=""></button>';
      }).join('')+'</div>';
    }
    h+='</div><div><div class="cat">'+K.esc(p.category)+'</div><h1 style="font-size:22px;margin:4px 0">'+nm+'</h1>';
    h+='<div class="price" style="font-size:22px">'+K.fmt(price)+old+'</div>';
    h+='<p class="mut" style="margin:10px 0;font-size:14px;white-space:pre-line">'+K.esc(p.description)+'</p>';
    if(colors.length){
      h+='<p class="mut" id="lcol" style="'+LB+'">Couleur'+(S.color?' : <b>'+K.esc(S.color)+'</b>':'')+'</p><div class="opts" role="group" aria-labelledby="lcol">'+colors.map(function(c,i){
        var off=!avail(c,S.size);
        return '<button class="opt'+(S.color===c?' on':'')+(off?' off':'')+'" data-act="color" data-i="'+i+'" aria-pressed="'+(S.color===c)+'"'+(off?' disabled':'')+'>'+K.esc(c)+'</button>';
      }).join('')+'</div>';
    }
    if(sizes.length){
      h+='<p class="mut" id="lsiz" style="'+LB+'">Taille / Pointure</p><div class="opts" role="group" aria-labelledby="lsiz">'+sizes.map(function(s,i){
        var off=!avail(S.color,s);
        return '<button class="opt'+(S.size===s?' on':'')+(off?' off':'')+'" data-act="size" data-i="'+i+'" aria-pressed="'+(S.size===s)+'"'+(off?' disabled':'')+'>'+K.esc(s)+'</button>';
      }).join('')+'</div>';
    }
    var info=v?(v.stock<1?'Épuisé':(v.stock<=3?'Plus que '+v.stock+' en stock':'En stock')):'';
    h+='<p class="mut" style="margin-top:10px">'+info+'</p>';
    h+='<p class="mut" style="'+LB+'">Quantité</p><div class="qty"><button data-act="minus" aria-label="Diminuer la quantité">−</button><b id="qv" role="status" aria-live="polite">'+S.qty+'</b><button data-act="plus" aria-label="Augmenter la quantité">+</button></div>';
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
    var opener=document.activeElement;
    var z=document.createElement('div');
    z.className='zoom';
    z.setAttribute('role','dialog');
    z.setAttribute('aria-modal','true');
    z.setAttribute('aria-label','Photo agrandie : '+p.name);
    z.innerHTML='<button class="x" aria-label="Fermer la photo">✕</button><img src="'+K.esc(u)+'" alt="'+K.esc(p.name)+'">';
    function key(e){if(e.key==='Escape')close();}
    function close(){
      z.remove();
      document.removeEventListener('keydown',key);
      if(opener&&opener.focus)opener.focus();
    }
    z.onclick=close;
    document.addEventListener('keydown',key);
    document.body.appendChild(z);
    z.firstChild.focus();
  }
  app.onclick=function(e){
    var b=e.target.closest('[data-act]');
    if(!b)return;
    var a=b.getAttribute('data-act'),ri=b.getAttribute('data-i'),i=+ri;
    if(a==='zoom'){zoom();return;}
    if(a==='add'){addCart();return;}
    if(a==='minus'||a==='plus'){
      var v=variant(),mx=v?v.stock:20;
      S.qty=a==='minus'?Math.max(1,S.qty-1):Math.max(1,Math.min(mx,S.qty+1));
      app.querySelector('#qv').textContent=S.qty;
      return;
    }
    if(a==='thumb'){S.i=i;}
    else if(a==='color'){
      S.color=colors[i];S.i=0;
      if(sizes.length>1&&S.size!==null&&!avail(S.color,S.size))S.size=null;
    }
    else if(a==='size'){S.size=sizes[i];}
    render();
    var nb=app.querySelector('[data-act="'+a+'"]'+(ri!==null?'[data-i="'+ri+'"]':''));
    if(nb&&!nb.disabled)nb.focus();
  };
  render();
};
})();
// FIN app2.js
