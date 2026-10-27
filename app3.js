(function(){
'use strict';
var K=window.K;
K.last=null;
function tot(){return{sub:K.cartTotal(),fee:parseInt(K.cfg.default_delivery_fee||'0',10)||0};}
function waText(o){
  var t='🛍️ *NOUVELLE COMMANDE '+K.esc(K.cfg.shop_name||'KBZ SHOP')+'*\n';
  if(o.ref)t+='Réf : *'+o.ref+'*\n';
  t+='\n👤 '+o.name+'\n📞 '+o.phone+'\n📍 '+o.address+'\n💳 '+(o.pay==='mobile_money'?'Mobile Money':'Paiement à la livraison')+'\n\n📦 *Articles :*\n';
  o.items.forEach(function(i){
    t+='- '+i.name+(i.color||i.size?' ('+[i.color,i.size].filter(Boolean).join(' / ')+')':'')+' x'+i.qty+' : '+K.fmt(i.price*i.qty)+'\n';
  });
  if(o.total)t+='\n💰 *Total avec livraison : '+K.fmt(o.total)+'*';
  return t.replace(/&amp;/g,'&');
}
function friendly(m){
  if(/Stock/i.test(m))return 'Un article n\'est plus disponible en quantité suffisante. Mettez à jour votre panier.';
  if(/Trop de commandes/i.test(m))return 'Trop de commandes avec ce numéro. Réessayez plus tard.';
  if(/deja envoyee/i.test(m))return 'Cette commande vient déjà d\'être envoyée.';
  if(/Telephone/i.test(m))return 'Numéro de téléphone invalide.';
  if(/Nom|Adresse/i.test(m))return 'Vérifiez votre nom et votre adresse.';
  if(/introuvable/i.test(m))return 'Un article n\'existe plus. Videz le panier et recommencez.';
  return 'Commande impossible pour le moment. Utilisez le bouton WhatsApp ci-dessous.';
}

K.views.cart=function(app){
  app.onclick=null;
  if(!K.cart.length){
    app.innerHTML='<div class="wrap sec"><h3>Votre panier</h3><div class="box center"><p class="mut">Votre panier est vide.</p><p style="margin-top:12px"><button class="btn s" data-go="shop">Voir le catalogue</button></p></div></div>';
    return;
  }
  var t=tot();
  var h='<div class="wrap sec" style="max-width:640px"><h3>Votre panier</h3><div class="box">';
  K.cart.forEach(function(i,n){
    h+='<div class="line"><img src="'+K.esc(i.image)+'" alt=""><div class="t"><b>'+K.esc(i.name)+'</b><div class="mut">'+K.esc([i.color,i.size].filter(Boolean).join(' / '))+'</div><div class="price">'+K.fmt(i.price*i.qty)+'</div><div class="qty" style="margin-top:6px"><button data-a="m" data-n="'+n+'">−</button><b>'+i.qty+'</b><button data-a="p" data-n="'+n+'">+</button><button data-a="d" data-n="'+n+'" style="margin-left:auto">🗑️</button></div></div></div>';
  });
  h+='<div class="row" style="margin-top:12px"><span>Sous-total</span><b>'+K.fmt(t.sub)+'</b></div><div class="row"><span>Livraison</span><b>'+K.fmt(t.fee)+'</b></div><div class="row"><span>Total</span><b class="price">'+K.fmt(t.sub+t.fee)+'</b></div></div><button class="btn full" data-go="checkout">Passer la commande</button></div>';
  app.innerHTML=h;
  app.onclick=function(e){
    var b=e.target.closest('[data-a]');
    if(!b)return;
    var n=+b.getAttribute('data-n'),i=K.cart[n],a=b.getAttribute('data-a');
    if(!i)return;
    if(a==='d')K.cart.splice(n,1);
    else if(a==='m')i.qty=Math.max(1,i.qty-1);
    else if(a==='p'){if(i.qty<(i.max||20))i.qty++;else K.toast('Stock maximum atteint',1);}
    K.saveCart();
    K.views.cart(app);
  };
};

K.views.checkout=function(app){
  app.onclick=null;
  if(!K.cart.length){K.go('cart');return;}
  var t=tot();
  app.innerHTML='<div class="wrap sec" style="max-width:520px"><h3>Votre commande</h3><div class="box"><form id="f"><label>Nom et prénom *</label><input name="n" required maxlength="80" autocomplete="name"><label>Téléphone *</label><input name="p" type="tel" required maxlength="16" autocomplete="tel"><label>Adresse / Commune (ex : Abobo, Cocody) *</label><input name="a" required maxlength="200"><label>Paiement</label><select name="m"><option value="livraison">Paiement à la livraison</option><option value="mobile_money">Mobile Money (Orange, MTN, Wave)</option></select><p class="mut" style="margin-top:14px">Sous-total : '+K.fmt(t.sub)+'<br>Livraison : '+K.fmt(t.fee)+'<br><b style="color:var(--txt)">Total : '+K.fmt(t.sub+t.fee)+'</b></p><button class="btn full" style="margin-top:14px" id="go">Valider ma commande</button><p class="err" id="er"></p><div id="bk"></div></form></div></div>';
  K.$('#f').onsubmit=async function(e){
    e.preventDefault();
    var f=e.target,b=K.$('#go'),er=K.$('#er');
    er.textContent='';b.disabled=true;b.textContent='Envoi…';
    var info={name:f.n.value.trim(),phone:f.p.value.trim(),address:f.a.value.trim(),pay:f.m.value,items:K.cart.slice()};
    try{
      var r=await K.rpc('create_order',{p_name:info.name,p_phone:info.phone,p_address:info.address,p_payment:info.pay,
        p_items:K.cart.map(function(i){return{variant_id:i.variant_id,quantity:i.qty};})});
      info.ref=r.ref;info.total=r.total;
      K.last=info;K.cart=[];K.saveCart();
      K.loadProducts().catch(function(){});
      K.go('success');
    }catch(x){
      er.textContent=friendly(x.message);
      b.disabled=false;b.textContent='Valider ma commande';
      K.$('#bk').innerHTML='<a class="btn wa full" style="margin-top:10px" target="_blank" rel="noopener" href="'+K.esc(K.waLink(waText(info)))+'">Envoyer ma commande par WhatsApp</a>';
    }
  };
};

K.views.success=function(app){
  app.onclick=null;
  var o=K.last;
  if(!o){K.go('home');return;}
  app.innerHTML='<div class="wrap sec center" style="max-width:480px"><div style="font-size:48px">✅</div><h3>Commande enregistrée !</h3><p class="price">Référence : '+K.esc(o.ref)+'</p><p class="mut" style="margin:10px 0 16px">Total : '+K.fmt(o.total)+'. Envoyez maintenant votre commande sur WhatsApp pour que nous la confirmions avec vous.</p><a class="btn wa full" target="_blank" rel="noopener" href="'+K.esc(K.waLink(waText(o)))+'">Envoyer sur WhatsApp</a><p style="margin-top:14px"><button class="btn alt s" data-go="shop">Continuer mes achats</button></p></div>';
};
})();
// FIN app3.js
