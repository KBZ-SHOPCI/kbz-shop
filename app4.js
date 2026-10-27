(function(){
'use strict';
var K=window.K,$=K.$,esc=K.esc;
K.tabs=K.tabs||{};
var fails=0,lock=0,cache=[];
var ST={nouvelle:'Nouvelle',confirmee:'Confirmée',en_livraison:'En livraison',livree:'Livrée',annulee:'Annulée'};
var NX={nouvelle:['confirmee','annulee'],confirmee:['en_livraison','annulee'],en_livraison:['livree','annulee']};
var AL={confirmee:'Confirmer',en_livraison:'Mettre en livraison',livree:'Marquer livrée',annulee:'Annuler la commande'};
var RN={admin:'Administrateur',orders:'Gestionnaire des commandes',products:'Gestionnaire des produits'};

function wa(p){var d=String(p).replace(/\D/g,'');return(d.length===10&&d[0]==='0')?'225'+d:d;}
async function logout(){
  await K.sb.auth.signOut();
  K.state.user=null;K.state.staff=null;
  try{await K.loadProducts();}catch(x){}
  K.go('home');
}
K.logout=logout;

function loginView(app){
  app.innerHTML='<div class="wrap sec" style="max-width:420px"><div class="box"><h3>Connexion Espace Vendeur</h3><form id="lf" autocomplete="off"><label>E-mail</label><input id="em" type="email" name="kbz_u" value="" autocomplete="off" required><label>Mot de passe</label><input id="pw" type="password" name="kbz_k" value="" autocomplete="new-password" required><button class="btn full" style="margin-top:14px" id="lb">Se connecter</button><p class="err" id="le"></p></form></div></div>';
  $('#lf').onsubmit=async function(e){
    e.preventDefault();
    var er=$('#le'),b=$('#lb');
    if(Date.now()<lock){er.textContent='Trop d\'essais. Patientez une minute.';return;}
    b.disabled=true;er.textContent='';
    var r=await K.sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});
    if(r.error){
      fails++;if(fails>=5){lock=Date.now()+60000;fails=0;}
      er.textContent='E-mail ou mot de passe incorrect.';b.disabled=false;$('#pw').value='';return;
    }
    fails=0;
    await K.loadStaff();
    try{await K.loadProducts();}catch(x){}
    K.go('admin');
  };
}
function denied(app){
  app.innerHTML='<div class="wrap sec"><div class="box center"><p><b>Ce compte n\'a pas accès à l\'espace vendeur.</b></p><p style="margin-top:12px"><button class="btn s" id="lo">Déconnexion</button></p></div></div>';
  $('#lo').onclick=logout;
}
function panel(app){
  var role=K.state.staff.role;
  var keys=Object.keys(K.tabs).filter(function(k){return K.tabs[k].roles.indexOf(role)>=0;})
    .sort(function(a,b){return K.tabs[a].order-K.tabs[b].order;});
  if(keys.indexOf(K.state.tab)<0)K.state.tab=keys[0];
  app.innerHTML='<div class="wrap sec"><div class="row"><h3>Espace vendeur</h3><button class="btn alt s" id="lo">Déconnexion</button></div><p class="mut" style="margin-bottom:10px">'+esc(K.state.staff.display_name||'')+' · '+esc(RN[role]||role)+'</p><div class="tabs">'+keys.map(function(k){return '<button data-t="'+k+'" class="'+(k===K.state.tab?'on':'')+'">'+K.tabs[k].label+'</button>';}).join('')+'</div><div id="tab"></div></div>';
  $('#lo',app).onclick=logout;
  $('.tabs',app).onclick=function(e){
    var b=e.target.closest('[data-t]');
    if(b){K.state.tab=b.getAttribute('data-t');panel(app);}
  };
  K.tabs[K.state.tab].render($('#tab',app));
}
K.views.admin=function(app){
  app.onclick=null;
  if(!K.state.user)return loginView(app);
  if(!K.state.staff)return denied(app);
  panel(app);
};

