(function(){
'use strict';
var K=window.K;
K.last=null;
var H1='style="font-size:26px;font-weight:800;margin-bottom:14px"';
function tot(){return{sub:K.cartTotal(),fee:parseInt(K.cfg.default_delivery_fee||'0',10)||0};}
function say(m){var e=K.$('#cl');if(e){e.textContent='';setTimeout(function(){e.textContent=m;},60);}}
function ic(p,s,c){return'<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" fill="none" stroke="'+c+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>';}
/* Depot de confirmation : montant fixe de l'article, sinon le plus petit entre la moitie du prix et 2 000 FCFA */
function dep(i){
  var p=K.state.products.filter(function(x){return(x.product_variants||[]).some(function(v){return v.id===i.variant_id;});})[0];
  var d=(p&&p.deposit!=null)?p.deposit:Math.min(Math.round(i.price/2),2000);
  return Math.min(d,i.price)*i.qty;
}
function depTot(){return K.cart.reduce(function(a,i){return a+dep(i);},0);}
function waText(o){
  var t='🛍️ *NOUVELLE COMMANDE '+K.esc(K.cfg.shop_name||'KBZ SHOP')+'*\n';
  if(o.ref)t+='Réf : *'+o.ref+'*\n';
  t+='\n👤 '+o.name+'\n📞 '+o.phone+'\n📍 '+o.address+'\n💳 '+(o.pay==='mobile_money'?'Mobile Money':'Paiement à la livraison')+'\n\n📦 *Articles :*\n';
  o.items.forEach(function(i){
    t+='- '+i.name+(i.color||i.size?' ('+[i.color,i.size].filter(Boolean).join(' / ')+')':'')+' x'+i.qty+' : '+K.fmt(i.price*i.qty)+'\n';
  });
  if(o.total){
    t+='\n💰 *Total avec livraison : '+K.fmt(o.total)+'*';
    if(o.pay==='mobile_money')t+='\nPaiement complet par Mobile Money, rien à payer à la livraison.';
    else if(o.dep>0)t+='\nDépôt de confirmation : '+K.fmt(o.dep)+'\nReste à payer à la livraison : '+K.fmt(o.total-o.dep);
    else t+='\nÀ payer à la livraison.';
  }
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
var NEW=' <span class="sr">(s\'ouvre dans WhatsApp)</span>';
var TR=ic('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',20,'currentColor');

/* ---------- Panier ---------- */
function drawCart(app,msg,focus){
  app.onclick=null;
  if(!K.cart.length){
    app.innerHTML='<div class="wrap sec"><h1 '+H1+' id="ct" tabindex="-1">Votre panier</h1><div class="box center"><p class="mut">Votre panier est vide.</p><p style="margin-top:12px"><button class="btn s" data-go="shop">Voir le catalogue</button></p></div><p class="sr" id="cl" role="status"></p></div>';
  }else{
    var t=tot();
    var h='<div class="wrap sec" style="max-width:640px"><h1 '+H1+' id="ct" tabindex="-1">Votre panier</h1><div class="box">';
    K.cart.forEach(function(i,n){
      var nm=K.esc(i.name);
      h+='<div class="line"><img src="'+K.esc(i.image)+'" alt=""><div class="t"><b>'+nm+'</b><div class="mut">'+K.esc([i.color,i.size].filter(Boolean).join(' / '))+'</div><div class="price">'+K.fmt(i.price*i.qty)+'</div><div class="qty" style="margin-top:6px"><button data-a="m" data-n="'+n+'" aria-label="Diminuer la quantité : '+nm+'">−</button><span class="sr">Quantité :</span><b>'+i.qty+'</b><button data-a="p" data-n="'+n+'" aria-label="Augmenter la quantité : '+nm+'">+</button><button data-a="d" data-n="'+n+'" aria-label="Retirer du panier : '+nm+'" style="margin-left:auto;min-width:40px;min-height:40px">'+TR+'</button></div></div></div>';
    });
    h+='<div class="row" style="margin-top:12px"><span>Sous-total</span><b>'+K.fmt(t.sub)+'</b></div><div class="row"><span>Livraison (frais confirmés sur WhatsApp)</span><b>'+K.fmt(t.fee)+'</b></div><div class="row"><span>Total</span><b class="price">'+K.fmt(t.sub+t.fee)+'</b></div></div><button class="btn full" data-go="checkout">Passer la commande</button><p class="sr" id="cl" role="status"></p></div>';
    app.innerHTML=h;
    app.onclick=function(e){
      var b=e.target.closest('[data-a]');
      if(!b)return;
      var n=+b.getAttribute('data-n'),i=K.cart[n],a=b.getAttribute('data-a'),m='';
      if(!i)return;
      if(a==='d'){m=i.name+' retiré du panier';K.cart.splice(n,1);}
      else if(a==='m'){i.qty=Math.max(1,i.qty-1);m='Quantité : '+i.qty;}
      else if(a==='p'){
        if(i.qty<(i.max||20)){i.qty++;m='Quantité : '+i.qty;}
        else{K.toast('Stock maximum atteint',1);return;}
      }
      K.saveCart();
      drawCart(app,m,{a:a,n:n});
    };
  }
  if(msg)say(msg);
  if(focus){
    var el=focus.a==='d'?K.$('#ct',app):K.$('[data-a="'+focus.a+'"][data-n="'+focus.n+'"]',app);
    if(el)el.focus();
  }
}
K.views.cart=function(app){drawCart(app);};

/* ---------- Commande ---------- */
function sum(pay){
  var t=tot(),T=t.sub+t.fee,D=depTot();
  function B(s){return'<b style="color:var(--txt)">'+s+'</b>';}
  var h='Sous-total : '+K.fmt(t.sub)+'<br>Livraison (frais confirmés sur WhatsApp) : '+K.fmt(t.fee)+'<br>'+B('Total : '+K.fmt(T));
  if(pay==='mobile_money')h+='<br>'+B('À payer par Mobile Money : '+K.fmt(T))+'<br>À payer à la livraison : '+K.fmt(0);
  else if(D>0)h+='<br>'+B('Dépôt de confirmation à envoyer : '+K.fmt(D))+'<br>Reste à payer à la livraison : '+K.fmt(T-D);
  else h+='<br>À payer à la livraison : '+K.fmt(T);
  return h;
}
K.views.checkout=function(app){
  app.onclick=null;
  if(!K.cart.length){K.go('cart');return;}
  app.innerHTML='<div class="wrap sec" style="max-width:520px"><h1 '+H1+'>Votre commande</h1><div class="box"><form id="f">'+
    '<label for="fn">Nom et prénom *</label><input id="fn" name="n" required maxlength="80" autocomplete="name">'+
    '<label for="fp">Téléphone *</label><input id="fp" name="p" type="tel" inputmode="tel" required maxlength="16" autocomplete="tel">'+
    '<label for="fa">Adresse / Commune (ex : Abobo, Cocody) *</label><input id="fa" name="a" required maxlength="200" autocomplete="street-address">'+
    '<label for="fm">Mode de paiement</label><select id="fm" name="m"><option value="livraison">Paiement à la livraison</option><option value="mobile_money">Mobile Money (Orange, MTN, Wave)</option></select>'+
    '<p class="mut" style="margin-top:14px" id="sm" aria-live="polite">'+sum('livraison')+'</p>'+
    '<p class="mut" style="margin-top:10px">Votre nom, votre téléphone et votre adresse servent uniquement à traiter et livrer votre commande.</p>'+
    '<label for="fc" style="display:flex;gap:10px;align-items:flex-start;font-weight:500;font-size:14px;color:var(--txt);margin-top:14px"><input id="fc" type="checkbox" required style="width:22px;height:22px;flex:none;margin-top:2px"><span>J\'accepte les <a href="conditions-de-vente.html" target="_blank" rel="noopener" style="color:var(--gold);font-weight:700">conditions de vente</a> et la <a href="confidentialite.html#confidentialite" target="_blank" rel="noopener" style="color:var(--gold);font-weight:700">politique de confidentialité</a> *</span></label>'+
    '<button class="btn full" style="margin-top:14px" id="go">Valider ma commande</button><p class="err" id="er" role="alert"></p><div id="bk"></div></form></div></div>';
  K.$('#fm').onchange=function(){K.$('#sm').innerHTML=sum(this.value);};
  K.$('#f').onsubmit=async function(e){
    e.preventDefault();
    var f=e.target,b=K.$('#go'),er=K.$('#er');
    er.textContent='';
    if(!K.$('#fc').checked){
      er.textContent='Pour commander, acceptez les conditions de vente et la politique de confidentialité.';
      K.$('#fc').focus();
      return;
    }
    b.disabled=true;b.textContent='Envoi…';
    var info={name:f.n.value.trim(),phone:f.p.value.trim(),address:f.a.value.trim(),pay:f.m.value,items:K.cart.slice(),dep:f.m.value==='livraison'?depTot():0};
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
      K.$('#bk').innerHTML='<a class="btn wa full" style="margin-top:10px" target="_blank" rel="noopener" href="'+K.esc(K.waLink(waText(info)))+'">Envoyer ma commande par WhatsApp'+NEW+'</a>';
    }
  };
};

/* ---------- Confirmation ---------- */
K.views.success=function(app){
  app.onclick=null;
  var o=K.last;
  if(!o){K.go('home');return;}
  var tx='Total : '+K.fmt(o.total)+'. ';
  if(o.pay==='mobile_money')tx+='Envoyez maintenant votre commande sur WhatsApp : nous vous donnons le numéro pour payer par Mobile Money. Vous ne paierez rien à la livraison.';
  else if(o.dep>0)tx+='Dépôt de confirmation : '+K.fmt(o.dep)+'. Envoyez maintenant votre commande sur WhatsApp : nous vous donnons le numéro pour le dépôt. Vous paierez le reste ('+K.fmt(o.total-o.dep)+') au livreur, à la livraison.';
  else tx+='Envoyez maintenant votre commande sur WhatsApp pour que nous la confirmions avec vous. Vous paierez à la livraison.';
  app.innerHTML='<div class="wrap sec center" style="max-width:480px"><div aria-hidden="true">'+ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',56,'#15803d')+'</div><h1 '+H1+'>Commande enregistrée !</h1><p class="price">Référence : '+K.esc(o.ref)+'</p><p class="mut" style="margin:10px 0 16px">'+tx+'</p><a class="btn wa full" target="_blank" rel="noopener" href="'+K.esc(K.waLink(waText(o)))+'">Envoyer sur WhatsApp'+NEW+'</a><p style="margin-top:14px"><button class="btn alt s" data-go="shop">Continuer mes achats</button></p></div>';
};
})();
// FIN app3.js