/* ---------- Tableau de bord ---------- */
K.tabs.dash={label:'Tableau de bord',roles:['admin'],order:0,render:async function(el){
  el.innerHTML='<div class="load">Chargement…</div>';
  var d;
  try{d=await K.rpc('staff_orders');}catch(e){el.innerHTML='<p class="err">'+esc(e.message)+'</p>';return;}
  function n(s){return d.filter(function(o){return o.status===s;}).length;}
  var ca=d.filter(function(o){return o.status==='livree';}).reduce(function(a,o){return a+o.total;},0);
  var P=K.state.products;
  function s(v,l){return '<div class="stat"><b>'+v+'</b>'+l+'</div>';}
  el.innerHTML='<div class="stats">'+s(n('nouvelle'),'Nouvelles')+s(n('confirmee')+n('en_livraison'),'En cours')+s(n('livree'),'Livrées')+s(K.fmt(ca),'Chiffre d\'affaires (livrées)')+s(P.length,'Articles')+s(P.filter(function(p){return K.stock(p)<1;}).length,'En rupture')+'</div><p class="mut" style="margin-top:10px">Les 300 dernières commandes sont prises en compte.</p>';
}};

/* ---------- Commandes ---------- */
function exportCsv(){
  var rows=[['Reference','Date','Statut','Client','Telephone','Adresse','Paiement','Sous-total','Livraison','Total','Pris par']];
  cache.forEach(function(o){rows.push([o.ref,o.created_at,ST[o.status],o.customer_name,o.phone||'',o.address||'',o.payment_method,o.subtotal,o.delivery_fee,o.total,o.assigned_name||'']);});
  var s=rows.map(function(r){return r.map(function(c){
    c=String(c==null?'':c);if(/^[=+\-@]/.test(c))c="'"+c;
    return '"'+c.replace(/"/g,'""')+'"';}).join(';');}).join('\r\n');
  var a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+s],{type:'text/csv'}));
  a.download='commandes-kbz.csv';a.click();
}
async function detail(id,el){
  var o=cache.filter(function(x){return x.id===id;})[0];
  if(!o)return;
  var items=[],hist=[];
  try{items=await K.rpc('staff_order_items',{p_order:id});hist=await K.rpc('staff_order_history',{p_order:id});}catch(e){}
  var adm=K.state.staff.role==='admin',can=adm||o.mine,done=o.status==='livree'||o.status==='annulee';
  var m=document.createElement('div');m.className='modal';
  var h='<div class="sheet"><div class="row"><h3>'+esc(o.ref)+'</h3><button class="btn alt s" id="mx">✕</button></div><p><span class="st '+o.status+'">'+ST[o.status]+'</span> <span class="mut">'+(o.payment_method==='mobile_money'?'Mobile Money':'À la livraison')+'</span></p>';
  h+='<div class="box" style="margin-top:10px"><b>'+esc(o.customer_name)+'</b><br>';
  if(o.phone)h+='📞 '+esc(o.phone)+'<br>📍 '+esc(o.address)+'<br><a class="btn wa s" style="margin-top:8px" target="_blank" rel="noopener" href="https://wa.me/'+wa(o.phone)+'">Écrire au client</a>';
  else h+='<span class="mut">🔒 Prenez la commande pour voir le téléphone et l\'adresse.</span>';
  h+='</div><div class="box">'+items.map(function(i){return '<div class="row"><span>'+esc(i.name)+' <span class="mut">'+esc([i.color,i.size].filter(Boolean).join('/'))+' ×'+i.quantity+'</span></span><b>'+K.fmt(i.unit_price*i.quantity)+'</b></div>';}).join('')+'<div class="row" style="margin-top:8px"><span>Livraison</span><b>'+K.fmt(o.delivery_fee)+'</b></div><div class="row"><span>Total</span><b class="price">'+K.fmt(o.total)+'</b></div></div>';
  if(!done){
    if(!o.assigned_name)h+='<button class="btn full" data-x="claim">Prendre en charge</button>';
    else if(can)h+='<button class="btn alt full" data-x="release">Libérer la commande</button>';
    if(can&&(o.assigned_name||adm)){
      h+=(NX[o.status]||[]).map(function(s){return '<button class="btn'+(s==='annulee'?' bad':'')+' full" style="margin-top:8px" data-x="st" data-s="'+s+'">'+AL[s]+'</button>';}).join('');
      h+='<label>Frais de livraison (FCFA)</label><div class="row"><input id="fee" type="number" min="0" value="'+o.delivery_fee+'"><button class="btn s" data-x="fee">OK</button></div>';
    }
  }
  h+='<p class="mut" style="margin-top:14px">'+hist.map(function(x){return esc(x.status)+' — '+esc(x.by_name||'')+' ('+new Date(x.at).toLocaleString('fr-FR')+')';}).join('<br>')+'</p></div>';
  m.innerHTML=h;document.body.appendChild(m);
  m.onclick=async function(e){
    if(e.target===m||e.target.id==='mx'){m.remove();return;}
    var b=e.target.closest('[data-x]');
    if(!b)return;
    var x=b.getAttribute('data-x'),s=b.getAttribute('data-s');
    if(s==='annulee'&&!confirm('Annuler cette commande ? Le stock sera remis.'))return;
    try{
      if(x==='claim')await K.rpc('claim_order',{p_order:id});
      else if(x==='release')await K.rpc('release_order',{p_order:id});
      else if(x==='st')await K.rpc('set_order_status',{p_order:id,p_expected:o.status,p_new:s});
      else if(x==='fee')await K.rpc('set_delivery_fee',{p_order:id,p_fee:parseInt($('#fee',m).value,10)});
      m.remove();K.toast('Fait ✓');
      await K.tabs.orders.render(el);
      detail(id,el);
    }catch(err){K.toast(err.message,1);}
  };
}
K.tabs.orders={label:'Commandes',roles:['admin','orders'],order:1,render:async function(el){
  el.innerHTML='<div class="load">Chargement…</div>';
  try{cache=await K.rpc('staff_orders');}catch(e){el.innerHTML='<p class="err">'+esc(e.message)+'</p>';return;}
  var f=K.state.of||'all';
  var list=cache.filter(function(o){return f==='all'||o.status===f;});
  var h='<div class="chips">'+['all'].concat(Object.keys(ST)).map(function(c){
    var n=c==='all'?cache.length:cache.filter(function(o){return o.status===c;}).length;
    return '<button class="chip'+(c===f?' on':'')+'" data-f="'+c+'">'+(c==='all'?'Toutes':ST[c])+' ('+n+')</button>';}).join('')+'</div>';
  if(K.state.staff.role==='admin')h+='<p style="margin-bottom:10px"><button class="btn alt s" id="csv">⬇ Export CSV</button></p>';
  h+=list.length?list.map(function(o){
    return '<div class="box" data-o="'+o.id+'" style="cursor:pointer"><div class="row"><b>'+esc(o.ref)+'</b><span class="st '+o.status+'">'+ST[o.status]+'</span></div><div class="mut">'+new Date(o.created_at).toLocaleString('fr-FR')+'</div><div class="row" style="margin-top:6px"><span>'+esc(o.customer_name)+'</span><span class="price">'+K.fmt(o.total)+'</span></div>'+(o.assigned_name?'<div class="mut">Pris par : '+esc(o.assigned_name)+'</div>':'')+'</div>';
  }).join(''):'<p class="mut center">Aucune commande.</p>';
  el.innerHTML=h;
  el.onclick=function(e){
    var c=e.target.closest('[data-f]');
    if(c){K.state.of=c.getAttribute('data-f');K.tabs.orders.render(el);return;}
    if(e.target.id==='csv'){exportCsv();return;}
    var b=e.target.closest('[data-o]');
    if(b)detail(b.getAttribute('data-o'),el);
  };
}};

/* ---------- Reglages ---------- */
var FD=[['shop_name','Nom de la boutique'],['slogan','Slogan'],['whatsapp','Numéro WhatsApp (avec 225, sans + ni espaces)'],['phone','Téléphone affiché'],['address','Adresse'],['email','E-mail'],['default_delivery_fee','Frais de livraison par défaut (FCFA)']];
K.tabs.settings={label:'Réglages',roles:['admin'],order:9,render:function(el){
  el.innerHTML='<div class="box">'+FD.map(function(f){return '<label>'+f[1]+'</label><input data-k="'+f[0]+'" value="'+esc(K.cfg[f[0]]||'')+'">';}).join('')+'<button class="btn full" style="margin-top:14px" id="sv">Enregistrer</button></div>';
  $('#sv',el).onclick=async function(){
    var rows=FD.map(function(f){return{key:f[0],value:$('[data-k="'+f[0]+'"]',el).value.trim()};});
    var g=function(k){return rows.filter(function(r){return r.key===k;})[0].value;};
    if(!/^\d{8,15}$/.test(g('whatsapp')))return K.toast('WhatsApp : chiffres seulement (ex : 2250508674626)',1);
    if(!/^\d{1,6}$/.test(g('default_delivery_fee')))return K.toast('Frais de livraison invalides',1);
    var r=await K.sb.from('settings').upsert(rows);
    if(r.error)return K.toast(r.error.message,1);
    await K.loadSettings();K.renderHd();K.renderFt();
    K.toast('Enregistré ✓');
  };
}};
})();
// FIN app4.js
